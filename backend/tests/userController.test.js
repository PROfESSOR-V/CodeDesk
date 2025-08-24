import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../app.js';

<<<<<<< HEAD
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
=======
describe('User Controller', () => {
  it('should return 400 for missing supabaseId or email', async () => {
    const res = await request(app)
      .post('/api/users/sync')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Missing supabaseId or email/);
  });
});
>>>>>>> 5171b9b3d2aae810099f682150361130f8270af1
