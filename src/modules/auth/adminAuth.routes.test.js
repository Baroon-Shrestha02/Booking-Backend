import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";

test("admin login requires email and password", async () => {
  const response = await request(app)
    .post("/api/v1/admin-auth/login")
    .send({ email: "admin@example.com" });

  assert.equal(response.status, 422);
  assert.equal(response.body.error.code, "validation_failed");
});

test("admin current-user endpoint requires authentication", async () => {
  const response = await request(app).get("/api/v1/admin-auth/me");

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, "unauthenticated");
});

test("admin forgot-password requires a valid email", async () => {
  const response = await request(app)
    .post("/api/v1/admin-auth/forgot-password")
    .send({ email: "not-an-email" });

  assert.equal(response.status, 422);
  assert.equal(response.body.error.code, "validation_failed");
});

test("admin reset-password requires email, OTP, and a new password", async () => {
  const response = await request(app)
    .post("/api/v1/admin-auth/reset-password")
    .send({ email: "admin@example.com", code: "123" });

  assert.equal(response.status, 422);
  assert.equal(response.body.error.code, "validation_failed");
});
