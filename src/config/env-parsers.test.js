import test from "node:test";
import assert from "node:assert/strict";
import { parseBoolean, parseCsv, parseInteger, requireSecret } from "./env-parsers.js";

test("environment parsers normalize supported values", () => {
  assert.equal(parseInteger("PORT", "4000", 3000, { min: 1, max: 65535 }), 4000);
  assert.equal(parseBoolean("true"), true);
  assert.equal(parseBoolean(undefined, false), false);
  assert.deepEqual(parseCsv("a, b,,c"), ["a", "b", "c"]);
});

test("environment parsers reject unsafe values", () => {
  assert.throws(() => parseInteger("PORT", "nope", 3000, { min: 1 }), /PORT/);
  assert.throws(() => parseBoolean("yes"), /true or false/);
  assert.throws(
    () => requireSecret("TOKEN", "short", { production: true }),
    /at least 32/,
  );
});
