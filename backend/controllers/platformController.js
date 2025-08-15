import express from 'express';
const router = express.Router();
import { verifyPlatform } from '../utils/platformVerification.js';
import { protect } from '../middleware/authMiddleware.js';
import { createVerification, updateVerificationStatus, getVerification, getAllVerifications, deleteVerification } from '../models/PlatformVerification.js';
import { scrapeCodeforcesProfile } from './codeforcesController.js';
import asyncHandler from 'express-async-handler';
import { supabaseAdmin } from '../utils/supabaseClient.js';

// @desc    Initialize platform verification
// @route   POST /api/platforms/init-verify
// @access  Private
router.post('/init-verify', protect, async (req, res) => {
    try {
        const { platformId, profileUrl } = req.body;

        console.log("Received request payload:", { platformId, profileUrl });

        if (!platformId || !profileUrl) {
            console.error("Validation error: Missing platformId or profileUrl");
            return res.status(400).json({
                success: false,
                message: 'Please provide platformId and profileUrl'
            });
        }

        // Basic URL validation
        if (!profileUrl.includes(platformId.toLowerCase())) {
            console.error(`Validation error: Invalid ${platformId} profile URL`);
            return res.status(400).json({
                success: false,
                message: `Invalid ${platformId} profile URL. Please provide a valid profile URL.`
            });
        }

        // Validate URL format
        try {
            new URL(profileUrl);
        } catch (e) {
            console.error("Validation error: Invalid profile URL format", e);
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

        console.log("Generated verification code:", verificationCode);

        // Create or update verification record
        try {
            await createVerification(req.user.id, platformId, profileUrl, verificationCode);
            console.log("Verification record created successfully");
        } catch (dbError) {
            console.error("Database error while creating verification record:", dbError);
            return res.status(500).json({
                success: false,
                message: 'Error creating verification record',
                error: dbError.message
            });
        }

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

// @desc    Add a platform handle to a user's profile
// @route   POST /api/platforms/add
// @access  Private
router.post('/add', protect, async (req, res) => {
    try {
        const { platform, handle } = req.body;
        const supabase_id = req.user.id;

        if (!platform || !handle) {
            return res.status(400).json({
                success: false,
                message: "Platform and handle are required"
            });
        }

        // 1. Fetch the current profile
        const { data: profile, error: fetchError } = await supabaseAdmin
            .from("profiles")
            .select("platforms")
            .eq("supabase_id", supabase_id)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // pgrst116 = no rows found
            throw new Error(fetchError.message);
        }

        // 2. Add or update the platform handle
        const existingPlatforms = profile?.platforms || [];
        const platformIndex = existingPlatforms.findIndex(p => p.id === platform);

        if (platformIndex > -1) {
            // Update existing handle
            existingPlatforms[platformIndex].handle = handle;
        } else {
            // Add new platform
            existingPlatforms.push({ id: platform, handle });
        }

        // 3. Save the updated platforms array back to the profile
        const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({ platforms: existingPlatforms })
            .eq("supabase_id", supabase_id);

        if (updateError) {
            throw new Error(updateError.message);
        }

        // 4. If the platform is Codeforces, trigger the scraper
        if (platform === 'codeforces') {
            console.log(`Triggering Codeforces scrape for user ${supabase_id} with handle ${handle}`);
            
            // Create the profile URL from the handle
            const profileUrl = `https://codeforces.com/profile/${handle}`;
            const mockReq = { user: req.user, body: { profileUrl } };
            const mockRes = {
                status: (code) => mockRes,
                json: (data) => {
                    console.log(`Scraping for ${handle} completed`);
                }
            };
            
            // Call the scraper in the background
            scrapeCodeforcesProfile(mockReq, mockRes).catch(err => {
                console.error(`Background scrape for ${handle} failed:`, err.message);
            });

            res.status(202).json({ 
                success: true,
                message: `Accepted. Codeforces profile for ${handle} is being scraped.` 
            });

        } else {
            // For other platforms, just confirm the update
            res.status(200).json({
                success: true,
                message: `Platform ${platform} with handle ${handle} added successfully.`,
                platforms: existingPlatforms
            });
        }
    } catch (error) {
        console.error('Add platform error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding platform',
            error: error.message
        });
    }
});

export default router;
