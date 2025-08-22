import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('User API Endpoints', () => {
  it('GET /api/user/profile (unauthenticated) should fail', async () => {
    const res = await request(app).get('/api/user/profile');
  expect(res.status).toBe(404);
  });
  // Add more endpoint tests as needed
});
