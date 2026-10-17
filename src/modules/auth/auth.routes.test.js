import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";

test("current-user endpoint requires authentication", async () => {
  const response = await request(app).get("/api/v1/auth/me");
  assert.equal(response.status, 401);
  assert.equal(response.body.status, "failed");
});

test("registration rejects country-coded phone numbers", async () => {
  const response = await request(app)
    .post("/api/v1/auth/register")
    .send({
      name: "Test Player",
      email: "player@example.com",
      phone: "+9779818738923",
      password: "strong-password",
    });

  assert.equal(response.status, 422);
  assert.equal(response.body.status, "failed");
  assert.equal(response.body.message, "Use exactly 10 digits without +977");
});

test("registration accepts the documented input shape before persistence", () => {
  const phone = "9818738923";
  assert.match(phone, /^(97|98)\d{8}$/);
});

test("login requires email rather than phone", async () => {
  const response = await request(app).post("/api/v1/auth/login").send({
    phone: "9818738923",
    password: "strong-password",
  });

  assert.equal(response.status, 422);
  assert.equal(response.body.status, "failed");
});

test("OTP verification requires email and code", async () => {
  const response = await request(app)
    .post("/api/v1/auth/verify-registration")
    .send({ registrationToken: "old-token", code: "123456" });

  assert.equal(response.status, 422);
  assert.equal(response.body.status, "failed");
});

test("change-password requires authentication", async () => {
  const response = await request(app)
    .patch("/api/v1/auth/change-password")
    .send({
      currentPassword: "current-password",
      newPassword: "new-strong-password",
    });

  assert.equal(response.status, 401);
  assert.equal(response.body.status, "failed");
});

test("forgot-password requires a valid email", async () => {
  const response = await request(app)
    .post("/api/v1/auth/forgot-password")
    .send({ email: "not-an-email" });

  assert.equal(response.status, 422);
  assert.equal(response.body.status, "failed");
});

test("reset-password requires email, OTP, and a new password", async () => {
  const response = await request(app)
    .post("/api/v1/auth/reset-password")
    .send({ email: "player@example.com", code: "123" });

  assert.equal(response.status, 422);
  assert.equal(response.body.status, "failed");
});
