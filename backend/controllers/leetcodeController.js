import asyncHandler from 'express-async-handler';
import { supabaseAdmin } from '../utils/supabaseClient.js';
import { getPlatformStats } from '../utils/platformStats.js';

/**
 * LeetCode Profile Controller
 * Provides endpoints to scrape, fetch, refresh and delete LeetCode profile data for an authenticated user.
 */

// @desc    Scrape and save LeetCode profile for current user
// @route   POST /api/leetcode/scrape
// @access  Private
export const scrapeLeetcodeProfile = asyncHandler(async (req, res) => {
  const { profileUrl, leetcodeUsername } = req.body;
  const userId = req.user.id;

  // Derive target URL from provided values
  let targetUrl = profileUrl;
  if (!targetUrl && leetcodeUsername) {
    targetUrl = `https://leetcode.com/${leetcodeUsername}`;
  }

  if (!targetUrl) {
    res.status(400);
    throw new Error('Profile URL or LeetCode username is required');
  }

  try {
    // Fetch stats using shared util (GraphQL based – no headless browser)
    const profileData = await getPlatformStats('leetcode', targetUrl);

    if (!profileData || profileData.error) {
      res.status(400);
      throw new Error(profileData?.error || 'Failed to scrape LeetCode profile');
    }

    // Persist to leetcode_stats table – upsert by supabase_id
    const { error: dbError } = await supabaseAdmin
      .from('leetcode_stats')
      .upsert({
        supabase_id: userId,
        username: profileData.username,
        display_name: profileData.displayName,
        ranking: profileData.ranking,
        total_solved: profileData.totalSolved,
        easy_solved: profileData.easySolved,
        medium_solved: profileData.mediumSolved,
        hard_solved: profileData.hardSolved,
        active_days: profileData.activeDays,
        current_streak: profileData.currentStreak,
        contests_participated: profileData.contestsParticipated,
        contest_rating: profileData.contestRating,
        max_rating: profileData.maxRating,
        contribution_data: profileData.contributionData,
        country: profileData.country,
        last_refreshed_at: new Date().toISOString(),
      }, { onConflict: 'supabase_id', ignoreDuplicates: false });

    if (dbError) {
      console.error('LeetCode stats save error:', dbError);
      throw new Error('Failed to save profile data');
    }

    // Update user's verified platforms list (profile table)
    await updateUserPlatforms(userId, 'leetcode', profileData.username);

    // Update aggregated totals table
    await updateTotalStats(userId);

    res.status(201).json({
      success: true,
      message: 'LeetCode profile scraped and saved successfully',
      data: {
        username: profileData.username,
        displayName: profileData.displayName,
        totalSolved: profileData.totalSolved,
        contestsParticipated: profileData.contestsParticipated,
      },
    });
  } catch (error) {
    console.error('LeetCode scraping error:', error);
    res.status(500);
    throw new Error(error.message || 'Failed to scrape LeetCode profile');
  }
});

// @desc    Get current user's LeetCode profile data
// @route   GET /api/leetcode/profile
// @access  Private
export const getLeetcodeProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { data, error } = await supabaseAdmin
    .from('leetcode_stats')
    .select('*')
    .eq('supabase_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }

  if (!data) {
    return res.status(404).json({
      success: false,
      message: 'No LeetCode profile found. Please scrape your profile first.',
    });
  }

  res.json({ success: true, data });
});

// @desc    Refresh LeetCode profile (re-scrape existing handle)
// @route   PUT /api/leetcode/refresh
// @access  Private
export const refreshLeetcodeProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { data: existing } = await supabaseAdmin
    .from('leetcode_stats')
    .select('username')
    .eq('supabase_id', userId)
    .single();

  if (!existing || !existing.username) {
    res.status(404);
    throw new Error('No existing LeetCode profile found. Please scrape your profile first.');
  }

  const profileUrl = `https://leetcode.com/${existing.username}`;
  const mockReq = { user: req.user, body: { profileUrl } };
  await scrapeLeetcodeProfile(mockReq, res);
});

// @desc    Delete LeetCode profile
// @route   DELETE /api/leetcode/profile
// @access  Private
export const deleteLeetcodeProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { error } = await supabaseAdmin
    .from('leetcode_stats')
    .delete()
    .eq('supabase_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  await removeFromUserPlatforms(userId, 'leetcode');
  await updateTotalStats(userId);

  res.json({ success: true, message: 'LeetCode profile deleted successfully' });
});

/* -------------------------------------------------------------------------- */
// Helper functions – kept local to this controller for brevity
/* -------------------------------------------------------------------------- */
async function updateUserPlatforms(userId, platform, username) {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('platforms')
    .eq('supabase_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user platforms:', error);
    return;
  }

  const platforms = profile?.platforms || [];
  const idx = platforms.findIndex((p) => p.id === platform);
  if (idx > -1) platforms[idx].handle = username;
  else platforms.push({ id: platform, handle: username, verified: true });

  await supabaseAdmin.from('profiles').update({ platforms }).eq('supabase_id', userId);
}

async function removeFromUserPlatforms(userId, platform) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('platforms')
    .eq('supabase_id', userId)
    .single();
  if (!profile) return;
  const platforms = (profile.platforms || []).filter((p) => p.id !== platform);
  await supabaseAdmin.from('profiles').update({ platforms }).eq('supabase_id', userId);
}

async function updateTotalStats(userId) {
  // Get LeetCode stats only
  const { data: leet } = await supabaseAdmin
    .from('leetcode_stats')
    .select('total_solved, contests_participated, contribution_data')
    .eq('supabase_id', userId)
    .single();
  if (!leet) return;

  // Fetch existing totals
  const { data: existing } = await supabaseAdmin
    .from('total_stats')
    .select('*')
    .eq('supabase_id', userId)
    .single();

  const totalQuestions = (existing?.total_questions_solved || 0) + (leet.total_solved || 0);
  const totalContests = (existing?.total_contests_attended || 0) + (leet.contests_participated || 0);

  // Merge activity arrays
  const activityMap = new Map();
  (existing?.unified_activity || []).forEach(({ date, count }) => {
    if (date) activityMap.set(date, count || 0);
  });
  (leet.contribution_data || []).forEach(({ date, count }) => {
    if (date) {
      activityMap.set(date, (activityMap.get(date) || 0) + (count || 0));
    }
  });
  const unifiedActivity = Array.from(activityMap.entries()).map(([date, count]) => ({ date, count }));

  // Upsert
  await supabaseAdmin.from('total_stats').upsert({
    supabase_id: userId,
    total_questions_solved: totalQuestions,
    total_contests_attended: totalContests,
    unified_activity: unifiedActivity,
    last_computed_at: new Date().toISOString(),
  }, { onConflict: 'supabase_id' });
}
