// Install root-owned at /usr/local/libexec/anshkosh-deploy.mjs; runs as deploy.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { assertAdditiveMigration } from "./deployment-policy.mjs";

const shared = "/var/www/anshkosh-shared";
const [release, commit] = process.argv.slice(2);
assert.match(commit || "", /^[0-9a-f]{40}$/);
assert.equal(fs.realpathSync(release), release);
assert.equal(path.dirname(release), "/var/www/anshkosh-releases");
assert.match(path.basename(release), new RegExp(`^${commit}\\.[A-Za-z0-9]{8}$`));
const old = JSON.parse(fs.readFileSync(`${shared}/state/current.json`, "utf8"));
const port = old.port === 3000 ? 3012 : 3000;
const webName = `anshkosh-web-${port}`;
const workers = ["worker-email", "worker-notification", "worker-sync"];
let candidateStarted = false;
let routed = false;
let workersChanged = false;
let committed = false;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: release, env: process.env, stdio: "inherit", ...options,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`${command} failed (${result.status ?? "unavailable"})`);
  }
  return result;
}
const pm2 = (...args) => run("pm2", args);
const route = (target) => run("sudo", ["-n", "/usr/local/sbin/anshkosh-route", String(target)]);

async function health(origin, expectedCommit) {
  const deadline = Date.now() + 60000;
  do {
    try {
      const response = await fetch(`${origin}/api/cron/health`, { signal: AbortSignal.timeout(5000) });
      const data = await response.json();
      assert.equal(response.status, 200);
      assert.equal(data.db, "connected");
      if (expectedCommit) {
        const version = await fetch(`${origin}/.well-known/release.json`, { signal: AbortSignal.timeout(5000) });
        assert.equal(version.status, 200);
        assert.equal((await version.json()).commit, expectedCommit);
      }
      console.log(`PASS health and release identity: ${origin}`);
      return;
    } catch {
      await delay(2000);
    }
  } while (Date.now() < deadline);
  throw new Error(`Health/release check failed: ${origin}`);
}

async function publicAssets(origin) {
  const html = await (await fetch(origin, { signal: AbortSignal.timeout(10000) })).text();
  const assets = [...new Set([...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"<>]+)"/g)].map(match => match[1].replaceAll("&amp;", "&")))];
  assert.ok(assets.length > 0, "Homepage includes built assets");
  for (const asset of assets) {
    assert.equal((await fetch(origin + asset, { signal: AbortSignal.timeout(10000) })).status, 200, asset);
  }
  console.log(`PASS ${assets.length} public page assets`);
}

async function migrateSafely() {
  const requireRelease = createRequire(`${release}/package.json`);
  const { PrismaClient } = requireRelease("@prisma/client");
  const db = new PrismaClient();
  try {
    const applied = await db.$queryRawUnsafe('SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL');
    const names = new Set(applied.map(row => row.migration_name));
    const directory = `${release}/prisma/migrations`;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory() || names.has(entry.name)) continue;
      assertAdditiveMigration(fs.readFileSync(`${directory}/${entry.name}/migration.sql`, "utf8"), entry.name);
    }
  } finally {
    await db.$disconnect();
  }
  const url = new URL(process.env.DATABASE_URL);
  const backups = `${shared}/backups`;
  fs.mkdirSync(backups, { recursive: true, mode: 0o700 });
  const filename = `${backups}/${commit}-${Date.now()}.dump`;
  run("/usr/pgsql-15/bin/pg_dump", ["-h", url.hostname, "-p", url.port || "5432", "-U", decodeURIComponent(url.username), "-d", url.pathname.slice(1), "-Fc", "-f", filename], {
    env: { ...process.env, PGPASSWORD: decodeURIComponent(url.password) },
  });
  fs.chmodSync(filename, 0o600);
  run("/usr/pgsql-15/bin/pg_restore", ["-l", filename], { stdio: "ignore" });
  console.log("Database backup validated; applying approved additive migrations");
  run("npx", ["prisma", "migrate", "deploy"]);
}

async function main() {
  console.log(`Preparing release ${commit}. Current site remains online.`);
  fs.copyFileSync(`${shared}/.env`, `${release}/.env`);
  fs.chmodSync(`${release}/.env`, 0o600);
  process.env.NODE_ENV = "production";
  process.env.NEXT_TELEMETRY_DISABLED = "1";
  process.env.NODE_OPTIONS = "--max-old-space-size=1536";
  // npm ci must include build/test dependencies even in production mode.
  run("npm", ["ci", "--include=dev"]);
  run("npm", ["test", "--", "--maxWorkers=2"]);
  await migrateSafely();
  fs.mkdirSync(`${release}/public/.well-known`, { recursive: true });
  fs.writeFileSync(`${release}/public/.well-known/release.json`, JSON.stringify({ commit, builtAt: new Date().toISOString() }));
  run("npm", ["run", "build"]);
  const config = createRequire(`${release}/package.json`)(`${release}/ecosystem.config.js`);
  const web = config.apps.find(app => app.name === "anshkosh-web");
  assert.ok(web, "Web process configuration exists");
  assert.deepEqual(config.apps.filter(app => workers.includes(app.name)).map(app => app.name).sort(), [...workers].sort());
  web.name = webName;
  web.cwd = release;
  web.env = { ...web.env, PORT: port, NODE_ENV: "production" };
  for (const worker of config.apps.filter(app => workers.includes(app.name))) worker.cwd = release;
  const runtime = `${release}/deploy.runtime.config.json`;
  fs.writeFileSync(runtime, JSON.stringify(config));
  candidateStarted = true;
  pm2("start", runtime, "--only", webName);
  await health(`http://127.0.0.1:${port}`, commit);
  run("node", ["scripts/verify-seo.mjs", `http://127.0.0.1:${port}`]);
  await publicAssets(`http://127.0.0.1:${port}`);
  fs.cpSync(`${release}/.next/static`, `${shared}/static`, { recursive: true });
  route(port);
  routed = true;
  workersChanged = true;
  pm2("delete", ...workers);
  pm2("start", runtime, "--only", workers.join(","));
  await delay(12000);
  const processes = JSON.parse(run("pm2", ["jlist"], { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }).stdout);
  for (const name of [webName, ...workers]) {
    const item = processes.find(process => process.name === name);
    assert.equal(item?.pm2_env.status, "online", `${name}: online`);
    assert.equal(item.pm2_env.pm_cwd, release, `${name}: release directory`);
    assert.equal(item.pm2_env.restart_time, 0, `${name}: no crash loop`);
  }
  await health("https://www.anshkosh.com", commit);
  run("node", ["scripts/verify-seo.mjs", "https://www.anshkosh.com"]);
  await publicAssets("https://www.anshkosh.com");
  pm2("save");
  fs.writeFileSync(`${shared}/state/current.json.tmp`, JSON.stringify({ commit, release, port, webName, updatedAt: new Date().toISOString() }));
  fs.renameSync(`${shared}/state/current.json.tmp`, `${shared}/state/current.json`);
  committed = true;
  pm2("delete", old.webName);
  pm2("save");
  console.log(`DEPLOYMENT SUCCESS: ${commit}`);
}

try {
  await main();
} catch (error) {
  // Never print database URLs, environment values or potentially sensitive payloads.
  console.error(`Deployment failed: ${error.message}`);
  if (!committed) {
    try {
      if (routed) route(old.port);
      if (workersChanged) {
        for (const name of workers) run("pm2", ["delete", name], { stdio: "ignore" });
        const oldConfig = fs.existsSync(`${old.release}/deploy.runtime.config.json`)
          ? `${old.release}/deploy.runtime.config.json` : `${old.release}/ecosystem.config.js`;
        pm2("start", oldConfig, "--only", workers.join(","));
      }
      if (candidateStarted) pm2("delete", webName);
      pm2("save");
      console.error("Previous release retained/restored. Database was not reset; backups retained.");
    } catch (rollbackError) {
      console.error(`ROLLBACK NEEDS ATTENTION: ${rollbackError.message}`);
    }
  }
  process.exitCode = 1;
}
