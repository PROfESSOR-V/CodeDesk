const { gfgStats } = require('../utils/platformStats');

describe('GeeksForGeeks Stats Utility', () => {
  it('should return default stats for invalid profile', async () => {
    const stats = await gfgStats('https://invalid-profile-url');
    expect(stats).toHaveProperty('mediumSolved');
    expect(stats).toHaveProperty('hardSolved');
    expect(stats).toHaveProperty('activeDays');
  });
  // Add more tests for platformStats as needed
});
