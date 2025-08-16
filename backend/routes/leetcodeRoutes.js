import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  scrapeLeetcodeProfile,
  getLeetcodeProfile,
  refreshLeetcodeProfile,
  deleteLeetcodeProfile,
} from '../controllers/leetcodeController.js';

const router = express.Router();

// Protected routes
router.post('/scrape', protect, scrapeLeetcodeProfile);
router.get('/profile', protect, getLeetcodeProfile);
router.put('/refresh', protect, refreshLeetcodeProfile);
router.delete('/profile', protect, deleteLeetcodeProfile);

export default router;
