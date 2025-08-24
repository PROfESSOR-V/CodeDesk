import { generateToken } from '../generateToken.js';
import jwt from 'jsonwebtoken';

describe('generateToken', () => {
  it('should generate a token string', () => {
    const token = generateToken('userId');
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('should include user id in payload', () => {
    const token = generateToken('abc123');
    const decoded = jwt.decode(token);
    expect(decoded.id).toBe('abc123');
  });

  it('should default role to user', () => {
    const token = generateToken('xyz');
    const decoded = jwt.decode(token);
    expect(decoded.role).toBe('user');
  });

  it('should allow custom role', () => {
    const token = generateToken('xyz', 'admin');
    const decoded = jwt.decode(token);
    expect(decoded.role).toBe('admin');
  });

  it('should set expiry to 30d', () => {
    const token = generateToken('id');
    const decoded = jwt.decode(token);
    expect(decoded.exp).toBeDefined();
  });

  it('should throw if secret is missing', () => {
    const oldSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = '';
    expect(() => generateToken('id')).toThrow();
    process.env.JWT_SECRET = oldSecret;
  });

  it('should handle numeric user id', () => {
    const token = generateToken(123);
    const decoded = jwt.decode(token);
    expect(decoded.id).toBe(123);
  });

  it('should handle null user id', () => {
    expect(() => generateToken(null)).toThrow();
  });

  it('should handle undefined user id', () => {
    expect(() => generateToken(undefined)).toThrow();
  });

  it('should handle empty string user id', () => {
    expect(() => generateToken('')).toThrow();
  });

  it('should generate different tokens for different ids', () => {
    const token1 = generateToken('id1');
    const token2 = generateToken('id2');
    expect(token1).not.toBe(token2);
  });

  it('should generate different tokens for different roles', () => {
    const token1 = generateToken('id', 'user');
    const token2 = generateToken('id', 'admin');
    expect(token1).not.toBe(token2);
  });

  it('should generate valid JWT', () => {
    const token = generateToken('id');
    expect(() => jwt.verify(token, process.env.JWT_SECRET)).not.toThrow();
  });
});