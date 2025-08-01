import { 
  getUserProfile,
  syncSupabaseUser, 
  updateUserProfile,
  updateUserSections,
  removePlatform,
  getPortfolioData
} from '../controllers/userController.js';

import express from "express";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/profile", protect, getUserProfile);
router.post("/sync", syncSupabaseUser);
router.put("/profile", protect, updateUserProfile);
router.put("/sections", protect, updateUserSections);
router.delete("/platform", protect, removePlatform);

// Portfolio route
router.get('/portfolio', protect, getPortfolioData);

export default router; 