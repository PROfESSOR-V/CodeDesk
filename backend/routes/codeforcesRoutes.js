import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    scrapeCodeforcesProfile,
    getCodeforcesProfile,
    refreshCodeforcesProfile,
    deleteCodeforcesProfile,
    getPublicCodeforcesProfile,
    getCodeforcesLeaderboard,
    getGlobalCodeforcesStats,
    bulkScrapeCodeforcesProfiles,
    getOutdatedProfiles
} from '../controllers/codeforcesController.js';

const router = express.Router();

// Protected routes (require authentication)
router.post('/scrape', protect, scrapeCodeforcesProfile);
router.get('/profile', protect, getCodeforcesProfile);
router.put('/refresh', protect, refreshCodeforcesProfile);
router.delete('/profile', protect, deleteCodeforcesProfile);

// Admin routes (should add admin middleware in production)
router.post('/bulk-scrape', protect, bulkScrapeCodeforcesProfiles);
router.get('/outdated', protect, getOutdatedProfiles);

// Public routes (no authentication required)
router.get('/public/:handle', getPublicCodeforcesProfile);
router.get('/leaderboard', getCodeforcesLeaderboard);
router.get('/stats', getGlobalCodeforcesStats);

export default router;
