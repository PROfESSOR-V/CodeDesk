import { updateUserSections, getUserProfile, syncSupabaseUser, updateUserProfile, removePlatform } from "../controllers/userController.js";

import express from "express";
// import { getUserProfile, syncSupabaseUser, updateUserProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/profile", protect, getUserProfile);
router.post("/sync", syncSupabaseUser);
router.put("/sections", protect, updateUserSections);
router.delete("/platform", protect, removePlatform);
export default router; 