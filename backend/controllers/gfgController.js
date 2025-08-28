import asyncHandler from 'express-async-handler';
import { supabaseAdmin } from '../utils/supabaseClient.js';
import { gfgStats } from '../utils/platformStats.js';

/**
 * GFG (GeeksforGeeks) Profile Controller
 * Handles API endpoints for GFG profile management
 */

// @desc    Scrape and save GFG profile
// @route   POST /api/gfg/scrape
// @access  Private
export const scrapeGfgProfile = asyncHandler(async (req, res) => {
    const { profileUrl, gfgUsername } = req.body;
    const userId = req.user.id;

    // Handle both profileUrl and gfgUsername inputs
    let targetUrl = profileUrl;
    if (!targetUrl && gfgUsername) {
        targetUrl = `https://auth.geeksforgeeks.org/user/${gfgUsername}`;
    }

    if (!targetUrl) {
        res.status(400);
        throw new Error('Profile URL or GFG username is required');
    }

    // Validate profile URL
    if (!isValidGfgProfileUrl(targetUrl)) {
        res.status(400);
        throw new Error('Invalid GFG profile URL. Expected format: https://auth.geeksforgeeks.org/user/username');
    }

    try {
        console.log(`Starting GFG profile scrape for user ${userId}`);
        const profileData = await gfgStats(targetUrl);

        if (profileData.error) {
            res.status(400);
            throw new Error(`Failed to scrape GFG profile: ${profileData.error}`);
        }

        // Generate activity data for heatmap
        const activityData = generateGfgActivityData(profileData);

        // Generate monthly activity breakdown
        const monthlyActivity = generateMonthlyActivity(profileData);

        // Save to gfg_stats table with enhanced fields
        const { error: saveError } = await supabaseAdmin
            .from('gfg_stats')
            .upsert({
                supabase_id: userId,
                username: profileData.username,
                display_name: profileData.displayName,
                practice_problems: profileData.practiceProblems || 0,
                coding_score: profileData.codingScore || 0,
                monthly_rank: profileData.monthlyRank,
                overall_rank: profileData.overallRank,
                streak: profileData.streak || 0,
                contests_participated: profileData.contestsParticipated || 0,
                easy_solved: profileData.easySolved || 0,
                medium_solved: profileData.mediumSolved || 0,
                hard_solved: profileData.hardSolved || 0,
                total_solved: profileData.totalSolved || profileData.practiceProblems || 0,
                active_days: profileData.activeDays || 0,
                // Enhanced difficulty breakdown
                school_problems: profileData.schoolProblems || 0,
                basic_problems: profileData.basicProblems || 0,
                easy_problems: profileData.easyProblems || 0,
                medium_problems: profileData.mediumProblems || 0,
                hard_problems: profileData.hardProblems || 0,
                monthly_activity: monthlyActivity,
                activity_data: activityData,
                contribution_graph_html: profileData.contributionGraphHtml,
                last_refreshed_at: new Date().toISOString()
            }, { 
                onConflict: 'supabase_id',
                ignoreDuplicates: false 
            });

        if (saveError) {
            console.error('Error saving to gfg_stats:', saveError);
            throw new Error('Failed to save profile data');
        }

        // Update user's platforms array in profiles table
        await updateUserPlatforms(userId, 'gfg', profileData.username);

        // Update total stats
        await updateTotalStats(userId);

        console.log(`Successfully scraped and saved GFG profile for user ${userId}`);

        res.status(201).json({
            success: true,
            message: 'GFG profile scraped and saved successfully',
            data: {
                username: profileData.username,
                displayName: profileData.displayName,
                practiceProblems: profileData.practiceProblems,
                codingScore: profileData.codingScore,
                totalSolved: profileData.totalSolved,
                streak: profileData.streak
            }
        });
    } catch (error) {
        console.error('Error in scrapeGfgProfile:', error);
        res.status(500);
        throw new Error(error.message || 'Failed to scrape GFG profile');
    }
});

// @desc    Get user's GFG profile data
// @route   GET /api/gfg/profile
// @access  Private
export const getGfgProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const { data, error } = await supabaseAdmin
        .from('gfg_stats')
        .select('*')
        .eq('supabase_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
    }

    if (!data) {
        res.status(404);
        throw new Error('GFG profile not found. Please scrape your profile first.');
    }

    res.json({
        success: true,
        data: data
    });
});

// @desc    Delete user's GFG profile
// @route   DELETE /api/gfg/profile
// @access  Private
export const deleteGfgProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const { error } = await supabaseAdmin
        .from('gfg_stats')
        .delete()
        .eq('supabase_id', userId);

    if (error) {
        throw new Error(error.message);
    }

    // Remove platform from user's platforms array
    await removeFromUserPlatforms(userId, 'gfg');

    // Update total stats
    await updateTotalStats(userId);

    res.json({
        success: true,
        message: 'GFG profile deleted successfully'
    });
});

// @desc    Refresh GFG profile data
// @route   PUT /api/gfg/refresh
// @access  Private
export const refreshGfgProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Get current profile URL
    const { data: currentProfile } = await supabaseAdmin
        .from('gfg_stats')
        .select('username')
        .eq('supabase_id', userId)
        .single();

    if (!currentProfile) {
        res.status(404);
        throw new Error('No GFG profile found to refresh');
    }

    const profileUrl = `https://auth.geeksforgeeks.org/user/${currentProfile.username}`;
    
    // Re-scrape the profile
    req.body = { profileUrl };
    await scrapeGfgProfile(req, res);
});

// @desc    Get GFG leaderboard
// @route   GET /api/gfg/leaderboard
// @access  Public
export const getGfgLeaderboard = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const { data, error } = await supabaseAdmin
        .from('gfg_stats')
        .select('username, display_name, practice_problems, coding_score, streak, total_solved')
        .order('practice_problems', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        throw new Error(error.message);
    }

    res.json({
        success: true,
        data: data,
        pagination: {
            limit,
            offset,
            total: data.length
        }
    });
});

// @desc    Get global GFG statistics
// @route   GET /api/gfg/stats
// @access  Public
export const getGlobalGfgStats = asyncHandler(async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('gfg_stats')
        .select('practice_problems, coding_score, total_solved, streak');

    if (error) {
        throw new Error(error.message);
    }

    const stats = {
        totalUsers: data.length,
        totalProblems: data.reduce((sum, user) => sum + (user.practice_problems || 0), 0),
        averageProblems: data.length > 0 ? Math.round(data.reduce((sum, user) => sum + (user.practice_problems || 0), 0) / data.length) : 0,
        topCodingScore: Math.max(...data.map(user => user.coding_score || 0)),
        topStreak: Math.max(...data.map(user => user.streak || 0))
    };

    res.json({
        success: true,
        data: stats
    });
});

// Helper Functions

/**
 * Validate GFG profile URL
 */
function isValidGfgProfileUrl(url) {
    const gfgProfileRegex = /^https?:\/\/(auth\.)?geeksforgeeks\.org\/user\/[a-zA-Z0-9_.-]+\/?$/;
    return gfgProfileRegex.test(url);
}

/**
 * Generate monthly activity breakdown
 */
function generateMonthlyActivity(profileData) {
    const monthlyActivity = {};
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // Generate activity for last 12 months
    for (let i = 0; i < 12; i++) {
        let month = currentMonth - i;
        let year = currentYear;
        
        if (month <= 0) {
            month += 12;
            year -= 1;
        }
        
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
        
        // Estimate monthly activity based on total problems and current streak
        const totalSolved = profileData.totalSolved || profileData.practiceProblems || 0;
        const baseActivity = Math.floor(totalSolved / 12); // Average per month
        const variation = Math.floor(Math.random() * (baseActivity * 0.5)); // Add some variation
        
        monthlyActivity[monthKey] = {
            problems_solved: Math.max(0, baseActivity + variation - Math.floor(variation / 2)),
            active_days: Math.min(Math.floor(Math.random() * 30) + 1, 30),
            streak_contribution: i === 0 ? (profileData.streak || 0) : Math.floor(Math.random() * 10)
        };
    }
    
    return monthlyActivity;
}

/**
 * Generate activity data for heatmap visualization
 */
function generateGfgActivityData(profileData) {
    const activityData = [];
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    
    // If we have actual contribution data, use it
    if (profileData.contributionData && Array.isArray(profileData.contributionData)) {
        return profileData.contributionData;
    }
    
    // Otherwise, generate estimated activity based on total problems solved
    const totalSolved = profileData.totalSolved || profileData.practiceProblems || 0;
    const activeDays = profileData.activeDays || Math.min(totalSolved * 0.8, 365);
    
    // Generate random activity distribution over the past year
    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().slice(0, 10);
        
        // Simulate activity based on total problems solved
        let count = 0;
        if (activeDays > 0 && Math.random() < (activeDays / 365)) {
            count = Math.floor(Math.random() * 5) + 1; // 1-5 problems per active day
        }
        
        activityData.push({
            date: dateStr,
            count: count
        });
    }
    
    return activityData;
}

/**
 * Update user's platforms array in profiles table
 */
async function updateUserPlatforms(userId, platform, username) {
    // Get current platforms
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('platforms')
        .eq('supabase_id', userId)
        .single();

    const currentPlatforms = profile?.platforms || {};
    
    // Update the specific platform
    currentPlatforms[platform] = {
        username: username,
        verified: true,
        added_at: new Date().toISOString()
    };

    // Save back to database
    const { error } = await supabaseAdmin
        .from('profiles')
        .update({ platforms: currentPlatforms })
        .eq('supabase_id', userId);

    if (error) {
        console.error('Error updating platforms:', error);
    }
}

/**
 * Remove platform from user's platforms array
 */
async function removeFromUserPlatforms(userId, platform) {
    // Get current platforms
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('platforms')
        .eq('supabase_id', userId)
        .single();

    const currentPlatforms = profile?.platforms || {};
    
    // Remove the platform
    delete currentPlatforms[platform];

    // Save back to database
    const { error } = await supabaseAdmin
        .from('profiles')
        .update({ platforms: currentPlatforms })
        .eq('supabase_id', userId);

    if (error) {
        console.error('Error updating platforms:', error);
    }
}

/**
 * Update total stats for user
 */
async function updateTotalStats(userId) {
    // Get GFG stats
    const { data: gfgStats } = await supabaseAdmin
        .from('gfg_stats')
        .select('total_solved, contests_participated, activity_data')
        .eq('supabase_id', userId)
        .single();

    if (!gfgStats) return;

    // Get existing total stats
    const { data: existingStats } = await supabaseAdmin
        .from('total_stats')
        .select('*')
        .eq('supabase_id', userId)
        .single();

    const totalQuestions = (existingStats?.total_questions_solved || 0) + (gfgStats.total_solved || 0);
    const totalContests = (existingStats?.total_contests_attended || 0) + (gfgStats.contests_participated || 0);
    
    // Merge activity data
    const existingActivity = existingStats?.unified_activity || [];
    const gfgActivity = gfgStats.activity_data || [];
    
    // Combine and deduplicate activity data
    const activityMap = new Map();
    
    // Add existing activity
    existingActivity.forEach(entry => {
        if (entry.date) {
            activityMap.set(entry.date, entry.count || 0);
        }
    });
    
    // Add GFG activity (merge counts for same dates)
    gfgActivity.forEach(entry => {
        if (entry.date) {
            const existing = activityMap.get(entry.date) || 0;
            activityMap.set(entry.date, existing + (entry.count || 0));
        }
    });
    
    // Convert back to array
    const mergedActivity = Array.from(activityMap.entries()).map(([date, count]) => ({
        date,
        count
    }));

    // Update total_stats table
    const { error } = await supabaseAdmin
        .from('total_stats')
        .upsert({
            supabase_id: userId,
            total_questions_solved: totalQuestions,
            total_contests_attended: totalContests,
            unified_activity: mergedActivity,
            last_computed_at: new Date().toISOString()
        }, { onConflict: 'supabase_id' });

    if (error) {
        console.error('Error updating total stats:', error);
    }
}
