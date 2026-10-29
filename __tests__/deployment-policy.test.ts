import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { assertAdditiveMigration } from "../deploy/deployment-policy.mjs";

it("keeps the founder journal release migrations within the automatic deploy gate", () => {
  for (const name of [
    "20261016160000_founder_journal",
    "20261017120000_founder_journal_rich_text",
    "20261017130000_journal_review_and_scheduling",
    "20261018200000_newsletter_confirmation",
    "20261018210000_notification_outbox",
    "20261022040000_account_date_of_birth",
    "20261022060000_account_media_erasure",
    "20261023130000_ai_content_moderation",
    "20261030120000_content_edit_history_and_comment_access",

    "20261023120000_update_moderation_visibility",
  ]) {
    const sql = readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8");
    expect(() => assertAdditiveMigration(sql, name)).not.toThrow();
  }
});

it("allows the exact reviewed beta tester migration, but blocks modified SQL", () => {
  const name = "20261018150000_beta_tester_signups";
  const sql = readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8");
  expect(() => assertAdditiveMigration(sql, name)).not.toThrow();
  expect(() => assertAdditiveMigration(`${sql}\nDROP TABLE \"Startup\";`, name)).toThrow();
  expect(() => assertAdditiveMigration(sql, "unreviewed_migration")).toThrow();
  expect(() => assertAdditiveMigration(sql.replace("ENABLE ROW", "DISABLE ROW"), name)).toThrow();
});

it("pins only the reviewed additive moderation migration including cascade foreign keys", () => {
  const name = "20261023130000_ai_content_moderation";
  const sql = readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8");
  expect(() => assertAdditiveMigration(sql, name)).not.toThrow();
  expect(() => assertAdditiveMigration(`${sql}\nDROP TABLE \"Comment\";`, name)).toThrow();
  expect(() => assertAdditiveMigration(sql.replace("ON DELETE CASCADE", "ON DELETE SET NULL"), name)).toThrow();
  expect(() => assertAdditiveMigration(sql, "unreviewed_migration")).toThrow();
});

it("pins the comment edit-history migration independent of checkout line endings", () => {
  const name = "20261030120000_content_edit_history_and_comment_access";
  const sql = readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8");
  expect(() => assertAdditiveMigration(sql, name)).not.toThrow();
  expect(() => assertAdditiveMigration(sql.replace(/\n/g, "\r\n"), name)).not.toThrow();
  expect(() => assertAdditiveMigration(`${sql}\nDROP TABLE \"Comment\";`, name)).toThrow();
});

it("allows additive tables, indexes, nullable columns and defaulted columns", () => {
  for (const sql of [
    'CREATE TABLE "NewTable" ("id" TEXT NOT NULL); CREATE UNIQUE INDEX "NewTable_id" ON "NewTable"("id");',
    'ALTER TABLE "User" ADD COLUMN "optional" TEXT;',
    'ALTER TABLE "User" ADD COLUMN "count" INTEGER NOT NULL DEFAULT 0;',
    'CREATE TABLE "Update" ("label" TEXT DEFAULT \'DROP; UPDATE -- literal\');',
  ]) expect(() => assertAdditiveMigration(sql)).not.toThrow();
});

it.each([
  'DROP TABLE "User";',
  'CREATE TABLE "New" (id TEXT); DELETE FROM "User";',
  'UPDATE "User" SET name = \'changed\';',
  'ALTER TABLE "User" DROP COLUMN "name";',
  'ALTER TABLE "User" ADD COLUMN "optional" TEXT, ALTER COLUMN "name" TYPE INTEGER;',
  'ALTER TABLE "User" ADD COLUMN "required" TEXT NOT NULL;',
  'TRUNCATE TABLE "User";',
  'DO $$ BEGIN DROP TABLE "User"; END $$;',
  'GRANT ALL ON DATABASE app TO PUBLIC;',
  'SELECT 1;',
  '-- comment only',
])("blocks changes needing manual migration review: %s", sql => {
  expect(() => assertAdditiveMigration(sql)).toThrow();
});
