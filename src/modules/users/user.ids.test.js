import test from "node:test";
import assert from "node:assert/strict";
import { USER_ROLES } from "../../shared/constants/index.js";
import { createUserId } from "./user.ids.js";

test("player public IDs use the ply prefix", () => {
  assert.match(createUserId(USER_ROLES.PLAYER), /^ply_[a-f0-9]{24}$/);
});

test("owner public IDs use the own prefix", () => {
  assert.match(createUserId(USER_ROLES.OWNER), /^own_[a-f0-9]{24}$/);
});
