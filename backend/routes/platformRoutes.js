import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { verifyPlatform } from "../utils/platformVerification.js";
import { createVerification, updateVerificationStatus, getVerification, getAllVerifications, deleteVerification } from "../models/PlatformVerification.js";

const router = express.Router();

// @desc    Initialize platform verification
// @route   POST /api/platforms/init-verify
// @access  Private
router.post("/init-verify", protect, async (req, res) => {
    try {
        const { platformId, profileUrl } = req.body;

        if (!platformId || !profileUrl) {
            return res.status(400).json({
                success: false,
                message: "Please provide platformId and profileUrl"
            });
        }

        // Basic URL validation
        if (!profileUrl.toLowerCase().includes(platformId.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: `Invalid ${platformId} profile URL. Please provide a valid profile URL.`
            });
        }

        // Validate URL format
        try {
            new URL(profileUrl);
        } catch (e) {
            return res.status(400).json({
                success: false,
                message: "Invalid profile URL format"
            });
        }

        // Generate verification code (6 characters: 3 letters + 3 numbers)
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const numbers = "0123456789";
        let verificationCode = "";
        for (let i = 0; i < 3; i++) {
            verificationCode += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        for (let i = 0; i < 3; i++) {
            verificationCode += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }

        // Create or update verification record
        await createVerification(req.user.id, platformId, profileUrl, verificationCode);

        res.json({
            success: true,
            verificationCode,
            message: "Update your profile name with this code and click verify"
        });

    } catch (error) {
        console.error("Platform verification initialization error:", error);
        res.status(500).json({
            success: false,
            message: "Error initializing verification",
            error: error.message
        });
    }
});

// @desc    Verify platform profile
// @route   POST /api/platforms/verify
// @access  Private
router.post("/verify", protect, async (req, res) => {
    try {
        const { platformId } = req.body;

        // Get verification record
        const verification = await getVerification(req.user.id, platformId);

        if (!verification) {
            return res.status(404).json({
                success: false,
                message: "No pending verification found. Please start the verification process again."
            });
        }

        // Check if max attempts reached (5 attempts)
        if (verification.attempts >= 4) { // Check for 4 since we're about to make another attempt
            await updateVerificationStatus(req.user.id, platformId, false);
            return res.status(400).json({
                success: false,
                message: "Maximum verification attempts reached. Please start over."
            });
        }

        // Verify the platform profile
        const isVerified = await verifyPlatform(
            platformId,
            verification.profile_url,
            verification.verification_code
        );

        if (isVerified) {
            // Mark as verified via Supabase helper
            await updateVerificationStatus(req.user.id, platformId, true);
            res.json({
                success: true,
                verified: true,
                message: "Profile verified successfully"
            });
        } else {
            await updateVerificationStatus(req.user.id, platformId, false);
            const updatedVerification = await getVerification(req.user.id, platformId);
            res.json({
                success: true,
                verified: false,
                attemptsLeft: 5 - updatedVerification.attempts,
                message: `Verification failed. Make sure you have updated your profile name to exactly: ${verification.verification_code}`
            });
        }
    } catch (error) {
        console.error("Platform verification error:", error);
        res.status(500).json({
            success: false,
            message: "Error verifying profile",
            error: error.message
        });
    }
});

// @desc    Get verification status
// @route   GET /api/platforms/verification-status/:platformId
// @access  Private
router.get("/verification-status/:platformId", protect, async (req, res) => {
    try {
        const verification = await getVerification(req.user.id, req.params.platformId);

        res.json({
            success: true,
            verification: verification || null
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching verification status",
            error: error.message
        });
    }
});

export default router;
