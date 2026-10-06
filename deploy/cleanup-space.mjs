// One-time, explicitly approved cleanup. Run under the existing deployment flock.
// No environment contents or raw PM2/log contents are printed or copied.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const releaseRoot = "/var/www/anshkosh-releases";
const logRoot = "/home/deploy/.pm2/logs";
const shared = "/var/www/anshkosh-shared";
const node = "/home/deploy/.nvm/versions/node/v22.23.2/bin/node";
const pm2 = "/home/deploy/.nvm/versions/node/v22.23.2/lib/node_modules/pm2/bin/pm2";
const active = `${releaseRoot}/149866d8b198909c92164c460677e0468a9d989a.BiTp0mS6`;
const rollback = `${releaseRoot}/1b125464f54ad4f2ee8fcf8d34d3c00154c9fabb.o5pzk9Xd`;
const releaseTargets = ["4a23eb0", "74972014d401fbea7d9500ff326f62f1bd1f4b11.Siq54jXU", "7abf29fd85b11b810e66ab28906529ff96f9b48d.WkaExhhN", "a221a29bbfeacf4c4d0ab7625885a51c5b61df6a.8DMOYsru"].map(name => `${releaseRoot}/${name}`);
const reportDir = "/root/anshkosh-space-cleanup-20261002";
const manifestFile = `${reportDir}/plan.json`;
const resultFile = `${reportDir}/result.json`;
const mode = process.argv[2];
assert.equal(process.getuid(), 0, "Use the approved root maintenance account");
assert.ok(["plan", "apply"].includes(mode), "Only plan/apply are supported");
assert.equal(fs.realpathSync(releaseRoot), releaseRoot);
assert.equal(fs.realpathSync(logRoot), logRoot);

function command(binary, args) {
  const result = spawnSync(binary, args, { encoding: "utf8", timeout: 20000, maxBuffer: 8 * 1048576 });
  assert.ok(!result.error && result.status === 0, `Diagnostic command failed: ${path.basename(binary)}`);
  return result.stdout;
}
function identity(filename) {
  const stat = fs.lstatSync(filename);
  return { dev: stat.dev, ino: stat.ino, size: stat.size, mtimeMs: stat.mtimeMs, uid: stat.uid, directory: stat.isDirectory(), file: stat.isFile(), nlink: stat.nlink };
}
function guardRelease(filename) {
  assert.ok(releaseTargets.includes(filename));
  assert.equal(path.dirname(filename), releaseRoot);
  assert.equal(fs.realpathSync(filename), filename, "Release must not be a symlink");
  assert.ok(fs.lstatSync(filename).isDirectory());
  assert.ok(!fs.existsSync(`${filename}/.git`), "Preserve any release containing a Git checkout");
  assert.ok(filename !== active && filename !== rollback);
}
function guardTree(directory, device) {
  for (const entry of fs.readdirSync(directory)) {
    const filename = path.join(directory, entry), stat = fs.lstatSync(filename);
    assert.equal(stat.dev, device, "Refuse cleanup crossing a filesystem/mount");
    // rm unlinks symlinks, never traverses their targets (normal node_modules links).
    if (stat.isDirectory()) guardTree(filename, device);
    else assert.ok(stat.isFile() || stat.isSymbolicLink(), "Refuse unexpected special files");
  }
}
function guardLog(filename) {
  assert.equal(path.dirname(filename), logRoot);
  assert.match(path.basename(filename), /^[A-Za-z0-9-]+__\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.log$/);
  const stat = fs.lstatSync(filename);
  assert.ok(stat.isFile() && stat.nlink === 1, "Only regular, unlinked archive logs");
  assert.equal(fs.realpathSync(filename), filename);
}
function pm2List() {
  const processes = JSON.parse(command("/usr/sbin/runuser", ["-u", "deploy", "--", node, pm2, "jlist"]));
  for (const name of ["anshkosh-web-3000", "worker-email", "worker-notification", "worker-sync"]) {
    const item = processes.find(item => item.name === name);
    assert.equal(item?.pm2_env?.status, "online", `${name} must be online`);
    assert.equal(item.pm2_env.pm_cwd, active, `${name} must use preserved active release`);
  }
  return processes;
}
function verifyUnreferenced(processes, logs) {
  const targets = [...releaseTargets, ...logs];
  const blocked = value => typeof value === "string" && targets.some(target => value === target || value.startsWith(`${target}/`));
  const references = processes.map(item => item.pm2_env);
  for (const name of ["dump.pm2", "dump.pm2.bak"]) {
    const filename = `/home/deploy/.pm2/${name}`;
    if (fs.existsSync(filename)) references.push(...JSON.parse(fs.readFileSync(filename, "utf8")));
  }
  for (const item of references) {
    for (const key of ["pm_cwd", "pm_exec_path", "exec_interpreter", "cwd", "script"]) assert.ok(!blocked(item?.[key]), "A PM2 live/saved process references a cleanup target");
  }
  for (const pid of fs.readdirSync("/proc").filter(name => /^\d+$/.test(name))) {
    const links = [`/proc/${pid}/cwd`, `/proc/${pid}/exe`];
    try { links.push(...fs.readdirSync(`/proc/${pid}/fd`).map(fd => `/proc/${pid}/fd/${fd}`)); } catch (error) { if (!["ENOENT", "ESRCH"].includes(error.code)) throw error; }
    for (const link of links) {
      let target;
      try { target = fs.readlinkSync(link); } catch (error) { if (["ENOENT", "ESRCH", "EINVAL"].includes(error.code)) continue; throw error; }
      assert.ok(!blocked(target), "A running process has a cleanup target open");
    }
  }
}
async function publicHealth() {
  for (const route of ["/api/cron/health", "/.well-known/release.json", "/", "/login"]) {
    const response = await fetch(`https://www.anshkosh.com${route}`, { signal: AbortSignal.timeout(15000), cache: "no-store" });
    assert.equal(response.status, 200, `Public page check: ${route}`);
    if (route.endsWith("health")) assert.equal((await response.json()).db, "connected");
    if (route.endsWith("release.json")) assert.equal((await response.json()).commit, "149866d8b198909c92164c460677e0468a9d989a");
    if (route === "/") {
      const html = await response.text();
      const assets = [...new Set([...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"<>]+)"/g)].map(match => match[1].replaceAll("&amp;", "&")))];
      assert.ok(assets.length);
      for (const asset of assets) assert.equal((await fetch(`https://www.anshkosh.com${asset}`, { signal: AbortSignal.timeout(10000) })).status, 200, "Public static asset check");
    }
  }
}
async function verifyRollback() {
  assert.equal(fs.realpathSync(rollback), rollback);
  assert.ok(fs.existsSync(`${rollback}/.next/BUILD_ID`) && fs.existsSync(`${rollback}/deploy.runtime.config.json`));
  const socketCheck = command("/usr/sbin/ss", ["-ltn"]);
  assert.ok(!/:3014\s/.test(socketCheck), "Loopback test port is already occupied");
  const logFile = `${reportDir}/rollback-probe.log`, fd = fs.openSync(logFile, "wx", 0o600);
  const child = spawn("/usr/sbin/runuser", ["-u", "deploy", "--", node, `--env-file=${shared}/.env`, `${rollback}/node_modules/next/dist/bin/next`, "start", "-H", "127.0.0.1", "-p", "3014"], { cwd: rollback, detached: true, stdio: ["ignore", fd, fd] });
  const exited = new Promise(resolve => { child.once("exit", resolve); child.once("error", resolve); });
  let started = false;
  try {
    for (let count = 0; count < 20; count++) {
      assert.ok(child.exitCode === null, "Rollback probe exited unexpectedly");
      try {
        const response = await fetch("http://127.0.0.1:3014/api/cron/health", { signal: AbortSignal.timeout(1500) });
        if (response.status === 200 && (await response.json()).db === "connected") { started = true; break; }
      } catch {}
      await delay(500);
    }
    assert.ok(started, "Rollback release failed database health probe");
    for (const route of ["/", "/login", "/discover"]) assert.equal((await fetch(`http://127.0.0.1:3014${route}`, { signal: AbortSignal.timeout(10000) })).status, 200, "Rollback page probe failed");
    assert.equal((await (await fetch("http://127.0.0.1:3014/.well-known/release.json", { signal: AbortSignal.timeout(10000) })).json()).commit, path.basename(rollback).split(".")[0]);
  } finally {
    if (child.pid) {
      try { process.kill(-child.pid, "SIGTERM"); } catch (error) { if (error.code !== "ESRCH") throw error; }
      await Promise.race([exited, delay(3000)]);
      try { process.kill(-child.pid, "SIGKILL"); } catch (error) { if (error.code !== "ESRCH") throw error; }
    }
    fs.closeSync(fd);
    assert.ok(!/:3014\s/.test(command("/usr/sbin/ss", ["-ltn"])), "Rollback probe must stop before cleanup");
  }
}
function df() { return command("/usr/bin/df", ["-B1", "/"]).trim(); }
function stateGuard() {
  const state = JSON.parse(fs.readFileSync(`${shared}/state/current.json`, "utf8"));
  assert.equal(state.release, active, "Active deployment changed; stop and re-plan");
  assert.equal(state.port, 3000);
  return state;
}
stateGuard();
await publicHealth();
if (mode === "plan") {
  fs.mkdirSync(reportDir, { mode: 0o700 }); // Refuse an existing report: never overwrite a previous cleanup.
  await verifyRollback();
  const latest = new Map(), archives = [];
  for (const name of fs.readdirSync(logRoot)) {
    if (!/^[A-Za-z0-9-]+__\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.log$/.test(name)) continue;
    const filename = `${logRoot}/${name}`;
    guardLog(filename);
    const stream = name.split("__")[0], stat = identity(filename);
    archives.push({ filename, stream, identity: stat });
    if (!latest.has(stream) || name > path.basename(latest.get(stream))) latest.set(stream, filename);
  }
  const logs = archives.filter(item => latest.get(item.stream) !== item.filename);
  for (const filename of releaseTargets) { guardRelease(filename); guardTree(filename, fs.statSync(releaseRoot).dev); }
  verifyUnreferenced(pm2List(), logs.map(item => item.filename));
  const plan = { createdAt: new Date().toISOString(), active, rollback, rollbackVerified: true, before: df(), releases: releaseTargets.map(filename => ({ filename, identity: identity(filename) })), logs, retainedArchives: [...latest.values()] };
  fs.writeFileSync(manifestFile, JSON.stringify(plan, null, 2), { mode: 0o600, flag: "wx" });
  console.log(JSON.stringify({ active, rollback, rollbackVerified: true, releaseTargets, logsToDelete: logs.length, logBytesToDelete: logs.reduce((sum, item) => sum + item.identity.size, 0), retainedArchives: plan.retainedArchives, before: plan.before }));
} else {
  assert.ok(!fs.existsSync(resultFile), "Cleanup already has a result; review rather than repeat");
  const plan = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  assert.ok(Date.now() - Date.parse(plan.createdAt) < 30 * 60000 && plan.rollbackVerified);
  assert.deepEqual(plan.releases.map(item => item.filename), releaseTargets);
  for (const item of plan.releases) { guardRelease(item.filename); assert.deepEqual(identity(item.filename), item.identity); guardTree(item.filename, fs.statSync(releaseRoot).dev); }
  for (const item of plan.logs) { guardLog(item.filename); assert.deepEqual(identity(item.filename), item.identity); }
  for (const filename of plan.retainedArchives) guardLog(filename);
  const beforeProcesses = pm2List();
  verifyUnreferenced(beforeProcesses, plan.logs.map(item => item.filename));
  const result = { startedAt: new Date().toISOString(), before: df(), removedLogs: [], removedReleases: [], preserved: [active, rollback, "/var/www/anshkosh", `${shared}/backups`, `${shared}/static`], complete: false };
  const save = () => fs.writeFileSync(resultFile, JSON.stringify(result, null, 2), { mode: 0o600 });
  save();
  try {
    for (const item of plan.logs) { guardLog(item.filename); assert.deepEqual(identity(item.filename), item.identity); fs.unlinkSync(item.filename); result.removedLogs.push(item.filename); save(); }
    for (const item of plan.releases) { stateGuard(); guardRelease(item.filename); fs.rmSync(item.filename, { recursive: true }); result.removedReleases.push(item.filename); save(); }
    await publicHealth();
    const afterProcesses = pm2List();
    for (const name of ["anshkosh-web-3000", "worker-email", "worker-notification", "worker-sync"]) {
      const before = beforeProcesses.find(item => item.name === name), after = afterProcesses.find(item => item.name === name);
      assert.equal(after.pid, before.pid, "Production process must not restart");
      assert.equal(after.pm2_env.restart_time, before.pm2_env.restart_time);
    }
    result.after = df(); result.finishedAt = new Date().toISOString(); result.complete = true; save();
    console.log(JSON.stringify({ removedLogs: result.removedLogs.length, removedReleases: result.removedReleases.length, before: result.before, after: result.after, productionHealthPassed: true, productionProcessesUnchanged: true }));
  } finally { save(); }
}
