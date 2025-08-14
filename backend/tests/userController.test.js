const request = require('supertest');
const app = require('../app');

describe('User Controller', () => {
  it('should return 400 for missing supabaseId or email', async () => {
    const res = await request(app)
      .post('/api/users/sync')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Missing supabaseId or email/);
  });
  // Add more tests for userController as needed
});
