import express from "express";
import { getEducators, createEducator } from "../controllers/educatorController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();
router.route("/").get(getEducators).post(protect, admin, createEducator);
export default router; 