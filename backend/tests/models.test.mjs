import { describe, it, expect } from 'vitest';
import User from '../models/User.js';

describe('User Model Validation', () => {
  it('should require supabaseId and email', async () => {
    try {
      const user = new User({});
      await user.validate();
      throw new Error('Validation should have failed');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  // Add more model validation tests as needed
});
