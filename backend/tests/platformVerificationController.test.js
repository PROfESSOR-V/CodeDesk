import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../app.js';

// Platform Verification Controller Tests

describe('Platform Verification Controller', () => {
  it('should return 400 for missing platform or userId', async () => {
    const res = await request(app)
      .post('/api/platform/verify')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Missing platform or userId/);
  });

  it('should return 404 for unsupported platform', async () => {
    const res = await request(app)
      .post('/api/platform/verify')
      .send({ platform: 'unknown', userId: '123' });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/Platform not supported/);
  });

  it('should return 200 for valid verification request', async () => {
    // Replace with valid platform and userId for your app
    const res = await request(app)
      .post('/api/platform/verify')
      .send({ platform: 'leetcode', userId: 'validUserId' });
    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('verificationStatus');
  });
});