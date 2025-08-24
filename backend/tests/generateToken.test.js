import { describe, it, expect } from 'vitest';
import generateToken from '../utils/generateToken.js';

describe('generateToken Utility', () => {
  it('should generate a token of the specified length', () => {
    const length = 16;
    const token = generateToken(length);
    expect(typeof token).toBe('string');
    expect(token.length).toBe(length);
  });

  it('should generate different tokens on subsequent calls', () => {
    const token1 = generateToken(16);
    const token2 = generateToken(16);
    expect(token1).not.toBe(token2);
  });

  it('should handle zero length', () => {
    const token = generateToken(0);
    expect(token).toBe('');
  });
});