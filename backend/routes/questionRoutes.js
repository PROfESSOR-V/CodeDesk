import express from "express";
import { getQuestions, createQuestion } from "../controllers/questionController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();
router.route("/").get(getQuestions).post(protect, admin, createQuestion);
export default router; 