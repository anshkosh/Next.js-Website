// One-time manual root operation; never prints secrets or changes application credentials.
import fs from "node:fs";
import { randomBytes, createHash } from "node:crypto";
if (process.getuid?.() !== 0) throw new Error("Configure operations as the VPS root operator.");
const filename = "/var/www/anshkosh-shared/.env";
const owner = fs.statSync(filename);
if ((owner.mode & 0o777) !== 0o600 || !owner.isFile() || fs.lstatSync(filename).isSymbolicLink()) throw new Error("Environment file must be regular, non-symlink and mode 600.");
const original = fs.readFileSync(filename, "utf8");
const settings = { OPS_ALERT_EMAIL: "anshkosh@gmail.com", BACKUP_ENCRYPTION_KEY: randomBytes(32).toString("hex"), OPS_SCANNER_MODE: "deferred" };
let result = original;
for (const [name, value] of Object.entries(settings)) {
  const matches = [...original.matchAll(new RegExp(`^${name}\\s*=(.*)$`, "gm"))];
  if (matches.length > 1) throw new Error(`Duplicate ${name} requires manual review.`);
  if (matches.length) {
    if (!matches[0][1].trim()) throw new Error(`Empty ${name} requires manual review.`);
    // Preserve already configured encryption keys, recipients and monitoring policy.
    continue;
  }
  result += `\n${name}=${value}\n`;
}
if (result !== original) {
  const dir = "/var/www/anshkosh-shared/backups/operations";
  if (!fs.statSync(dir).isDirectory() || (fs.statSync(dir).mode & 0o777) !== 0o700) throw new Error("Private operations backup directory is required.");
  const backup = `${dir}/env-before-operations-${Date.now()}-${randomBytes(4).toString("hex")}.env`;
  fs.writeFileSync(backup, original, { flag: "wx", mode: 0o600 }); fs.chownSync(backup, owner.uid, owner.gid);
  const temporary = `${filename}.operations-${randomBytes(8).toString("hex")}`;
  fs.writeFileSync(temporary, result, { flag: "wx", mode: 0o600 }); fs.chownSync(temporary, owner.uid, owner.gid);
  if (createHash("sha256").update(fs.readFileSync(filename)).digest("hex") !== createHash("sha256").update(original).digest("hex")) throw new Error("Environment changed concurrently; staged file retained, live file untouched.");
  fs.renameSync(temporary, filename);
}
console.log("Operations settings prepared; previous environment retained privately. Encryption key not printed. Application processes were not restarted.");
