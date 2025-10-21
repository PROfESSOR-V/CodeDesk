import express from "express";
import { getExploreSheets } from "../controllers/sheetController.js";

const router = express.Router();

// GET /api/sheets/explore → public route
router.get("/explore", getExploreSheets);

export default router;
