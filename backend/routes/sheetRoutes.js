import express from "express";
import { getSheets, createSheet } from "../controllers/sheetController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();
router.route("/").get(getSheets).post(protect, admin, createSheet);
export default router; 