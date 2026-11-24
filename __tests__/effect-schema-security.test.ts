// @vitest-environment node
import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";

it("rejects adversarial template-literal nonmatches without stalling the process", () => {
  const result = spawnSync(process.execPath, ["-e", `
    const assert = require("node:assert/strict");
    const Schema = require("effect/Schema");
    const Either = require("effect/Either");
    const template = Schema.TemplateLiteral(
      Schema.String, ":", Schema.String, ":", Schema.String, "X"
    );
    const decode = Schema.decodeUnknownEither(template);
    assert.ok(Either.isRight(decode("founder:startup:readyX")));
    assert.ok(Either.isLeft(decode(":".repeat(5000))));
    console.log("template checks passed");
  `], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 5000,
    maxBuffer: 64 * 1024,
  });
  expect(result.error).toBeUndefined();
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout.trim()).toBe("template checks passed");
}, 10_000);
