import CodeChefScraper, { scrapeWithFallbacks } from "../utils/codechefProfileScraper.js";
import rateLimit from "express-rate-limit";

// Rate limiting
export const scrapeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    error: 'Too many scraping requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Main scrape profile endpoint
export const scrapeProfile = async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        error: 'Username is required'
      });
    }

    const clientIP = req.ip || req.connection.remoteAddress;
    console.log(`🎯 Scrape request for ${username} from IP: ${clientIP}`);

    const startTime = Date.now();
    
    // Use the fallback scraper for better reliability
    const result = await scrapeWithFallbacks(username, {
      outputDir: './scraping_output'
    });
    
    const duration = Date.now() - startTime;

    const response = {
      success: true,
      username: result.username,
      data: result,
      metadata: {
        scrapeDuration: duration,
        timestamp: new Date().toISOString(),
        clientIP: clientIP,
        scrapeMethod: 'Selenium WebDriver',
        totalContests: result.contests?.length || 0,
        totalProblems: result.problems?.length || 0,
        heatmapDays: result.heatmap?.length || 0
      }
    };

    console.log(`✅ Scraping completed in ${duration}ms for ${username}`);
    res.json(response);

  } catch (error) {
    console.error('❌ Scraping error:', error);
    
    let statusCode = 500;
    let errorMessage = error.message;

    // Handle common error types
    if (error.message.includes('does not exist') || error.message.includes('not found')) {
      statusCode = 404;
      errorMessage = `CodeChef profile '${req.body.username}' does not exist`;
    } else if (error.message.includes('timeout')) {
      statusCode = 408;
      errorMessage = 'Request timeout - please try again';
    } else if (error.message.includes('WebDriver') || error.message.includes('browser')) {
      statusCode = 503;
      errorMessage = 'Browser service unavailable - please try again later';
    } else if (error.message.includes('blocked') || error.message.includes('rate limit')) {
      statusCode = 429;
      errorMessage = 'Too many requests - please try again later';
    }

    res.status(statusCode).json({
      error: 'Scraping failed',
      message: errorMessage,
      timestamp: new Date().toISOString(),
      scrapeMethod: 'Selenium WebDriver'
    });
  }
};

// Get stored profile data
export const getProfile = async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({
        error: 'Username is required'
      });
    }

    console.log(`📖 Profile request for ${username}`);

    // For now, return a message since we don't have database integration
    // You can integrate with your database here
    res.status(501).json({
      error: 'Database integration pending',
      message: 'This endpoint requires database integration to store and retrieve profiles',
      suggestion: 'Use the /scrape endpoint to get fresh profile data'
    });

  } catch (error) {
    console.error('❌ Profile retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve profile',
      message: error.message
    });
  }
};

// Quick profile data (direct scrape without storage)
export const getQuickProfile = async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({
        error: 'Username is required'
      });
    }

    console.log(`⚡ Quick profile request for ${username}`);

    const startTime = Date.now();
    const result = await scrapeWithFallbacks(username);
    const duration = Date.now() - startTime;

    // Return simplified response
    const response = {
      success: true,
      username: result.username,
      basicInfo: result.basic_info,
      summary: {
        totalContests: result.contests?.length || 0,
        totalProblems: result.problems?.length || 0,
        heatmapDays: result.heatmap?.length || 0,
        activeDays: result.heatmap?.filter(day => day.count > 0).length || 0
      },
      scrapedAt: result.timestamp,
      duration: duration
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Quick profile error:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    else if (error.message.includes('timeout')) statusCode = 408;

    res.status(statusCode).json({
      error: 'Failed to get profile',
      message: error.message
    });
  }
};

// Get profile statistics
export const getProfileStats = async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({
        error: 'Username is required'
      });
    }

    console.log(`📊 Stats request for ${username}`);

    const result = await scrapeWithFallbacks(username);
    const stats = calculateStats(result);

    res.json({
      username: result.username,
      statistics: stats,
      calculatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Stats calculation error:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;

    res.status(statusCode).json({
      error: 'Failed to calculate statistics',
      message: error.message
    });
  }
};

// Health check for the scraper service
export const healthCheck = async (req, res) => {
  try {
    console.log('🏥 Health check requested');
    
    // Simple health check - just test scraper initialization
    const scraper = new CodeChefScraper();
    await scraper.initDriver();
    await scraper.driver?.quit();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      scrapeMethod: 'Selenium WebDriver',
      message: 'Scraper service is operational'
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      message: 'Scraper service is not operational'
    });
  }
};

// Test endpoint for quick validation
export const testScraper = async (req, res) => {
  try {
    const { username = 'tourist' } = req.query; // Default test user
    
    console.log(`🧪 Testing scraper with username: ${username}`);
    
    const startTime = Date.now();
    const result = await scrapeWithFallbacks(username);
    const duration = Date.now() - startTime;

    res.json({
      testResult: 'success',
      username: result.username,
      dataCollected: {
        basicInfo: !!result.basic_info,
        contests: result.contests?.length || 0,
        problems: result.problems?.length || 0,
        heatmap: result.heatmap?.length || 0
      },
      performanceMetrics: {
        duration: duration,
        averageSpeed: `${(duration / 1000).toFixed(2)}s`
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Scraper test failed:', error);
    res.status(500).json({
      testResult: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Helper function to calculate statistics
function calculateStats(profileData) {
  const stats = {
    overview: {},
    activity: {},
    performance: {}
  };

  // Basic overview
  stats.overview = {
    username: profileData.username,
    basicInfo: profileData.basic_info,
    totalContests: profileData.contests?.length || 0,
    totalProblems: profileData.problems?.length || 0,
    totalHeatmapDays: profileData.heatmap?.length || 0
  };

  // Activity analysis
  if (profileData.heatmap && profileData.heatmap.length > 0) {
    const activeDays = profileData.heatmap.filter(day => day.count > 0);
    const totalActivity = profileData.heatmap.reduce((sum, day) => sum + day.count, 0);
    
    stats.activity = {
      totalActiveDays: activeDays.length,
      totalSubmissions: totalActivity,
      averageDailyActivity: activeDays.length > 0 ? (totalActivity / activeDays.length).toFixed(2) : 0,
      maxDayActivity: Math.max(...profileData.heatmap.map(day => day.count)),
      activityRate: `${((activeDays.length / profileData.heatmap.length) * 100).toFixed(1)}%`
    };

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentActivity = profileData.heatmap.filter(day => 
      new Date(day.date) >= thirtyDaysAgo && day.count > 0
    );
    
    stats.activity.recentActivity = {
      activeDaysLast30: recentActivity.length,
      submissionsLast30: recentActivity.reduce((sum, day) => sum + day.count, 0)
    };
  }

  // Contest performance
  if (profileData.contests && profileData.contests.length > 0) {
    stats.performance = {
      contestHistory: profileData.contests.length,
      recentContests: profileData.contests.slice(0, 5).map(contest => ({
        name: contest.contest_name,
        date: contest.date,
        language: contest.language
      }))
    };
  }

  return stats;
}

// Helper function to format data age
function getDataAge(timestamp) {
  if (!timestamp) return 'Unknown';
  
  const now = new Date();
  const dataTime = new Date(timestamp);
  const diffMs = now - dataTime;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return 'Less than an hour ago';
}