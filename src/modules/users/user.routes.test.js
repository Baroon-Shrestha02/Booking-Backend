import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";

test("full profile endpoint requires authentication", async () => {
  const response = await request(app).get("/api/v1/users/me");
  assert.equal(response.status, 401);
  assert.equal(response.body.status, "failed");
});

test("profile update endpoint requires authentication", async () => {
  const response = await request(app)
    .patch("/api/v1/users/me")
    .send({ name: "Updated Player" });
  assert.equal(response.status, 401);
  assert.equal(response.body.status, "failed");
});
