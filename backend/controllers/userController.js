import asyncHandler from "express-async-handler";
import { supabaseAdmin } from "../utils/supabaseClient.js";
// portfolio aggregation removed

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("supabase_id", req.user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message);
  }

  res.json(data || {});
});

// @desc    Update user basic info
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, bio, country, avatarUrl } = req.body;

  const updatePayload = {
    first_name: firstName,
    last_name: lastName,
    bio,
    country,
    avatar_url: avatarUrl,
  };

  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert({ supabase_id: req.user.id, ...updatePayload }, { onConflict: "supabase_id" });

  if (error) throw new Error(error.message);

  res.json({ message: "Profile updated" });
});

// @desc   Update user sections arrays
// @route  PUT /api/users/sections
// @access Private
export const updateUserSections = asyncHandler(async (req, res) => {
  const { education, achievements, workExperience, platforms } = req.body;

  const payload = { supabase_id: req.user.id };
  if (education) payload.education = education;
  if (achievements) payload.achievements = achievements;
  if (workExperience) payload.work_experience = workExperience;
  if (platforms) payload.platforms = platforms;

  const { error } = await supabaseAdmin.from("profiles").upsert(payload, { onConflict: "supabase_id" });
  if (error) throw new Error(error.message);

  res.json({ message: "Sections updated" });
});

// @desc   Remove a platform from user's profile
// @route  DELETE /api/users/platform
// @access Private
export const removePlatform = asyncHandler(async (req, res) => {
  // platformId can come from JSON body or query string (clients often cannot send body with DELETE)
  const platformId = req.body.platformId || req.query.platformId; // e.g. 'leetcode'
  if (!platformId) {
    res.status(400);
    throw new Error('platformId is required');
  }

  // 1. Pull existing array
  const { data: prof, error: fetchErr } = await supabaseAdmin
    .from('profiles')
    .select('platforms')
    .eq('supabase_id', req.user.id)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  const updated = (prof?.platforms || []).filter((p) => p.id !== platformId);

  // 2. Save back to profiles
  const { error: updErr } = await supabaseAdmin
    .from('profiles')
    .update({ platforms: updated })
    .eq('supabase_id', req.user.id);
  if (updErr) throw new Error(updErr.message);

  // 3. Remove row from per-platform *_stats table
  const { PLATFORM_TABLES } = await import('../utils/platformTables.js');
  const table = PLATFORM_TABLES[platformId];
  if (table) {
    await supabaseAdmin.from(table).delete().eq('supabase_id', req.user.id);
  }

  // 4. Recompute total_stats
  const { recomputeTotalStats } = await import('../utils/totalStats.js');
  await recomputeTotalStats(req.user.id);

  res.json({ message: 'Platform removed', platforms: updated });
}); 

// portfolio endpoint removed