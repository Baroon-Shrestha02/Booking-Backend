import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../app.js";
import swaggerDocument from "./swagger.js";

test("OpenAPI document describes every current public route", () => {
  const expectedPaths = [
    "/health/live",
    "/health/ready",
    "/api/v1/auth/register",
    "/api/v1/auth/verify-registration",
    "/api/v1/auth/resend-registration-otp",
    "/api/v1/auth/login",
    "/api/v1/auth/refresh",
    "/api/v1/auth/me",
    "/api/v1/auth/change-password",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
    "/api/v1/auth/logout",
    "/api/v1/users/me",
    "/api/v1/owner-auth/register",
    "/api/v1/owner-auth/verify-registration",
    "/api/v1/owner-auth/resend-registration-otp",
    "/api/v1/owners/me/business-verification",
  ];

  assert.equal(swaggerDocument.openapi, "3.1.0");
  assert.deepEqual(Object.keys(swaggerDocument.paths).sort(), expectedPaths.sort());
  assert.equal(
    swaggerDocument.components.securitySchemes.bearerAuth.scheme,
    "bearer",
  );
});

test("OpenAPI JSON is publicly available", async () => {
  const response = await request(app).get("/api-docs.json");
  assert.equal(response.status, 200);
  assert.equal(response.body.info.title, "KhelYard API");
  assert.ok(response.body.paths["/api/v1/users/me"]);
  assert.ok(response.body.paths["/api/v1/owner-auth/register"]);
  assert.ok(
    response.body.paths["/api/v1/owners/me/business-verification"],
  );
});

test("Swagger UI is publicly available", async () => {
  const response = await request(app).get("/api-docs/");
  assert.equal(response.status, 200);
  assert.match(response.text, /<title>KhelYard API Documentation<\/title>/);
  assert.match(response.text, /<div id="swagger-ui"><\/div>/);
});
