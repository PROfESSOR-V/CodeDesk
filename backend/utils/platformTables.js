// backend/utils/platformTables.js
// Central helper to keep platform-specific stats in their dedicated Supabase tables.

import { supabaseAdmin } from "./supabaseClient.js";

export const PLATFORM_TABLES = {
  leetcode: "leetcode_stats",
  codeforces: "codeforces_stats",
  gfg: "gfg_stats",
  codechef: "codechef_stats",
  hackerrank: "hackerrank_stats",
};

/**
 * Helper to compute today’s submission count from contributionData array
 */
function getTodayHeatmapCount(contributionData = []) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const obj = Array.isArray(contributionData)
    ? contributionData.find((d) => d.date === today)
    : null;
  return obj ? obj.count : 0;
}

/**
 * Upsert stats into the per-platform table. Each table is expected to include:
 *   supabase_id   uuid  PK
 *   profile_name  text
 *   total_questions integer
 *   rating        integer
 *   total_contests integer
 *   badges        jsonb
 *   heatmap       jsonb   (full calendar array)
 *   today_count   integer  (# submissions today)
 *   raw_stats     jsonb
 *   updated_at    timestamptz default now()
 */
export async function upsertPlatformStats(platformId, supabaseId, stats) {
  const table = PLATFORM_TABLES[platformId];
  if (!table)
    throw new Error(`No table mapping for platform ${platformId}`);

  const payload = {
    supabase_id: supabaseId,
    profile_name: stats.username || stats.displayName || null,
    total_questions:
      stats.totalSolved ??
      stats.practiceProblems ??
      stats.problemsSolved ??
      0,
    rating:
      stats.rating ??
      stats.contestRating ??
      stats.codingScore ??
      stats.score ??
      0,
    total_contests: stats.contestsParticipated ?? 0,
    badges: stats.badges ? JSON.stringify(stats.badges) : null,
    heatmap: stats.contributionData
      ? JSON.stringify(stats.contributionData)
      : null,
    today_count: getTodayHeatmapCount(stats.contributionData),
    raw_stats: stats ? JSON.stringify(stats) : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from(table)
    .upsert(payload, { onConflict: "supabase_id" });

  if (error) {
    console.error(`[upsertPlatformStats] ${platformId} upload failed`, error);
    throw error;
  }

  // Recompute total_stats in background (dynamic import to avoid cycle)
  import('./totalStats.js').then(({ recomputeTotalStats }) => {
    recomputeTotalStats(supabaseId).catch((e) => console.error('total_stats recompute failed', e.message));
  });
}
