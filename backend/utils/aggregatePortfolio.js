// backend/utils/aggregatePortfolio.js
// Utility to aggregate stats across all verified coding platforms for a user.
// This is essentially an extraction of the logic that previously lived inline in
// userController.getPortfolioData so that it can be re-used from multiple
// locations (e.g. during verification confirmation or on a CRON refresh).

import fs from 'fs';
import path from 'path';

/**
 * Helper that merges an array of contributionData arrays into a single map
 * keyed by date and summed counts.
 */
function mergeContributionData(arrays) {
  const map = {};
  arrays.forEach(dataArr => {
    if (!Array.isArray(dataArr)) return;
    dataArr.forEach(({ date, count }) => {
      if (!date) return;
      map[date] = (map[date] || 0) + (parseInt(count) || 0);
    });
  });
  return map;
}

/**
 * Given the platforms array stored in the `profiles` table (only verified
 * platforms are expected but we will guard nonetheless) produce a rich
 * portfolio object containing aggregated statistics, contribution heat-maps,
 * etc. This output shape intentionally mirrors what the frontend already
 * expects in the existing getPortfolioData controller.
 */
export function aggregatePortfolio(platforms = [], userMeta = {}) {
  // Ensure we only work with verified platforms
  const verified = platforms.filter(p => p.verified);

  let totalQuestions = 0;
  let totalActiveDays = 0;
  let totalRating = 0;
  let easyProblems = 0;
  let mediumProblems = 0;
  let hardProblems = 0;
  let totalContests = 0;
  let platformStats = [];
  let contributionData = {};
  let contestRatings = [];
  let awards = [];
  let dsaTopics = {};
  const contributionArrays = [];

  verified.forEach(platform => {
    const stats = platform.stats || {};

    // Basic solved count – try multiple field names for robustness
    const solved =
      stats.totalSolved ??
      stats.practiceProblems ??
      stats.solvedCount ??
      stats.problemsSolved ??
      0;
    totalQuestions += parseInt(solved) || 0;

    // Active days
    if (stats.activeDays) totalActiveDays += parseInt(stats.activeDays) || 0;

    // Ratings / scores
    const ratingVal = stats.rating ?? stats.codingScore ?? stats.score ?? 0;
    totalRating += parseInt(ratingVal) || 0;

    // Difficulty breakdown
    if (stats.easySolved) easyProblems += parseInt(stats.easySolved) || 0;
    if (stats.mediumSolved) mediumProblems += parseInt(stats.mediumSolved) || 0;
    if (stats.hardSolved) hardProblems += parseInt(stats.hardSolved) || 0;

    // Contest information
    if (stats.contestsParticipated) totalContests += parseInt(stats.contestsParticipated) || 0;
    if (stats.contestRating) {
      contestRatings.push({
        platform: platform.id,
        rating: stats.contestRating,
        maxRating: stats.maxRating || stats.contestRating,
      });
    }

    // Preserve per-platform payload for the UI
    platformStats.push({
      platform: platform.id,
      username: stats.username || 'N/A',
      stats,
      profileUrl: platform.url,
      verifiedAt: platform.verifiedAt,
    });

    // Contribution calendar info
    if (stats.contributionGraphHtml || stats.contributionData) {
      contributionData[platform.id] = {
        html: stats.contributionGraphHtml,
        data: stats.contributionData,
      };
      contributionArrays.push(stats.contributionData);
    }

    // Badges / achievements
    if (stats.badges || stats.achievements) {
      awards.push({
        platform: platform.id,
        badges: stats.badges || [],
        achievements: stats.achievements || [],
      });
    }

    // Topic-wise data
    if (stats.topicWiseStats) {
      Object.entries(stats.topicWiseStats).forEach(([topic, count]) => {
        dsaTopics[topic] = (dsaTopics[topic] || 0) + count;
      });
    }
  });

  // If no topic-wise data present – create a mocked distribution
  if (Object.keys(dsaTopics).length === 0 && totalQuestions > 0) {
    dsaTopics = {
      Arrays: Math.floor(totalQuestions * 0.25),
      Strings: Math.floor(totalQuestions * 0.15),
      'Dynamic Programming': Math.floor(totalQuestions * 0.12),
      Trees: Math.floor(totalQuestions * 0.10),
      Graphs: Math.floor(totalQuestions * 0.08),
      'Linked Lists': Math.floor(totalQuestions * 0.08),
      Sorting: Math.floor(totalQuestions * 0.07),
      'Binary Search': Math.floor(totalQuestions * 0.06),
      'Hash Tables': Math.floor(totalQuestions * 0.05),
      Others: Math.floor(totalQuestions * 0.04),
    };
  }

  // Unified activity map (merged heat-map)
  const unifiedMap = mergeContributionData(contributionArrays);
  if (Object.keys(unifiedMap).length > 0) {
    totalActiveDays = Object.keys(unifiedMap).length;
  }

  const portfolioData = {
    user: userMeta,
    verifiedPlatforms: platformStats,
    aggregatedStats: {
      totalQuestions,
      totalActiveDays,
      totalRating,
      totalContests,
      problemDifficulty: {
        easy: easyProblems,
        medium: mediumProblems,
        hard: hardProblems,
      },
    },
    contributionData,
    unifiedActivity: Object.entries(unifiedMap).map(([date, count]) => ({ date, count })),
    contestRatings,
    awards,
    dsaTopics,
  };

  // Persist a local JSON snapshot (optional convenience for quick debug / cache)
  try {
    if (userMeta && (userMeta.username || userMeta.id)) {
      const dataDir = path.join(process.cwd(), 'backend', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(
        dataDir,
        `${userMeta.username || userMeta.id}_portfolio.json`,
      );
      fs.writeFileSync(filePath, JSON.stringify(portfolioData, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Failed to persist portfolio snapshot:', err.message);
  }

  return portfolioData;
}
