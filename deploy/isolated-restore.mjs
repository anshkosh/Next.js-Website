import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

export function restoreDatabase(dump, backupDir, run) {
  const name = `anshkosh_restore_${randomBytes(8).toString("hex")}`;
  const scratch = fs.mkdtempSync(`${backupDir}/restore-test-`);
  fs.chmodSync(scratch, 0o700);
  const data = path.join(scratch, "data");
  const pg = (binary, args, input) => run(`/usr/pgsql-15/bin/${binary}`, args,
    { env: { PATH: process.env.PATH, LANG: "C.UTF-8" }, ...(input ? { input, maxBuffer: 256 * 1024 * 1024 } : {}) });
  let started = false;
  try {
    pg("initdb", ["-D", data, "-A", "trust", "-U", "restore_test", "--no-instructions"]);
    pg("pg_ctl", ["-D", data, "-l", path.join(scratch, "postgres.log"), "-w", "start", "-o", `-c listen_addresses='' -k ${scratch} -p 25432 -c shared_buffers=32MB -c max_connections=10`]); started = true;
    const connection = ["-h", scratch, "-p", "25432", "-U", "restore_test"];
    pg("psql", [...connection, "-v", "ON_ERROR_STOP=1", "-d", "postgres", "-c", `CREATE DATABASE "${name}" TEMPLATE template0`]);
    pg("pg_restore", [...connection, "--exit-on-error", "--no-owner", "--no-acl", "-d", name], dump);
    const counts = pg("psql", [...connection, "-v", "ON_ERROR_STOP=1", "-d", name, "-Atc", 'SELECT (SELECT COUNT(*) FROM "User"), (SELECT COUNT(*) FROM "Startup")']);
    if (!/^\d+\|\d+\s*$/.test(counts)) throw new Error("Restored application tables could not be verified.");
    return counts.trim();
  } finally {
    // A timed-out startup can still leave a server behind. Stop before deleting anything.
    if (started || fs.existsSync(path.join(data, "postmaster.pid"))) pg("pg_ctl", ["-D", data, "-m", "fast", "-w", "stop"]);
    const resolved = fs.realpathSync(scratch);
    if (path.dirname(resolved) !== fs.realpathSync(backupDir) || !/^restore-test-[A-Za-z0-9]{6}$/.test(path.basename(resolved))) throw new Error("Temporary restore path failed the cleanup guard.");
    fs.rmSync(resolved, { recursive: true });
  }
}
