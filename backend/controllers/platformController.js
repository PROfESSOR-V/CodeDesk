import express from 'express';
const router = express.Router();
import { verifyPlatform } from '../utils/platformVerification.js';
import { protect } from '../middleware/authMiddleware.js';
import { createVerification, updateVerificationStatus, getVerification, getAllVerifications, deleteVerification } from '../models/PlatformVerification.js';

// @desc    Initialize platform verification
// @route   POST /api/platforms/init-verify
// @access  Private
router.post('/init-verify', protect, async (req, res) => {
    try {
        const { platformId, profileUrl } = req.body;

        if (!platformId || !profileUrl) {
            return res.status(400).json({
                success: false,
                message: 'Please provide platformId and profileUrl'
            });
        }

        // Basic URL validation
        if (!profileUrl.includes(platformId.toLowerCase())) {
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
                message: 'Invalid profile URL format'
            });
        }

        // Generate verification code (6 characters: 3 letters + 3 numbers)
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        let verificationCode = '';
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
            message: 'Update your profile name with this code and click verify'
        });

    } catch (error) {
        console.error('Platform verification initialization error:', error);
        res.status(500).json({
            success: false,
            message: 'Error initializing verification',
            error: error.message
        });
    }
});

// @desc    Verify platform profile
// @route   POST /api/platforms/verify
// @access  Private
router.post('/verify-platform', protect, async (req, res) => {
    try {
        const { platformId, profileUrl } = req.body;

        // Get verification record
        const verification = await getVerification(req.user.id, platformId);

        if (!verification || verification.verified) {
            return res.status(404).json({
                success: false,
                message: 'No pending verification found. Please start the verification process again.'
            });
        }

        // Check if max attempts reached (5 attempts)
        if (verification.attempts >= 4) { // Check for 4 since we're about to make another attempt
            await updateVerificationStatus(req.user.id, platformId, false);
            return res.status(400).json({
                success: false,
                message: 'Maximum verification attempts reached. Please start over.'
            });
        }

        // Verify the platform profile
        const isVerified = await verifyPlatform(platformId, verification.profile_url, verification.verification_code);

        // Update verification status
        await updateVerificationStatus(req.user.id, platformId, isVerified);

        console.log('Verification result:', {
            platformId,
            isVerified,
            userId: req.user.id
        });

        if (isVerified) {
            res.json({
                success: true,
                verified: true,
                message: 'Profile verified successfully'
            });
        } else {
            res.json({
                success: true,
                verified: false,
                message: `Verification failed. For ${platformId}, please make sure you have updated either your username, display name, or "About Me" section with the verification code: ${verificationCode}`
            });
        }
    } catch (error) {
        console.error('Platform verification error:', {
            error: error.message,
            stack: error.stack,
            platformId: req.body.platformId,
            userId: req.user.id
        });
        
        res.status(500).json({
            success: false,
            message: 'Error verifying platform profile. Please try again.',
            error: error.message
        });
    }
});
