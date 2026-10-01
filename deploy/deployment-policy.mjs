// Conservative automatic migration gate. Anything else needs a reviewed deployment.
export function assertAdditiveMigration(sql, name = "migration") {
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
