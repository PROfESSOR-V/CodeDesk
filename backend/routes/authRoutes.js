import express from "express";
import { authUser, registerUser } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", authUser);
router.post("/register", registerUser);

export default router; 