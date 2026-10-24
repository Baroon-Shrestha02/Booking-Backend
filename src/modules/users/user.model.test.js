import test from "node:test";
import assert from "node:assert/strict";
import User from "./user.model.js";
import { USER_ROLES } from "../../shared/constants/index.js";

const baseUser = {
  email: "account@example.com",
  passwordHash: "hashed-password",
  name: "Test Account",
};

test("admin accounts do not require a phone number", async () => {
  const admin = new User({
    ...baseUser,
    userId: "adm_0123456789abcdef01234567",
    role: USER_ROLES.ADMIN,
  });

  await assert.doesNotReject(admin.validate());
});

test("player accounts still require a phone number", async () => {
  const player = new User({
    ...baseUser,
    userId: "ply_0123456789abcdef01234567",
    role: USER_ROLES.PLAYER,
  });

  await assert.rejects(player.validate(), (error) => {
    assert.equal(error.errors.phone.kind, "required");
    return true;
  });
});
