// backend/utils/platformTables.js
// Central helper to keep platform-specific stats in their dedicated Supabase tables.

import { supabaseAdmin } from "./supabaseClient.js";

export const PLATFORM_TABLES = {
  leetcode: "leetcode_stats",
  codeforces: "codeforces_stats",
  gfg: "gfg_stats",
  codechef: "codechef_profiles",
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

  const basePayload = {
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
    heatmap: stats.contributionData ?? null,
    today_count: getTodayHeatmapCount(stats.contributionData),
    raw_stats: stats ?? null,
    updated_at: new Date().toISOString(),
  };

  // Prefer to also send a username column if the table has it. Try with it first,
  // and if the column does not exist, retry without it.
  const payloadWithUsername = {
    ...basePayload,
    username: stats.username || stats.displayName || null,
  };

  let error;
  let triedFallback = false;
  for (const payload of [payloadWithUsername, basePayload]) {
    const res = await supabaseAdmin
      .from(table)
      .upsert(payload, { onConflict: "supabase_id" });
    error = res.error;
    if (!error) break;
    // If username column missing, retry without it (only once)
    if (
      !triedFallback &&
      /column\s+"?username"?\s+does\s+not\s+exist/i.test(error.message)
    ) {
      triedFallback = true;
      continue;
    }
    // Some Supabase internal queries may reference p.username; attempt fallback once
    if (
      !triedFallback &&
      /p\.username\s+does\s+not\s+exist/i.test(error.message)
    ) {
      triedFallback = true;
      continue;
    }
    break;
  }

  if (error) {
    console.error(`[upsertPlatformStats] ${platformId} upload failed`, error);
    throw error;
  }

  // total_stats table disabled in prod; skip recompute
}
