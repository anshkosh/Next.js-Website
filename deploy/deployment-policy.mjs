// Conservative automatic migration gate. Anything else needs a reviewed deployment.
import { createHash } from "node:crypto";

// Exact SQL reviewed for this release. Pinning the content keeps advanced but
// additive operations from broadening the automatic-deploy allowlist.
const REVIEWED_MIGRATIONS = new Map([
  [
    "20261023130000_ai_content_moderation",
    "6548a938864f0f7b433b20e96ce5ba552887fe7aa8e0184081644479584c47bb",
  ],
  [
    "20261018150000_beta_tester_signups",
    "7c6c04824dd1f58822f539ebc7e0473714e7adba9b1bbab0d372dc50c9e930df",
  ],
]);

export function assertAdditiveMigration(sql, name = "migration") {
  const reviewedHash = REVIEWED_MIGRATIONS.get(name);
  if (reviewedHash && createHash("sha256").update(sql).digest("hex") === reviewedHash) return;

  const normalized = sql.replace(/'(?:''|[^'])*'|"(?:""|[^"])*"|--[^\n]*|\/\*[\s\S]*?\*\//g, token =>
    token.startsWith("'") ? "'value'" : token.startsWith('"') ? '"identifier"' : " ");
  const statements = normalized.split(";").map(value => value.trim()).filter(Boolean);
  if (!statements.length) throw new Error(`Migration ${name} is empty`);
  for (const statement of statements) {
    const create = /^CREATE\s+(TABLE\b|(?:UNIQUE\s+)?INDEX\b)/i.test(statement);
    const add = /^ALTER\s+TABLE\s+(?:ONLY\s+)?[\w."\s]+?\s+ADD\b/i.test(statement);
    const unsafe = /\b(DROP|TRUNCATE|DELETE|UPDATE|INSERT|RENAME|TYPE|EXECUTE|CALL|DO|GRANT|REVOKE|COPY|DISABLE|ENABLE)\b|\bALTER\s+COLUMN\b|\bSET\s+(NOT|DATA)\b/i.test(statement);
    if ((!create && !add) || unsafe || (add && (statement.match(/\bALTER\b/gi) || []).length !== 1)) {
      throw new Error(`Migration ${name} needs manual review; no migration was run`);
    }
    if (add && /\bNOT\s+NULL\b/i.test(statement) && !/\bDEFAULT\b/i.test(statement)) {
      throw new Error(`Migration ${name} adds a required value without a default`);
    }
  }
}
