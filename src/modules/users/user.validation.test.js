import test from "node:test";
import assert from "node:assert/strict";
import { updateProfileSchema } from "./user.validation.js";

test("profile updates accept any supported subset", () => {
  const result = updateProfileSchema.body.parse({ name: "Updated Player" });
  assert.deepEqual(result, { name: "Updated Player" });
});

test("profile updates normalize multipart favourite sports", () => {
  const result = updateProfileSchema.body.parse({
    favouriteSports: '["Futsal","Football"]',
  });
  assert.deepEqual(result.favouriteSports, ["futsal", "football"]);
});

test("profile updates reject protected fields", () => {
  const result = updateProfileSchema.body.safeParse({ role: "owner" });
  assert.equal(result.success, false);
});

test("profile updates reject duplicate favourite sports", () => {
  const result = updateProfileSchema.body.safeParse({
    favouriteSports: ["futsal", "FUTSAL"],
  });
  assert.equal(result.success, false);
});
