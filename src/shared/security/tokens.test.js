import test from "node:test";
import assert from "node:assert/strict";
import {
  issueAccessToken,
  issueRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "./tokens.js";

const claims = {
  userId: "507f1f77bcf86cd799439011",
  sessionId: "ses_test",
  role: "player",
};

test("issues verifiable access and refresh tokens with distinct types", () => {
  const accessToken = issueAccessToken(claims);
  const refreshToken = issueRefreshToken(claims);
  assert.equal(verifyAccessToken(accessToken).sub, claims.userId);
  assert.equal(verifyRefreshToken(refreshToken).sid, claims.sessionId);
  assert.throws(() => verifyAccessToken(refreshToken), /valid authentication token/);
});

