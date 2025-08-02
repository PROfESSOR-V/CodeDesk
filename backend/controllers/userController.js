import asyncHandler from "express-async-handler";
import { supabaseAdmin } from "../utils/supabaseClient.js";
import fs from 'fs';
import path from 'path';
import { aggregatePortfolio } from "../utils/aggregatePortfolio.js";

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
  const { platformId } = req.body; // e.g. 'leetcode', 'codechef'
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
        if (!plat.stats || ageHours > 24 || (plat.stats?.totalSolved || 0) === 0) {
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

    // Fetch pre-aggregated total_stats row
    // read total_stats
    const { data: totalRow } = await supabaseAdmin
      .from('total_stats')
      .select('*')
      .eq('supabase_id', userId)
      .single();

    if (totalRow) {
      const portfolioData = {
        user: {
          id: profile?.supabase_id || userId,
          username: profile?.username || 'User',
          email: user.user.email,
          fullName: profile?.full_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'N/A',
          profilePicture: profile?.avatar_url,
          country: profile?.country,
        },
        aggregatedStats: {
          totalQuestions: totalRow.total_questions,
          easy: totalRow.easy_solved,
          medium: totalRow.medium_solved,
          hard: totalRow.hard_solved,
          rating: totalRow.rating, // array of per-platform ratings
          totalContests: totalRow.total_contests,
        },
        unifiedActivity: totalRow.heatmap,
        todayCount: totalRow.today_count,
      };
      return res.json(portfolioData);
    }

    const userMeta = {
      id: profile?.supabase_id || userId,
      username: profile?.username || 'User',
      email: user.user.email,
      fullName:
        profile?.full_name ||
        `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
        'N/A',
      profilePicture: profile?.avatar_url,
      country: profile?.country,
      college: profile?.college,
      linkedinUrl: profile?.linkedin_url,
      twitterUrl: profile?.twitter_url,
      createdAt: profile?.created_at,
    };

    const portfolioData = aggregatePortfolio(refreshedPlatforms, userMeta);
    // All additional aggregations are now handled inside aggregatePortfolio util.
      /* Legacy aggregation code removed to use aggregatePortfolio util */
      
/*
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
      // aggregated portfolio data for user
 
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

    // Persist portfolio data to a JSON file for quick access / caching
    try {
      const dataDir = path.join(process.cwd(), 'backend', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, `${portfolioData.user.username || userId}_portfolio.json`);
      fs.writeFileSync(filePath, JSON.stringify(portfolioData, null, 2), 'utf-8');
    } catch (persistErr) {
      console.error('Failed to write portfolio data file:', persistErr.message);
    }

    */
    // Persist aggregated stats back to Supabase profile
    await supabaseAdmin
      .from('profiles')
      .update({ portfolio: portfolioData.aggregatedStats })
      .eq('supabase_id', userId);

    // Return aggregated portfolio
    res.json(portfolioData);
  } catch (error) {
    console.error('Portfolio data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 