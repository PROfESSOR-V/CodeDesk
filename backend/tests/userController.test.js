import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../app.js';

describe('User Controller', () => {
  it('should return 400 for missing supabaseId or email', async () => {
    const res = await request(app)
      .post('/api/users/sync')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Missing supabaseId or email/);
  });
});
