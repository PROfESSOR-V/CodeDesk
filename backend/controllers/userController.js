import asyncHandler from "express-async-handler";
import { supabaseAdmin } from "../utils/supabaseClient.js";

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

// @desc    Sync Supabase user to MongoDB
// @route   POST /api/users/sync
// @access  Public (called by frontend or webhook)
export const syncSupabaseUser = asyncHandler(async (req, res) => {
  const { supabaseId, email, name } = req.body;
  if (!supabaseId || !email) {
    res.status(400);
    throw new Error("Missing supabaseId or email");
  }

  let user = await User.findOne({ email });
  if (user) {
    if (!user.supabaseId) {
      user.supabaseId = supabaseId;
      await user.save();
    }
  } else {
    user = await User.create({ name: name || "", email, supabaseId });
  }

  const { generateToken } = await import("../utils/generateToken.js");
  const token = generateToken(user._id, user.role);
  res.status(200).json({ message: "User synced", userId: user._id, token });
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
  const { platformName } = req.body;
  
  // Get current platforms
  const { data, error: fetchError } = await supabaseAdmin
    .from("profiles")
    .select("platforms")
    .eq("supabase_id", req.user.id)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  
  // Filter out the platform to remove
  const updatedPlatforms = (data?.platforms || []).filter(p => p.name !== platformName);
  
  // Update platforms array
  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ platforms: updatedPlatforms })
    .eq("supabase_id", req.user.id);

  if (updateError) throw new Error(updateError.message);

  res.json({ message: "Platform removed successfully", platforms: updatedPlatforms });
}); 

// Get user portfolio data (aggregated stats from all verified platforms)
export const getPortfolioData = async (req, res) => {
  try {
    const { data: user, error: userError } = await supabaseAdmin.auth.getUser(req.headers.authorization?.split(' ')[1]);
    if (userError || !user?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = user.user.id;

    // Fetch user profile and platforms
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('supabase_id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    // Extract verified platforms from the platforms array
    const allPlatforms = profile?.platforms || [];
    const verifiedPlatforms = allPlatforms.filter(p => p.verified === true);

    // Fetch fresh stats if not present or older than 24h
    const refreshedPlatforms = await Promise.all(
      verifiedPlatforms.map(async (plat) => {
        const lastFetch = new Date(plat.stats?.fetchedAt || 0);
        const ageHours = (Date.now() - lastFetch.getTime()) / 36e5;
        if (!plat.stats || ageHours > 24) {
          try {
            const freshStats = await (await import('../utils/platformStats.js')).getPlatformStats(plat.id, plat.url);
            freshStats.fetchedAt = new Date().toISOString();
            // update Supabase profile->platforms array
            const updatedArr = allPlatforms.map(p => p.id === plat.id ? { ...p, stats: freshStats } : p);
            await supabaseAdmin
              .from('profiles')
              .update({ platforms: updatedArr })
              .eq('supabase_id', userId);
            return { ...plat, stats: freshStats };
          } catch (err) {
            console.error('Fetch stats failed for', plat.id, err.message);
            return plat;
          }
        }
        return plat;
      })
    );

    // Aggregate statistics across all platforms
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
    let unifiedActivityMap = {};

    refreshedPlatforms.forEach(platform => {
      const stats = platform.stats || {};
      
      // Aggregate basic stats with priority (avoid double-counting the same platform twice)
      const solved =
        stats.totalSolved ??
        stats.practiceProblems ??
        stats.solvedCount ?? // LeetCode
        stats.problemsSolved ??
        0;
      totalQuestions += parseInt(solved) || 0;
      
      // Aggregate active days
      if (stats.activeDays) totalActiveDays += parseInt(stats.activeDays) || 0;

      // Aggregate rating/score with priority
      const ratingVal =
        stats.rating ??
        stats.codingScore ??
        stats.score ??
        0;
      totalRating += parseInt(ratingVal) || 0;
      
      // Problem difficulty breakdown  
      if (stats.easySolved) easyProblems += parseInt(stats.easySolved) || 0;
      if (stats.mediumSolved) mediumProblems += parseInt(stats.mediumSolved) || 0;
      if (stats.hardSolved) hardProblems += parseInt(stats.hardSolved) || 0;
      
      // Contest data
      if (stats.contestsParticipated) totalContests += parseInt(stats.contestsParticipated) || 0;
      if (stats.contestRating) {
        contestRatings.push({
          platform: platform.id,
          rating: stats.contestRating,
          maxRating: stats.maxRating || stats.contestRating
        });
      }
      
      // Platform-specific stats
      platformStats.push({
        platform: platform.id,
        username: stats.username || 'N/A',
        stats: stats,
        profileUrl: platform.url,
        verifiedAt: platform.verifiedAt
      });
      
      // Contribution graph data (if available)
      if (stats.contributionGraphHtml || stats.contributionData) {
        contributionData[platform.id] = {
          html: stats.contributionGraphHtml,
          data: stats.contributionData
        };
        // Merge into unified activity map
        if (stats.contributionData && Array.isArray(stats.contributionData)) {
          stats.contributionData.forEach(({ date, count }) => {
            if (!date) return;
            unifiedActivityMap[date] = (unifiedActivityMap[date] || 0) + (parseInt(count) || 0);
          });
        }
      }
      
      // Awards/achievements
      if (stats.badges || stats.achievements) {
        awards.push({
          platform: platform.id,
          badges: stats.badges || [],
          achievements: stats.achievements || []
        });
      }
      
      // DSA topic analysis (mock data for now - will be enhanced later)
      if (stats.topicWiseStats) {
        Object.entries(stats.topicWiseStats).forEach(([topic, count]) => {
          dsaTopics[topic] = (dsaTopics[topic] || 0) + count;
        });
      }
    });

    // Mock DSA topics if no data available
    if (Object.keys(dsaTopics).length === 0 && totalQuestions > 0) {
      dsaTopics = {
        'Arrays': Math.floor(totalQuestions * 0.25),
        'Strings': Math.floor(totalQuestions * 0.15),
        'Dynamic Programming': Math.floor(totalQuestions * 0.12),
        'Trees': Math.floor(totalQuestions * 0.10),
        'Graphs': Math.floor(totalQuestions * 0.08),
        'Linked Lists': Math.floor(totalQuestions * 0.08),
        'Sorting': Math.floor(totalQuestions * 0.07),
        'Binary Search': Math.floor(totalQuestions * 0.06),
        'Hash Tables': Math.floor(totalQuestions * 0.05),
        'Others': Math.floor(totalQuestions * 0.04)
      };
    }

    // Recompute active days based on unified activity map (unique dates)
    if (Object.keys(unifiedActivityMap).length > 0) {
      totalActiveDays = Object.keys(unifiedActivityMap).length;
    }

    const portfolioData = {
      user: {
        id: profile?.supabase_id || userId,
        username: profile?.username || 'User',
        email: user.user.email,
        fullName: profile?.full_name || profile?.first_name + ' ' + profile?.last_name || 'N/A',
        profilePicture: profile?.avatar_url,
        country: profile?.country,
        college: profile?.college,
        linkedinUrl: profile?.linkedin_url,
        twitterUrl: profile?.twitter_url,
        createdAt: profile?.created_at
      },
      verifiedPlatforms: platformStats,
      aggregatedStats: {
        totalQuestions,
        totalActiveDays,
        totalRating,
        totalContests,
        problemDifficulty: {
          easy: easyProblems,
          medium: mediumProblems,
          hard: hardProblems
        }
      },
      contributionData,
      unifiedActivity: Object.entries(unifiedActivityMap).map(([date, count]) => ({ date, count })),
      contestRatings,
      awards,
      dsaTopics
    };

    res.json(portfolioData);
  } catch (error) {
    console.error('Portfolio data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 