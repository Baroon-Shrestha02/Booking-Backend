import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";

test("listing business verifications requires admin authentication", async () => {
  const response = await request(app).get(
    "/api/v1/admin/business-verifications",
  );

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, "unauthenticated");
});

test("reviewing a business verification requires admin authentication", async () => {
  const response = await request(app)
    .patch(
      "/api/v1/admin/business-verifications/bvr_0123456789abcdef01234567",
    )
    .send({ status: "approved" });

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, "unauthenticated");
});
