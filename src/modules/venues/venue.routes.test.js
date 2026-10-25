import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";

test("owner venue listing requires authentication", async () => {
  const response = await request(app).get("/api/v1/owners/me/venues");
  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, "unauthenticated");
});

test("owner venue creation requires authentication", async () => {
  const response = await request(app)
    .post("/api/v1/owners/me/venues")
    .send({});
  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, "unauthenticated");
});

test("owner venue updates require authentication", async () => {
  const response = await request(app)
    .patch("/api/v1/owners/me/venues/ven_0123456789abcdef01234567")
    .send({ name: "Updated Venue" });
  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, "unauthenticated");
});

test("public venue details validate the venue ID before querying", async () => {
  const response = await request(app).get("/api/v1/venues/not-a-venue-id");
  assert.equal(response.status, 422);
  assert.equal(response.body.error.code, "validation_failed");
});
