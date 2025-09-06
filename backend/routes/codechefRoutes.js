

import { Router } from 'express';
import {
  scrapeProfile,
  getProfile,
  getQuickProfile,
  getHeatmap,
  healthCheck,
  scrapeRateLimit,
  refreshRateLimit,
  refreshProfile,
  getActivities,
  refreshAllProfiles
} from '../controllers/codechefController.js';

const CodeChefRouter = Router();

// Health check endpoint
CodeChefRouter.get('/health', healthCheck);

// Profile scraping endpoint with rate limiting
CodeChefRouter.post('/scrape', scrapeRateLimit, scrapeProfile);

// Profile data retrieval endpoints
CodeChefRouter.get('/profile/:username', getProfile);
CodeChefRouter.get('/profile/:username/quick', getQuickProfile);
CodeChefRouter.get('/profile/:username/heatmap', getHeatmap);
CodeChefRouter.get('/profile/:username/activities', getActivities);

//refresh endpoint
CodeChefRouter.post('/profile/:username/refresh', refreshRateLimit , refreshProfile)

// Refresh all profiles endpoint
CodeChefRouter.post('/refresh-all', refreshAllProfiles);

// Error handling middleware
CodeChefRouter.use((err, req, res, next) => {
  console.error('Router Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

export default CodeChefRouter;