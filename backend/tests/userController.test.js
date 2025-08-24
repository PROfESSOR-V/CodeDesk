import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../app.js';

describe("POST /api/syncUser", () => {
  it("should return 400 if supabaseId is missing", async () => {
    const res = await request(app)
      .post("/api/syncUser")
      .send({ email: "test@example.com" });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 if email is missing", async () => {
    const res = await request(app)
      .post("/api/syncUser")
      .send({ supabaseId: "123" });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 200 for valid syncUser request", async () => {
    const res = await request(app)
      .post("/api/syncUser")
      .send({ supabaseId: "123", email: "test@example.com" });
    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty("user");
  });
});