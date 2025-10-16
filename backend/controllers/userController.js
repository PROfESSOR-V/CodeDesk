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

  if (error) {
    console.error("Supabase error updating profile:", error);
    res.status(400); // Use 400 for client-side error, 500 for db issue
    throw new Error(error.message);
  }

  res.json({ message: "Profile updated" });
});

// @desc   Update user sections arrays
// @route  PUT /api/users/sections
// @access Private
export const updateUserSections = asyncHandler(async (req, res) => {
  const { education, achievements, workExperience, platforms, username } = req.body;

  const payload = { supabase_id: req.user.id };
  if (education) payload.education = education;
  if (achievements) payload.achievements = achievements;
  if (workExperience) payload.work_experience = workExperience;
  if (platforms) payload.platforms = platforms;
  if (username) payload.username = username;
  
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

// @desc    Get user portfolio data (for dashboard)
// @route   GET /api/users/portfolio
// @access  Private
export const getUserPortfolio = asyncHandler(async (req, res) => {
  const { recomputeTotalStats } = await import('../utils/totalStats.js');
  await recomputeTotalStats(req.user.id);

  const { data, error } = await supabaseAdmin
    .from("total_stats")
    .select("total_questions_solved, total_contests_attended, heatmap,total_rating , easy_solved , medium_solved , hard_solved")
    .eq("supabase_id", req.user.id)
    .single();

  const { data: verifiedPlatforms, error: platformError } = await supabaseAdmin
    .from("profiles")
    .select("platforms")
    .eq("supabase_id", req.user.id)
    .single();
  const verifiedPlatformsData = verifiedPlatforms?.platforms || [];


  if (platformError && platformError.code !== "PGRST116") {
    console.error("Error fetching user platforms:", platformError);
    throw new Error(platformError.message);
  }

  

  if (error && error.code !== "PGRST116") { // Ignore error if no row is found
    console.error("Error fetching user portfolio:", error);
    // throw new Error(error.message);
  }

  const unifiedActivity = Array.isArray(data?.unified_activity)
    ? data.unified_activity
    : (() => { try { return data?.unified_activity ? JSON.parse(data.unified_activity) : []; } catch { return []; } })();

  const totalQuestions = data?.total_questions_solved || 0;
  const totalContests = data?.total_contests_attended || 0;

  // Shape response to what client/src/pages/Portfolio.jsx expects
  const response = {
    user: {},
    verifiedPlatforms: [...verifiedPlatformsData],
    aggregatedStats: {
      totalQuestions: totalQuestions || 0,
      totalActiveDays: unifiedActivity.length || 0,
      totalRating: data.total_rating || 0,
      totalContests: totalContests || 0,
      // The UI will further normalize these via problemDifficulty
      easy: data.easy_solved || 0,
      medium: data.medium_solved || 0,
      hard: data.hard_solved || 0,
    },
    unifiedActivity,
    contestRatings: [],
    awards: [],
    dsaTopics: {},
    contributionData: {},
  };

  res.json(response);
});

// @desc    Sync Supabase auth user with public.profiles table
// @route   POST /api/users/sync
// @access  Public (or protected, depending on desired flow)
export const syncUser = asyncHandler(async (req, res) => {
  const { supabaseId, email, name } = req.body;

  if (!supabaseId || !email) {
    res.status(400);
    throw new Error("Supabase ID and email are required.");
  }

  // Upsert into profiles to create a profile if it doesn't exist
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        supabase_id: supabaseId,
        first_name: name.split(' ')[0] || '',
        last_name: name.split(' ').slice(1).join(' ') || ''
      },
      { onConflict: "supabase_id", ignoreDuplicates: true }
    );

  if (profileError) {
    console.error("Error syncing user profile:", profileError);
    throw new Error(profileError.message);
  }

  // Upsert into total_stats to ensure a stats row exists
  const { error: statsError } = await supabaseAdmin
    .from("total_stats")
    .upsert(
      { supabase_id: supabaseId },
      { onConflict: "supabase_id", ignoreDuplicates: true }
    );

  if (statsError) {
    console.error("Error syncing user total_stats:", statsError);
    throw new Error(statsError.message);
  }

  res.status(200).json({ message: "User synced successfully" });
});