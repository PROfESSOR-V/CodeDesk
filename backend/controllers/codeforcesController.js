import asyncHandler from 'express-async-handler';
import CodeforcesProfileScraper from '../utils/codeforcesProfileScraper.js';
import { supabaseAdmin } from '../utils/supabaseClient.js';

/**
 * Codeforces Profile Controller
 * Handles API endpoints for Codeforces profile management
 */

// @desc    Scrape and save Codeforces profile
// @route   POST /api/codeforces/scrape
// @access  Private
export const scrapeCodeforcesProfile = asyncHandler(async (req, res) => {
    const { profileUrl, codeforcesHandle } = req.body;
    const userId = req.user.id;

    // Handle both profileUrl and codeforcesHandle inputs
    let targetUrl = profileUrl;
    if (!targetUrl && codeforcesHandle) {
        targetUrl = `https://codeforces.com/profile/${codeforcesHandle}`;
    }

    if (!targetUrl) {
        res.status(400);
        throw new Error('Profile URL or Codeforces handle is required');
    }

    // Validate profile URL
    if (!CodeforcesProfileScraper.isValidProfileUrl(targetUrl)) {
        res.status(400);
        throw new Error('Invalid Codeforces profile URL. Expected format: https://codeforces.com/profile/username');
    }

    try {
        const scraper = new CodeforcesProfileScraper();
        
        // Scrape profile data
        console.log(`Starting Codeforces profile scrape for user ${userId}`);
        const profileData = await scraper.scrapeProfile(targetUrl);

        // Save to codeforces_stats table
        const { error: saveError } = await supabaseAdmin
            .from('codeforces_stats')
            .upsert({
                supabase_id: userId,
                handle: profileData.username,
                rating: profileData.rating,
                max_rating: profileData.maxRating,
                rank: profileData.rank,
                max_rank: profileData.maxRank,
                contribution: profileData.contribution,
                last_online_days_ago: profileData.lastVisit ? 
                    extractDaysFromLastVisit(profileData.lastVisit) : null,
                friend_of_count: profileData.friendsCount,
                contest_history: profileData.contestHistory,
                submission_stats: profileData.submissionStats,
                language_stats: profileData.languageStats,
                tag_stats: profileData.tagStats,
                activity_data: profileData.activityData,
                last_refreshed_at: new Date().toISOString()
            }, { 
                onConflict: 'supabase_id',
                ignoreDuplicates: false 
            });

        if (saveError) {
            console.error('Error saving to codeforces_stats:', saveError);
            throw new Error('Failed to save profile data');
        }

        // Update user's platforms array in profiles table
        await updateUserPlatforms(userId, 'codeforces', profileData.username);

        // Update total stats
        await updateTotalStats(userId);

        // Close the scraper browser
        await scraper.closeBrowser();

        console.log(`Successfully scraped and saved Codeforces profile for user ${userId}`);

        res.status(201).json({
            success: true,
            message: 'Codeforces profile scraped and saved successfully',
            data: {
                username: profileData.username,
                displayName: profileData.displayName,
                rating: profileData.rating,
                totalSolved: profileData.totalSolved,
                totalContests: profileData.totalContests
            }
        });

    } catch (error) {
        console.error('Codeforces scraping error:', error);
        res.status(500);
        throw new Error(`Failed to scrape Codeforces profile: ${error.message}`);
    }
});

// @desc    Get user's Codeforces profile data
// @route   GET /api/codeforces/profile
// @access  Private
export const getCodeforcesProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const { data, error } = await supabaseAdmin
        .from('codeforces_stats')
        .select('*')
        .eq('supabase_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
    }

    if (!data) {
        return res.status(404).json({
            success: false,
            message: 'No Codeforces profile found. Please scrape your profile first.'
        });
    }

    res.json({
        success: true,
        data: data
    });
});

// @desc    Refresh user's Codeforces profile
// @route   PUT /api/codeforces/refresh
// @access  Private
export const refreshCodeforcesProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Get existing profile to find the handle
    const { data: existing, error: fetchError } = await supabaseAdmin
        .from('codeforces_stats')
        .select('handle')
        .eq('supabase_id', userId)
        .single();

    if (fetchError || !existing) {
        res.status(404);
        throw new Error('No existing Codeforces profile found. Please scrape your profile first.');
    }

    // Trigger a new scrape with the existing handle
    const profileUrl = `https://codeforces.com/profile/${existing.handle}`;
    
    // Call the scrape function with mock request
    const mockReq = {
        user: req.user,
        body: { profileUrl }
    };

    try {
        await scrapeCodeforcesProfile(mockReq, res);
    } catch (error) {
        res.status(500);
        throw new Error(`Failed to refresh profile: ${error.message}`);
    }
});

// @desc    Delete user's Codeforces profile
// @route   DELETE /api/codeforces/profile
// @access  Private
export const deleteCodeforcesProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const { error } = await supabaseAdmin
        .from('codeforces_stats')
        .delete()
        .eq('supabase_id', userId);

    if (error) {
        throw new Error(error.message);
    }

    // Remove from user's platforms array
    await removeFromUserPlatforms(userId, 'codeforces');

    // Update total stats
    await updateTotalStats(userId);

    res.json({
        success: true,
        message: 'Codeforces profile deleted successfully'
    });
});

// @desc    Get public Codeforces profile (no auth required)
// @route   GET /api/codeforces/public/:handle
// @access  Public
export const getPublicCodeforcesProfile = asyncHandler(async (req, res) => {
    const { handle } = req.params;

    const { data, error } = await supabaseAdmin
        .from('codeforces_stats')
        .select('handle, rating, max_rating, rank, max_rank, submission_stats, contest_history, last_refreshed_at')
        .eq('handle', handle)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
    }

    if (!data) {
        return res.status(404).json({
            success: false,
            message: 'Profile not found'
        });
    }

    res.json({
        success: true,
        data: data
    });
});

// @desc    Get Codeforces leaderboard
// @route   GET /api/codeforces/leaderboard
// @access  Public
export const getCodeforcesLeaderboard = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const { data, error } = await supabaseAdmin
        .from('codeforces_stats')
        .select('handle, rating, max_rating, rank, max_rank, submission_stats')
        .order('rating', { ascending: false })
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

// @desc    Get global Codeforces statistics
// @route   GET /api/codeforces/stats
// @access  Public
export const getGlobalCodeforcesStats = asyncHandler(async (req, res) => {
    // Get total users, average rating, etc.
    const { data, error } = await supabaseAdmin
        .from('codeforces_stats')
        .select('rating, max_rating, submission_stats');

    if (error) {
        throw new Error(error.message);
    }

    const stats = {
        totalUsers: data.length,
        averageRating: data.reduce((sum, user) => sum + (user.rating || 0), 0) / data.length || 0,
        averageMaxRating: data.reduce((sum, user) => sum + (user.max_rating || 0), 0) / data.length || 0,
        totalSolved: data.reduce((sum, user) => sum + ((user.submission_stats?.accepted || 0)), 0)
    };

    res.json({
        success: true,
        data: stats
    });
});

// @desc    Bulk scrape Codeforces profiles (Admin)
// @route   POST /api/codeforces/bulk-scrape
// @access  Private (Admin)
export const bulkScrapeCodeforcesProfiles = asyncHandler(async (req, res) => {
    const { handles } = req.body;

    if (!handles || !Array.isArray(handles)) {
        res.status(400);
        throw new Error('Handles array is required');
    }

    const results = [];
    const scraper = new CodeforcesProfileScraper();

    for (const handle of handles) {
        try {
            const profileUrl = `https://codeforces.com/profile/${handle}`;
            const profileData = await scraper.scrapeProfile(profileUrl);
            
            // Save to database (you'd need to associate with a user or create a system user)
            results.push({
                handle,
                success: true,
                data: profileData
            });
        } catch (error) {
            results.push({
                handle,
                success: false,
                error: error.message
            });
        }
    }

    await scraper.closeBrowser();

    res.json({
        success: true,
        message: `Bulk scrape completed. ${results.filter(r => r.success).length}/${handles.length} successful.`,
        results
    });
});

// @desc    Get outdated profiles that need refresh
// @route   GET /api/codeforces/outdated
// @access  Private (Admin)
export const getOutdatedProfiles = asyncHandler(async (req, res) => {
    const hours = parseInt(req.query.hours) || 24;
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
        .from('codeforces_stats')
        .select('supabase_id, handle, last_refreshed_at')
        .lt('last_refreshed_at', cutoffTime);

    if (error) {
        throw new Error(error.message);
    }

    res.json({
        success: true,
        data: data,
        message: `Found ${data.length} profiles older than ${hours} hours`
    });
});

// Helper Functions

/**
 * Extract days from last visit string like "2 days ago"
 */
function extractDaysFromLastVisit(lastVisit) {
    const match = lastVisit.match(/(\d+)\s+days?\s+ago/);
    return match ? parseInt(match[1]) : null;
}

/**
 * Update user's platforms array in profiles table
 */
async function updateUserPlatforms(userId, platform, handle) {
    // Get current platforms
    const { data: profile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('platforms')
        .eq('supabase_id', userId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching user platforms:', fetchError);
        return;
    }

    const platforms = profile?.platforms || [];
    const platformIndex = platforms.findIndex(p => p.id === platform);

    if (platformIndex > -1) {
        platforms[platformIndex].handle = handle;
    } else {
        platforms.push({ id: platform, handle });
    }

    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ platforms })
        .eq('supabase_id', userId);

    if (updateError) {
        console.error('Error updating user platforms:', updateError);
    }
}

/**
 * Remove platform from user's platforms array
 */
async function removeFromUserPlatforms(userId, platform) {
    const { data: profile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('platforms')
        .eq('supabase_id', userId)
        .single();

    if (fetchError) {
        console.error('Error fetching user platforms:', fetchError);
        return;
    }

    const platforms = (profile?.platforms || []).filter(p => p.id !== platform);

    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ platforms })
        .eq('supabase_id', userId);

    if (updateError) {
        console.error('Error removing platform:', updateError);
    }
}

/**
 * Update total stats for user
 */
async function updateTotalStats(userId) {
    // Get Codeforces stats
    const { data: cfStats } = await supabaseAdmin
        .from('codeforces_stats')
        .select('submission_stats, contest_history')
        .eq('supabase_id', userId)
        .single();

    const totalQuestions = cfStats?.submission_stats?.uniqueSolved || 0;
    const totalContests = cfStats?.contest_history?.length || 0;

    // Update total_stats table
    const { error } = await supabaseAdmin
        .from('total_stats')
        .upsert({
            supabase_id: userId,
            total_questions_solved: totalQuestions,
            total_contests_attended: totalContests,
            last_computed_at: new Date().toISOString()
        }, { onConflict: 'supabase_id' });

    if (error) {
        console.error('Error updating total stats:', error);
    }
}
