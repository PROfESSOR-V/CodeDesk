import express from "express";
import { getPlatforms, createPlatform } from "../controllers/platformController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();
router.route("/").get(getPlatforms).post(protect, admin, createPlatform);
export default router; 