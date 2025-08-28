import { 
  getUserProfile,
  updateUserProfile,
  updateUserSections,
  removePlatform,
  getUserPortfolio,
  syncUser
} from '../controllers/userController.js';

import express from "express";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.put("/sections", protect, updateUserSections);
router.delete("/platform", protect, removePlatform);

// Portfolio and Sync routes
router.get("/portfolio", protect, getUserPortfolio);
router.post("/sync", protect, syncUser);

export default router; 