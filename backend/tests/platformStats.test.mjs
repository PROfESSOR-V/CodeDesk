// tests/platformStats.test.mjs
import { describe, it, expect, vi } from 'vitest';
import { gfgStats } from '../utils/platformStats.js';

// Mock Puppeteer so tests don't actually launch a browser.
// The mock returns the same shape your real evaluate() would return.
vi.mock('puppeteer', () => ({
  launch: async () => ({
    newPage: async () => ({
      goto: async (url) => {
        // optional: you can assert url here if needed
      },
      setUserAgent: async () => {},
      setViewport: async () => {},
      evaluate: async () => ({
        username: 'invalidprofileurl',
        displayName: 'Test User',
        practiceProblems: 10,
        totalSolved: 10,
        easySolved: 5,
        mediumSolved: 3,
        hardSolved: 2,
        activeDays: 8,
        contributionGraphHtml: 'No graph found',
        codingScore: 100,
        monthlyRank: null,
        overallRank: null,
        streak: 2,
        contestsParticipated: 1,
      }),
      close: async () => {},
    }),
    close: async () => {},
  }),
}));

describe('GeeksForGeeks Stats Utility', () => {
  it('should return the expected stats shape for an invalid profile', async () => {
    // Use whatever URL/identifier your gfgStats expects
    const stats = await gfgStats('https://invalid-profile-url');

    // basic existence & type checks
    expect(stats).toBeDefined();
    expect(stats).toHaveProperty('username');
    expect(typeof stats.username).toBe('string');

    expect(stats).toHaveProperty('displayName');
    expect(typeof stats.displayName).toBe('string');

    expect(stats).toHaveProperty('practiceProblems');
    expect(typeof stats.practiceProblems).toBe('number');

    expect(stats).toHaveProperty('codingScore');
    expect(typeof stats.codingScore).toBe('number');

    // more detailed checks
    expect(stats).toHaveProperty('mediumSolved');
    expect(stats).toHaveProperty('hardSolved');
    expect(stats).toHaveProperty('activeDays');

    // sample value checks (match the mock above)
    expect(stats.username).toBe('invalidprofileurl');
    expect(stats.practiceProblems).toBe(10);
    expect(stats.codingScore).toBe(100);
  });
});
