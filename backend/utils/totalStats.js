// backend/utils/totalStats.js
// Builds/updates one row in the `total_stats` table by merging every *_stats
// table that belongs to the given user.

import { supabaseAdmin } from './supabaseClient.js';
import { PLATFORM_TABLES } from './platformTables.js';

function sumRows(rows, field) {
  return rows.reduce((n, r) => n + (parseInt(r[field]) || 0), 0);
}

function mergeHeatmaps(rows) {
  const map = {};
  rows.forEach((r) => {
    if (!r.heatmap) return;
    const arr = Array.isArray(r.heatmap) ? r.heatmap : JSON.parse(r.heatmap);
    arr.forEach(({ date, count }) => {
      if (!date) return;
      map[date] = (map[date] || 0) + (parseInt(count) || 0);
    });
  });
  return map;
}

export async function recomputeTotalStats(supabaseId) {
  // Fetch per-platform stats
  const rows = [];
  for (const tbl of Object.values(PLATFORM_TABLES)) {
    const { data } = await supabaseAdmin
      .from(tbl)
      .select('*')
      .eq('supabase_id', supabaseId)
      .maybeSingle();
    if (data) rows.push(data);
  }
  if (!rows.length) return; // nothing verified yet

  const total_questions = sumRows(rows, 'total_questions');
  const easy_solved     = sumRows(rows, 'easy_solved');
  const medium_solved   = sumRows(rows, 'medium_solved');
  const hard_solved     = sumRows(rows, 'hard_solved');
  const total_contests  = sumRows(rows, 'total_contests');

  // Ratings list preserving per-platform numbers
  const rating = rows.map((r) => ({
    platform: r.platform || r.profile_name || 'unknown',
    rating:   r.rating ?? 0,
  }));

  const heatmapMap = mergeHeatmaps(rows);
  const heatmapArr = Object.entries(heatmapMap).map(([date, count]) => ({ date, count }));
  const todayStr = new Date().toISOString().slice(0, 10);
  const today_count = heatmapMap[todayStr] || 0;

  const payload = {
    supabase_id: supabaseId,
    profile_name: 'TOTAL',
    total_questions,
    easy_solved,
    medium_solved,
    hard_solved,
    rating,                 // jsonb array
    total_contests,
    badges: null,
    heatmap: heatmapArr,
    today_count,
    raw_stats: null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from('total_stats')
    .upsert(payload, { onConflict: 'supabase_id' });
  if (error) console.error('[total_stats] upsert error:', error.message);
}
