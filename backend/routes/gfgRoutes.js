import express from 'express';
import {
    scrapeGfgProfile,
    getGfgProfile,
    deleteGfgProfile,
    refreshGfgProfile,
    getGfgLeaderboard,
    getGlobalGfgStats
} from '../controllers/gfgController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes (require authentication)
router.post('/scrape', protect, scrapeGfgProfile);
router.get('/profile', protect, getGfgProfile);
router.delete('/profile', protect, deleteGfgProfile);
router.put('/refresh', protect, refreshGfgProfile);

// Public routes
router.get('/leaderboard', getGfgLeaderboard);
router.get('/stats', getGlobalGfgStats);

export default router;
