

import CodeChefScraper from "../utils/codechefProfileScraper.js";
import { supabase } from "../config/supabaseClient.js";
import rateLimit from "express-rate-limit";

// Rate limiting setup
export const scrapeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    error: 'Too many scraping requests',
    retryAfter: '15 minutes'
  }
});

export const refreshRateLimit = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 5, // Lower limit for refresh
  message: {
    error: 'Too many refresh requests, please try again later.',
    retryAfter: '30 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Basic profile scraping
export const scrapeProfile = async (req, res) => {
  const { username,supabase_id } = req.body;
  const scraper = new CodeChefScraper();

  try {
    console.log(`🔄 Starting scrape for ${username}`);
    
    await scraper.initializeBrowser();
    const result = await scraper.scrapeProfile(username,supabase_id);

    res.json({
      success: true,
      username,
      profileId: result.profileId,
      message: 'Profile scraped successfully'
    });

  } catch (error) {
    console.error('Scraping error:', error);
    
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: 'Scraping failed',
      message: error.message
    });

  } finally {
    await scraper.cleanup();
  }
};

// Get stored profile data
export const getProfile = async (req, res) => {
  const { username } = req.params;

  try {
    console.log(`📖 Fetching profile for ${username}`);

    // First get the profile
    const { data: profile, error: profileError } = await supabase
      .from('codechef_profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }
      throw profileError;
    }

    // Get related data using supabase_id
    const [ratingHistory, contests, heatmap, badges] = await Promise.all([
      supabase.from('codechef_rating_history')
        .select('*')
        .eq('supabase_id', profile.supabase_id),
      supabase.from('codechef_contests')
        .select('*')
        .eq('supabase_id', profile.supabase_id),
      supabase.from('codechef_heatmap')
        .select('*')
        .eq('supabase_id', profile.supabase_id),
      supabase.from('codechef_badges')
        .select('*')
        .eq('supabase_id', profile.supabase_id)
    ]);

    // Combine the data
    const fullProfile = {
      ...profile,
      codechef_rating_history: ratingHistory.data || [],
      codechef_contests: contests.data || [],
      codechef_heatmap: heatmap.data || [],
      codechef_badges: badges.data || []
    };

    const error = null;

    const dataAge = Date.now() - new Date(fullProfile.last_scraped_at).getTime();
    const needsRefresh = dataAge > 24 * 60 * 60 * 1000; // 24 hours

    res.json({
      success: true,
      profile: fullProfile,
      metadata: {
        lastScraped: fullProfile.last_scraped_at,
        dataAgeHours: Math.floor(dataAge / (1000 * 60 * 60)),
        needsRefresh
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      message: error.message
    });
  }
};

// Get quick profile summary
export const getQuickProfile = async (req, res) => {
  const { username } = req.params;

  try {
    console.log(`⚡ Quick profile request for ${username}`);

    const { data: profile, error } = await supabase
      .from('codechef_profiles')
      .select(`
        username,
        rating,
        star_level,
        contests_participated,
        total_problems_solved,
        last_scraped_at,
        institute
      `)
      .eq('username', username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('Quick profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quick profile',
      message: error.message
    });
  }
};

// Get heatmap data
export const getHeatmap = async (req, res) => {
  const { username } = req.params;
  const { days = 365 } = req.query;

  try {
    console.log(`🗓️ Fetching heatmap for ${username}`);

    // First get the profile ID
    const { data: profileData, error: profileError } = await supabase
      .from('codechef_profiles')
      .select('supabase_id')
      .eq('username', username)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }
      throw profileError;
    }

    // Get heatmap data
    const { data: heatmap, error } = await supabase
      .from('codechef_heatmap')
      .select('date, count')
      .eq('supabase_id', profileData.supabase_id)

    if (error) throw error;

    console.log(`✅ Heatmap fetched : ${heatmap.length}`);

    res.json({
      success: true,
      heatmap,
      metadata: {
        days: parseInt(days),
        totalDays: heatmap.length,
        activeDays: heatmap.filter(day => day.submission_count > 0).length
      }
    });

  } catch (error) {
    console.error('Heatmap fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch heatmap',
      message: error.message
    });
  }
};

// Get activities data
export const getActivities = async (req, res) => {
  // const { username } = req.params;

  // try {
  //   console.log(`📊 Fetching activities for ${username}`);

  //   const { data: profile, error } = await supabase
  //     .from('codechef_profiles')
  //     .select('total_problems_solved, total_problems')
  //     .eq('username', username)
  //     .single();

  //   if (error) {
  //     if (error.code === 'PGRST116') {
  //       return res.status(404).json({
  //         success: false,
  //         message: 'Profile not found'
  //       });
  //     }
  //     throw error;
  //   }

  //   res.json({
  //     success: true,
  //     activities: {
  //       totalProblems: profile.total_problems,
  //       solvedProblems: profile.total_problems_solved
  //     }
  //   });

  // } catch (error) {
  //   console.error('Activities fetch error:', error);
  //   res.status(500).json({
  //     success: false,
  //     error: 'Failed to fetch activities',
  //     message: error.message
  //   });
  // }
};


export const healthCheck = async (req, res) => {
  try {
    const scraper = new CodeChefScraper();
    await scraper.initializeBrowser();
    await scraper.cleanup();

    const { data, error } = await supabase.from('codechef_profiles').select('count');
    if (error) throw error;

    res.json({
      success: true,
      status: 'healthy',
      scraper: 'operational',
      database: 'connected',
      profileCount: data[0].count
    });

  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
};



export const refreshProfile = async (req, res) => {
  const { username } = req.params;
  const { force = false } = req.query;
  const scraper = new CodeChefScraper();

  try {
    console.log(`🔄 Starting refresh for ${username}`);

    // First check if profile exists in database
    const { data: existingProfile, error: checkError } = await supabase
      .from('codechef_profiles')
      .select('id, username, last_scraped_at, rating, star_level')
      .eq('username', username)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Profile not found',
          message: `Profile ${username} doesn't exist in database. Use /scrape endpoint first.`
        });
      }
      throw checkError;
    }

    // Check if recent refresh (prevent spam) - unless forced
    if (!force) {
      const lastScraped = new Date(existingProfile.last_scraped_at);
      const timeSinceLastScrape = Date.now() - lastScraped.getTime();
      const minRefreshInterval = 15 * 60 * 1000; // 15 minutes

      if (timeSinceLastScrape < minRefreshInterval) {
        const minutesLeft = Math.ceil((minRefreshInterval - timeSinceLastScrape) / (60 * 1000));
        return res.status(429).json({
          success: false,
          error: 'Too soon to refresh',
          message: `Profile was last updated ${Math.floor(timeSinceLastScrape / (60 * 1000))} minutes ago. Please wait ${minutesLeft} more minutes.`,
          nextRefreshAllowed: new Date(lastScraped.getTime() + minRefreshInterval).toISOString(),
          hint: 'Add ?force=true to skip this check'
        });
      }
    }

    // Store old data for comparison
    const oldRating = existingProfile.rating;
    const oldStarLevel = existingProfile.star_level;

    // Initialize scraper
    console.log(`🚀 Initializing scraper for ${username}`);
    await scraper.initializeBrowser();
    
    console.log(`📊 Starting scrape operation for ${username}`);
    const startTime = Date.now();
    
    // THIS IS LIKELY WHERE THE ERROR OCCURS
    try {
      const result = await scraper.scrapeProfile(username);
      const scrapeTime = Date.now() - startTime;
      console.log(`✅ Scrape completed in ${scrapeTime}ms`);
    } catch (scrapeError) {
      console.error(`❌ Error during scraping:`, scrapeError);
      throw scrapeError; // This will be caught by the outer catch block
    }

    // Get the updated profile data - AVOID RANK() ISSUES
    console.log(`📖 Fetching updated profile data for ${username}`);
    
    // Get basic profile first
    const { data: basicProfile, error: basicError } = await supabase
      .from('codechef_profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (basicError) {
      console.error(`❌ Error fetching basic profile:`, basicError);
      throw basicError;
    }

    console.log(`✅ Basic profile fetched successfully`);

    // Fetch related data separately to avoid rank() issues
    console.log(`📊 Fetching related data separately...`);
    
    const [ratingHistory, contests, heatmap, badges] = await Promise.allSettled([
      supabase.from('codechef_rating_history')
        .select('new_rating, contest_name, contest_date')
        .eq('supabase_id', basicProfile.id)
        .order('contest_date', { ascending: false }),
      
      // AVOID rank column that might be causing issues
      supabase.from('codechef_contests')
        .select('contest_name, rating_change')
        .eq('supabase_id', basicProfile.id)
        .order('contest_date', { ascending: false }),
        
      supabase.from('codechef_heatmap')
        .select('date, submission_count, problems_solved')
        .eq('supabase_id', basicProfile.id)
        .order('date', { ascending: false }),
        
      supabase.from('codechef_badges')
        .select('badge_name, earned_date')
        .eq('supabase_id', basicProfile.id)
        .order('earned_date', { ascending: false })
    ]);

    // Build the refreshed profile object
    const refreshedProfile = {
      ...basicProfile,
      codechef_rating_history: ratingHistory.status === 'fulfilled' ? (ratingHistory.value.data || []) : [],
      codechef_contests: contests.status === 'fulfilled' ? (contests.value.data || []) : [],
      codechef_heatmap: heatmap.status === 'fulfilled' ? (heatmap.value.data || []) : [],
      codechef_badges: badges.status === 'fulfilled' ? (badges.value.data || []) : []
    };

    // Log any failures for debugging
    [ratingHistory, contests, heatmap, badges].forEach((result, index) => {
      const names = ['rating_history', 'contests', 'heatmap', 'badges'];
      if (result.status === 'rejected') {
        console.error(`❌ Failed to fetch ${names[index]}:`, result.reason);
      }
    });

    console.log(`✅ All data fetched successfully`);

    // Calculate changes
    const ratingChange = refreshedProfile.new_rating - oldRating;
    const starLevelChange = refreshedProfile.star_level - oldStarLevel;

    res.json({
      success: true,
      message: 'Profile refreshed successfully',
      username,
      profileId: refreshedProfile.id,
      refreshMetadata: {
        previousLastScraped: existingProfile.last_scraped_at,
        newLastScraped: refreshedProfile.last_scraped_at,
        scrapeTimeMs: Date.now() - startTime,
        refreshedAt: new Date().toISOString(),
        forced: force
      },
      changes: {
        rating: {
          old: oldRating,
          new: refreshedProfile.new_rating,
          change: ratingChange,
          improved: ratingChange > 0
        },
        starLevel: {
          old: oldStarLevel,
          new: refreshedProfile.star_level,
          change: starLevelChange,
          improved: starLevelChange > 0
        }
      },
      profileSummary: {
        rating: refreshedProfile.new_rating,
        starLevel: refreshedProfile.star_level,
        contestsParticipated: refreshedProfile.contests_participated,
        totalProblemsSolved: refreshedProfile.total_problems_solved,
        currentStreak: refreshedProfile.current_streak || 0,
        lastContestDate: refreshedProfile.last_contest_date
      },
      dataCounts: {
        contests: refreshedProfile.codechef_contests?.length || 0,
        heatmapDays: refreshedProfile.codechef_heatmap?.length || 0,
        ratingHistory: refreshedProfile.codechef_rating_history?.length || 0,
        badges: refreshedProfile.codechef_badges?.length || 0
      }
    });

  } catch (error) {
    console.error(`❌ Refresh error for ${username}:`, error);
    console.error(`❌ Full error details:`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details,
      hint: error.hint
    });

    let statusCode = 500;
    let errorMessage = error.message;

    // Handle specific error types
    if (error.message.includes('WITHIN GROUP is required')) {
      statusCode = 500;
      errorMessage = 'Database query error - check rank() function usage in queries';
    } else if (error.message.includes('does not exist') || error.message.includes('not found')) {
      statusCode = 404;
      errorMessage = `CodeChef profile '${username}' does not exist or has been deactivated`;
    } else if (error.message.includes('timeout')) {
      statusCode = 408;
      errorMessage = 'Refresh operation timed out - please try again';
    } else if (error.message.includes('WebDriver') || error.message.includes('browser')) {
      statusCode = 503;
      errorMessage = 'Scraping service temporarily unavailable';
    } else if (error.message.includes('rate limit')) {
      statusCode = 429;
      errorMessage = 'Rate limit exceeded - please wait before refreshing again';
    }

    res.status(statusCode).json({
      success: false,
      error: 'Profile refresh failed',
      message: errorMessage,
      username,
      timestamp: new Date().toISOString(),
      details: {
        operation: 'refresh_profile',
        scrapeMethod: 'Selenium WebDriver',
        originalError: error.message,
        errorCode: error.code,
        errorHint: error.hint
      }
    });

  } finally {
    await scraper.cleanup();
  }
};


// Refresh all users in database
export const refreshAllProfiles = async (req, res) => {
  const { 
    limit = 50, 
    maxConcurrent = 2, 
    onlyStale = true, 
    staleHours = 24,
    dryRun = false 
  } = req.query;

  try {
    console.log(`🔄 Starting refresh all profiles - limit: ${limit}, onlyStale: ${onlyStale}`);

    // Get profiles that need refreshing
    let query = supabase
      .from('codechef_profiles')
      .select('username, last_scraped_at, rating, star_level')
      .order('last_scraped_at', { ascending: true }) // Oldest first
      .limit(parseInt(limit));

    if (onlyStale) {
      const staleDate = new Date();
      staleDate.setHours(staleDate.getHours() - parseInt(staleHours));
      query = query.lt('last_scraped_at', staleDate.toISOString());
    }

    const { data: profiles, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    if (!profiles || profiles.length === 0) {
      return res.json({
        success: true,
        message: 'No profiles need refreshing',
        summary: {
          totalFound: 0,
          criteria: onlyStale ? `older than ${staleHours} hours` : 'all profiles',
          limit: parseInt(limit)
        }
      });
    }

    // If dry run, just return what would be refreshed
    if (dryRun) {
      return res.json({
        success: true,
        message: 'Dry run - no profiles were actually refreshed',
        summary: {
          totalFound: profiles.length,
          wouldRefresh: profiles.length,
          criteria: onlyStale ? `older than ${staleHours} hours` : 'all profiles'
        },
        profiles: profiles.map(p => ({
          username: p.username,
          lastScraped: p.last_scraped_at,
          hoursOld: Math.floor((Date.now() - new Date(p.last_scraped_at).getTime()) / (1000 * 60 * 60))
        }))
      });
    }

    const results = {
      successful: [],
      failed: [],
      skipped: []
    };

    const startTime = Date.now();
    const batchSize = Math.min(parseInt(maxConcurrent), 3);

    console.log(`📊 Refreshing ${profiles.length} profiles in batches of ${batchSize}`);

    // Process in batches
    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(profiles.length/batchSize)}: ${batch.map(p => p.username).join(', ')}`);

      const batchPromises = batch.map(async (profile) => {
        const scraper = new CodeChefScraper();
        
        try {
          await scraper.initialize();
          const refreshResult = await scraper.scrapeProfile(profile.username);

          // Get updated stats
          const { data: updatedProfile } = await supabase
            .from('codechef_profiles')
            .select('rating, star_level, total_problems_solved')
            .eq('username', profile.username)
            .single();

          results.successful.push({
            username: profile.username,
            profileId: refreshResult.profileId,
            changes: {
              rating: updatedProfile.rating - profile.rating,
              starLevel: updatedProfile.star_level - profile.star_level
            },
            previousLastScraped: profile.last_scraped_at,
            hoursOld: Math.floor((Date.now() - new Date(profile.last_scraped_at).getTime()) / (1000 * 60 * 60))
          });

        } catch (error) {
          console.error(`Refresh all error for ${profile.username}:`, error);
          results.failed.push({
            username: profile.username,
            error: error.message,
            hoursOld: Math.floor((Date.now() - new Date(profile.last_scraped_at).getTime()) / (1000 * 60 * 60))
          });
        } finally {
          await scraper.cleanup();
        }
      });

      await Promise.allSettled(batchPromises);
      
      // Progress update
      const processed = Math.min(i + batchSize, profiles.length);
      console.log(`Progress: ${processed}/${profiles.length} profiles processed`);
      
      // Delay between batches
      if (i + batchSize < profiles.length) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    const totalTime = Date.now() - startTime;
    const successRate = ((results.successful.length / profiles.length) * 100).toFixed(1);

    res.json({
      success: true,
      message: 'Refresh all profiles completed',
      summary: {
        totalProfiles: profiles.length,
        successful: results.successful.length,
        failed: results.failed.length,
        skipped: results.skipped.length,
        successRate: `${successRate}%`,
        totalTimeMinutes: Math.round(totalTime / (60 * 1000)),
        averageTimePerProfile: Math.round(totalTime / profiles.length / 1000)
      },
      results,
      parameters: {
        limit: parseInt(limit),
        maxConcurrent: parseInt(maxConcurrent),
        onlyStale: onlyStale,
        staleHours: parseInt(staleHours)
      },
      completedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Refresh all profiles error:', error);
    res.status(500).json({
      success: false,
      error: 'Refresh all profiles failed',
      message: error.message
    });
  }
};

// Get refresh status/statistics
export const getRefreshStatus = async (req, res) => {
  try {
    // Get refresh statistics
    const { data: stats, error } = await supabase
      .rpc('refresh_status_stats');

    if (error) {
      // Fallback to basic queries if RPC doesn't exist
      const { data: profileStats } = await supabase
        .from('codechef_profiles')
        .select('last_scraped_at')
        .not('last_scraped_at', 'is', null);

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const refreshStats = {
        totalProfiles: profileStats.length,
        lastHour: profileStats.filter(p => new Date(p.last_scraped_at) > oneHourAgo).length,
        lastDay: profileStats.filter(p => new Date(p.last_scraped_at) > oneDayAgo).length,
        lastWeek: profileStats.filter(p => new Date(p.last_scraped_at) > oneWeekAgo).length,
        needsRefresh24h: profileStats.filter(p => new Date(p.last_scraped_at) < oneDayAgo).length
      };

      return res.json({
        success: true,
        refreshStats,
        recommendations: {
          shouldRefreshAll: refreshStats.needsRefresh24h > 0,
          urgentRefreshNeeded: refreshStats.needsRefresh24h > refreshStats.totalProfiles * 0.5,
          estimatedTimeMinutes: Math.ceil(refreshStats.needsRefresh24h * 0.5) // Rough estimate
        }
      });
    }

    res.json({
      success: true,
      refreshStats: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get refresh status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get refresh status',
      message: error.message
    });
  }
};




export default {
  scrapeProfile,
  getProfile,
  getQuickProfile,
  getHeatmap,
  healthCheck
};