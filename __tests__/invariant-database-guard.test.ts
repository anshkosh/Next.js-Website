// @vitest-environment node
import { expect, it } from "vitest";
import { invariantTestDatabaseUrl } from "@/scripts/invariant-test-database";

it.each([
  "postgresql://test:fixture@127.0.0.1:5432/anshkosh_e2e",
  "postgres://test:fixture@localhost:5436/anshkosh_e2e",
])("accepts only the intended isolated local connection: %s", value => {
  expect(invariantTestDatabaseUrl(value)).toBe(value);
});
it.each([
  undefined, "not-a-url", "postgresql://test:fixture@remote.example.test/anshkosh_e2e",
  "postgresql://test:fixture@127.0.0.1/production",
  "postgresql://test:fixture@127.0.0.1/anshkosh_e2e?host=remote.example.test",
  "postgresql://test:fixture@127.0.0.1/anshkosh_e2e?%68ost=remote.example.test",
  "postgresql://test:fixture@127.0.0.1/anshkosh_e2e?host=/var/run/postgresql",
  "postgresql://test:fixture@127.0.0.1/anshkosh_e2e?schema=public",
  "postgresql://test:fixture@127.0.0.1/anshkosh_e2e#host=remote.example.test",
  "https://127.0.0.1/anshkosh_e2e",
])("rejects unsafe fixture destinations before any connection: %s", value => {
  expect(() => invariantTestDatabaseUrl(value)).toThrow();
});
