// Run from a release directory with Node --env-file. Never prints credentials.
import fs from "node:fs";
import path from "node:path";
import { randomBytes, createHash } from "node:crypto";
import { sealBackup, openBackup } from "./backup-crypto.mjs";
import { restoreDatabase } from "./isolated-restore.mjs";
import { scannerRequired, resourceWarnings, sanitizeOnlyFromSource } from "./monitor-policy.mjs";
import os from "node:os";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { once } from "node:events";
import net from "node:net";

const require = createRequire(path.join(process.cwd(), "package.json"));
const { PrismaClient } = require("@prisma/client");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const Redis = require("ioredis");
const shared = "/var/www/anshkosh-shared";
const stateDir = `${shared}/state/operations`;
const backupDir = `${shared}/backups/operations`;
const command = process.argv[2] || "check";
const db = new PrismaClient();
const storage = new S3Client({ region: "auto", endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID || "", secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "" } });
const bucket = process.env.BACKUP_R2_BUCKET || process.env.R2_BUCKET_NAME;
function run(binary, args, options = {}) {
  const result = spawnSync(binary, args, { encoding: "utf8", timeout: 180000, ...options });
  if (result.error || result.status !== 0) throw new Error(`Operation failed: ${path.basename(binary)} (details retained in server journal where applicable)`);
  return result.stdout;
}
function writeState(name, value) {
  fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  const target = `${stateDir}/${name}.json`;
  fs.writeFileSync(`${target}.tmp`, JSON.stringify(value), { mode: 0o600 }); fs.renameSync(`${target}.tmp`, target);
  if (process.getuid?.() === 0) { const owner = fs.statSync(stateDir); fs.chownSync(target, owner.uid, owner.gid); }
}
function readState(name) { try { return JSON.parse(fs.readFileSync(`${stateDir}/${name}.json`, "utf8")); } catch { return null; } }
async function alert(message) {
  const recipient = process.env.OPS_ALERT_EMAIL;
  if (!recipient || !process.env.BREVO_API_KEY) { console.error("Alert delivery is not configured. Check OPS_ALERT_EMAIL and BREVO_API_KEY."); return false; }
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST", signal: AbortSignal.timeout(15000),
    headers: { "Content-Type": "application/json", "api-key": process.env.BREVO_API_KEY },
    body: JSON.stringify({ sender: { name: "Anshkosh operations", email: process.env.EMAIL_FROM || "noreply@anshkosh.com" }, to: [{ email: recipient }],
      subject: "Anshkosh operations alert", textContent: message }),
  });
  if (!response.ok) throw new Error("Alert delivery failed; check the operations journal.");
  return true;
}
function encryptionKey() {
  if (!/^[a-f0-9]{64}$/i.test(process.env.BACKUP_ENCRYPTION_KEY || "")) throw new Error("Configure BACKUP_ENCRYPTION_KEY as 32 random bytes in hex, saved outside Git and separately from backup storage.");
  return Buffer.from(process.env.BACKUP_ENCRYPTION_KEY, "hex");
}
async function backup() {
  const key = encryptionKey();
  if (!bucket) throw new Error("Configure a backup bucket.");
  fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
  const url = new URL(process.env.DATABASE_URL);
  const filename = `${backupDir}/anshkosh-${Date.now()}-${randomBytes(4).toString("hex")}.dump`;
  run("/usr/pgsql-15/bin/pg_dump", ["-h", url.hostname, "-p", url.port || "5432", "-U", decodeURIComponent(url.username), "-d", url.pathname.slice(1), "-Fc", "-f", filename],
    { env: { ...process.env, PGPASSWORD: decodeURIComponent(url.password) } });
  fs.chmodSync(filename, 0o600);
  if (process.getuid?.() === 0) { const owner = fs.statSync(backupDir); fs.chownSync(filename, owner.uid, owner.gid); }
  run("/usr/pgsql-15/bin/pg_restore", ["--list", filename]);
  if (fs.statSync(filename).size > 256 * 1024 * 1024) throw new Error("Backup exceeds the 256 MB encrypted-upload safety bound; configure streaming before continuing. Local backup retained.");
  const body = sealBackup(fs.readFileSync(filename), key);
  const objectKey = `private-backups/${path.basename(filename)}.aes`;
  const digest = createHash("sha256").update(body).digest("hex");
  await storage.send(new PutObjectCommand({ Bucket: bucket, Key: objectKey, Body: body, ContentType: "application/octet-stream", Metadata: { sha256: digest } }));
  // Download and authenticate the actual off-site object before recording success.
  const remote = await storage.send(new GetObjectCommand({ Bucket: bucket, Key: objectKey }));
  const downloaded = Buffer.from(await remote.Body.transformToByteArray());
  if (createHash("sha256").update(downloaded).digest("hex") !== digest) throw new Error("Off-site backup verification failed; local backup retained.");
  openBackup(downloaded, key);
  const state = { at: Date.now(), filename, bucket, key: objectKey, sha256: digest };
  writeState("backup", state);
  console.log("Database backup validated, encrypted, uploaded and read back. Local backups retained.");
  return state;
}
async function restoreTest() {
  if (process.getuid?.() === 0) throw new Error("Run the isolated restore test as deploy, never as root.");
  const previous = readState("backup");
  if (!previous || Date.now() - previous.at > 36 * 3600000) throw new Error("Run a fresh verified off-site backup first.");
  const remote = await storage.send(new GetObjectCommand({ Bucket: previous.bucket, Key: previous.key }));
  const encrypted = Buffer.from(await remote.Body.transformToByteArray());
  if (encrypted.subarray(0, 4).toString() !== "AKB1" || createHash("sha256").update(encrypted).digest("hex") !== previous.sha256) throw new Error("Off-site backup integrity check failed.");
  const dump = openBackup(encrypted, encryptionKey());
  // Separate PostgreSQL instance, private Unix socket, no TCP listener, no production credentials.
  // No CREATEDB grant or postgres/root privileges on the production cluster are needed.
  restoreDatabase(dump, backupDir, run);
  writeState("restore", { at: Date.now(), backupKey: previous.key });
  console.log("Off-site backup restored and verified in an isolated database; cleanup completed.");
}
async function checkAdmin(apply) {
  const email = "anshkosh@gmail.com";
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.emailVerified || user.banned) throw new Error("The requested admin must first register, verify their email and have an active account. No placeholder account or password will be created.");
  if (!apply) { console.log(`Requested admin account: ${user.role === "admin" ? "access already granted" : "verified and eligible; grant still required"}`); return; }
  if (process.getuid?.() !== 0) throw new Error("Admin grant requires the VPS root operator, not the deployment key.");
  await backup();
  await db.$transaction(async tx => {
    const current = await tx.user.findUniqueOrThrow({ where: { email } });
    if (!current.emailVerified || current.banned) throw new Error("Account eligibility changed; no grant performed.");
    await tx.user.update({ where: { id: current.id }, data: { role: "admin" } });
    await tx.session.deleteMany({ where: { userId: current.id } });
  });
  console.log("Admin role granted to the requested verified account. Sign in again. Password unchanged; backup retained.");
}
async function check() {
  const failures = [];
  const sanitizeOnly = (() => { try { return sanitizeOnlyFromSource(fs.readFileSync(path.join(process.cwd(), "lib/uploads/scan-mode.ts"), "utf8")); } catch { return false; } })();
  const requireScanner = scannerRequired(process.env.OPS_SCANNER_MODE, fs.existsSync(path.join(process.cwd(), "lib/uploads/safety.ts")), sanitizeOnly);
  try {
    const response = await fetch("https://www.anshkosh.com/api/cron/health", { signal: AbortSignal.timeout(10000) });
    if (!response.ok || (await response.json()).db !== "connected") failures.push("Public website/database health check failed.");
  } catch { failures.push("Public website is unreachable."); }
  try { await db.$queryRaw`SELECT 1`; } catch { failures.push("Database query failed."); }
  const redis = new Redis({ host: process.env.REDIS_HOST || "127.0.0.1", port: Number(process.env.REDIS_PORT || 6379), password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 1, connectTimeout: 3000, commandTimeout: 3000, retryStrategy: () => null });
  redis.on("error", () => {});
  try { await redis.ping(); } catch { failures.push("Redis is unavailable."); } finally { redis.disconnect(); }
  try {
    const pm2 = path.resolve(path.dirname(process.execPath), "../lib/node_modules/pm2/bin/pm2");
    const processes = JSON.parse(run(process.execPath, [pm2, "jlist"], { env: { ...process.env, PM2_HOME: "/home/deploy/.pm2" } }));
    for (const name of ["worker-email", "worker-notification", "worker-sync"]) {
      if (!processes.some(entry => entry.name === name && entry.pm2_env?.status === "online")) failures.push(`${name} is not online.`);
    }
    if (!processes.some(entry => /^anshkosh-web-/.test(entry.name) && entry.pm2_env?.status === "online")) failures.push("No production web process is online.");
  } catch { failures.push("PM2 worker status could not be checked."); }
  if (requireScanner) try {
    const socket = net.createConnection({ host: "127.0.0.1", port: Number(process.env.CLAMAV_PORT || 3310) });
    socket.setTimeout(3000, () => socket.destroy(new Error("timeout")));
    try { await once(socket, "connect"); } finally { socket.destroy(); }
  } catch { failures.push("Upload antivirus is unavailable."); }
  if (requireScanner) try {
    const signatures = ["daily.cvd", "daily.cld"].map(name => `/var/lib/clamav/${name}`).filter(name => fs.existsSync(name));
    if (!signatures.length || Math.max(...signatures.map(name => fs.statSync(name).mtimeMs)) < Date.now() - 3 * 86400000) failures.push("Antivirus signatures are missing or older than three days.");
  } catch { failures.push("Antivirus signature age could not be checked."); }
  if (sanitizeOnly) try { run("qpdf", ["--version"]); } catch { failures.push("qpdf is not installed; PDF uploads will fail until it is."); }
  try {
    const stat = fs.statfsSync(shared);
    if (stat.bavail / stat.blocks < .15) failures.push("VPS disk has less than 15% free space.");
  } catch { failures.push("Disk capacity check failed."); }
  try {
    const memory = fs.readFileSync("/proc/meminfo", "utf8");
    const memoryBytes = name => Number(memory.match(new RegExp(`^${name}:\\s+(\\d+) kB$`, "m"))?.[1] ?? NaN) * 1024;
    failures.push(...resourceWarnings({ availableBytes: memoryBytes("MemAvailable"), totalBytes: memoryBytes("MemTotal"), load15: os.loadavg()[2], cpuCount: os.cpus().length }));
  } catch { failures.push("VPS resource pressure could not be checked."); }
  const lastBackup = readState("backup"), lastRestore = readState("restore");
  if (!lastBackup || Date.now() - lastBackup.at > 36 * 3600000) failures.push("No verified off-site backup in the last 36 hours.");
  if (!lastRestore || Date.now() - lastRestore.at > 8 * 86400000) failures.push("No successful isolated restore check in the last 8 days.");
  if (!process.env.OPS_ALERT_EMAIL || !process.env.BREVO_API_KEY) failures.push("Operations email alerts are not configured.");
  const message = failures.join("\n");
  const previous = readState("health");
  if (message && (!previous || previous.message !== message || Date.now() - previous.alertAt > 6 * 3600000)) {
    const sent = await alert(message);
    writeState("health", { message, alertAt: sent ? Date.now() : 0 });
  } else if (!message && previous?.message) {
    if (await alert("Anshkosh operations checks have recovered.")) writeState("health", { message: "", alertAt: Date.now() });
  }
  if (failures.length) throw new Error(message);
  console.log(`Website, database, Redis, PM2, disk, memory/load, off-site backup and restore checks passed. Antivirus: ${requireScanner ? "checked" : sanitizeOnly ? "not in use (uploads are sanitised; qpdf present)" : "deferred pending approval; not verified"}.`);
}
try {
  if (command === "backup") await backup();
  else if (command === "restore-test") await restoreTest();
  else if (command === "check-admin") await checkAdmin(false);
  else if (command === "grant-admin") await checkAdmin(true);
  else if (command === "check") await check();
  else if (command === "test-alert") { if (!(await alert("Anshkosh operations: test alert. No failure reported."))) throw new Error("Alert not delivered"); console.log("Test alert accepted by mail provider; confirm receipt."); }
  else throw new Error("Unknown operation");
} catch (error) {
  console.error(error.message);
  if (["backup", "restore-test"].includes(command)) await alert(`${command} failed. Check the VPS operations journal.`).catch(() => {});
  process.exitCode = 1;
} finally { await db.$disconnect(); storage.destroy(); }
