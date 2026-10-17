import test from "node:test";
import assert from "node:assert/strict";
import { normalizeNepalPhone } from "./phone.js";

test("accepts an exact ten-digit Nepal mobile number", () => {
  assert.equal(normalizeNepalPhone("9818738923"), "9818738923");
});

test("rejects country codes, formatting, and invalid numbers", () => {
  assert.throws(() => normalizeNepalPhone("+9779818738923"), /without \+977/);
  assert.throws(() => normalizeNepalPhone("9779818738923"), /10-digit/);
  assert.throws(() => normalizeNepalPhone("98187 38923"), /10-digit/);
  assert.throws(() => normalizeNepalPhone("123"), /10-digit/);
});
