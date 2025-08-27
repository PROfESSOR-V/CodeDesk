import { Router } from 'express';
import {
  scrapeProfile,
  getProfile,
  getQuickProfile,
  getProfileStats,
  scrapeRateLimit,
  healthCheck,
  testScraper
} from '../controllers/codechefController.js';

const CodeChefRouter = Router();

// Main scraping endpoint
CodeChefRouter.post('/scrape', scrapeRateLimit, scrapeProfile);

// Get profile data (database integration pending)
CodeChefRouter.get('/profile/:username', getProfile);

// Quick profile data (direct scrape)
CodeChefRouter.get('/profile/:username/quick', scrapeRateLimit, getQuickProfile);

// Get profile statistics
CodeChefRouter.get('/profile/:username/stats', scrapeRateLimit, getProfileStats);

// Health check for Selenium WebDriver
CodeChefRouter.get('/health', healthCheck);

// Test scraper functionality
CodeChefRouter.get('/test', testScraper);

// Simple status endpoint
CodeChefRouter.get('/status', (req, res) => {
  res.json({
    status: 'OK',
    service: 'CodeChef Profile Scraper',
    scrapeMethod: 'Selenium WebDriver',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'POST /scrape - Scrape and save profile',
      'GET /profile/:username - Get stored profile (pending DB)',
      'GET /profile/:username/quick - Get fresh profile data',
      'GET /profile/:username/stats - Get profile statistics', 
      'GET /health - Service health check',
      'GET /test - Test scraper functionality',
      'GET /status - Service status'
    ]
  });
});

export default CodeChefRouter;