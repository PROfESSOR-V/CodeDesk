// tests/platformStats.test.js
import { describe, it, expect, vi } from 'vitest';
import { gfgStats } from '../utils/platformStats.js';

vi.mock('puppeteer', () => ({
  launch: async () => ({
    newPage: async () => ({
      goto: async () => {},
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
        contributionGraphHtml: 'Graph HTML captured',
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

describe('GeeksForGeeks Stats Utility (JS)', () => {
  it('should return expected mock stats', async () => {
    const stats = await gfgStats('https://invalid-profile-url');
    expect(stats.username).toBe('invalidprofileurl');
    expect(stats.practiceProblems).toBe(10);
    expect(stats.codingScore).toBe(100);
    expect(stats.displayName).toBe('Test User');
    expect(stats.totalSolved).toBe(10);
    expect(stats.easySolved).toBe(5);
    expect(stats.mediumSolved).toBe(3);
    expect(stats.hardSolved).toBe(2);
    expect(stats.activeDays).toBe(8);
    expect(stats.contributionGraphHtml).toBe('Graph HTML captured');
    expect(stats.monthlyRank).toBeNull();
    expect(stats.overallRank).toBeNull();
    expect(stats.streak).toBe(2);
    expect(stats.contestsParticipated).toBe(1);
  });

  it('should handle missing fields gracefully', async () => {
    // Simulate missing fields by mocking evaluate to return partial data
    vi.doMock('puppeteer', () => ({
      launch: async () => ({
        newPage: async () => ({
          goto: async () => {},
          setUserAgent: async () => {},
          setViewport: async () => {},
          evaluate: async () => ({ username: 'partialuser' }),
          close: async () => {},
        }),
        close: async () => {},
      }),
    }));
    const { gfgStats: gfgStatsPartial } = await import('../utils/platformStats.js');
    const stats = await gfgStatsPartial('https://partial-profile-url');
  expect(stats.username).toBe('partialprofileurl');
    // Optional fields should be undefined or null
    expect(stats.practiceProblems ?? null).toBeNull();
    expect(stats.codingScore ?? null).toBeNull();
  });

  it('should throw or handle error for invalid URL', async () => {
    // Simulate an error in puppeteer
    vi.doMock('puppeteer', () => ({
      launch: async () => { throw new Error('Invalid URL'); },
    }));
    const { gfgStats: gfgStatsError } = await import('../utils/platformStats.js');
    await expect(gfgStatsError('not-a-url')).rejects.toThrow('Invalid URL');
  });
});
