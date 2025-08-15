
import { describe, it, expect, vi } from 'vitest';
import * as utils from '../utils/platformStats.js';

// Mock Puppeteer to avoid launching a real browser
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

describe('Utility Functions', () => {
  it('gfgStats should return an object for any input', async () => {
    const result = await utils.gfgStats('https://invalid-profile-url');
    expect(result).toBeTypeOf('object');
  });
  // Add more utility tests as needed
});
