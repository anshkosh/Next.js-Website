import { expect, it } from "vitest";
import { assertAdditiveMigration } from "../deploy/deployment-policy.mjs";

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
