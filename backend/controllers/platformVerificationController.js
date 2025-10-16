import puppeteer from 'puppeteer';

// Configuration for each platform's selectors and validation
const PLATFORM_CONFIG = {
    leetcode: {
        // LeetCode shows display name in the profile header
        nameSelector: ['.relative.flex.w-full.flex-col .text-label-1', '.text-title-large', '[data-community-title]'],
        urlPattern: /^https?:\/\/leetcode\.com\/(u\/)?[^\/]+\/?$/i,
        getUsernameFromUrl: (url) => url.match(/\/(?:u\/)?([^\/]+)\/?$/)?.[1],
        getProfileUrl: (username) => `https://leetcode.com/${username}`,
    },
    codeforces: {
        // Codeforces shows full name in the title section
        nameSelector: ['div.main-info > div.info > div > div.title', 'div.main-info > div.info > h1'],
        urlPattern: /^https?:\/\/(www\.)?codeforces\.com\/profile\/[^\/]+\/?$/i,
        getUsernameFromUrl: (url) => url.match(/\/profile\/([^\/]+)/)?.[1],
        getProfileUrl: (username) => `https://codeforces.com/profile/${username}`,
    },
    gfg: {
        // GeeksForGeeks displays name separately from username
        nameSelector: ['div.profile_name', 'div.header_user_profile_name', '.geek-name'],
        urlPattern: /^https?:\/\/(auth\.|www\.)?geeksforgeeks\.org\/user\/[^\/]+\/?$/i,
        getUsernameFromUrl: (url) => url.match(/\/user\/([^\/]+)/)?.[1],
        getProfileUrl: (username) => `https://auth.geeksforgeeks.org/user/${username}`,
    },
    hackerrank: {
        // HackerRank shows display name in the profile header
        nameSelector: ['h1.profile-heading', '.profile-container .name', 'div.profile-name'],
        urlPattern: /^https?:\/\/(www\.)?hackerrank\.com\/(profile\/)?[^\/]+\/?$/i,
        getUsernameFromUrl: (url) => {
            const parts = url.split('/').filter(Boolean);
            return parts.pop(); // works for both /username and /profile/username
        },
        getProfileUrl: (username) => `https://www.hackerrank.com/profile/${username}`,
    }
};

class PlatformVerificationController {
    async verifyProfile(req, res) {
        const { profileUrl, verificationCode, platformId } = req.body;

        // Input validation
        if (!profileUrl || !verificationCode || !platformId) {
            return res.status(400).json({ 
                message: 'Missing required fields: profileUrl, verificationCode, platformId.' 
            });
        }

        const config = PLATFORM_CONFIG[platformId];
        if (!config) {
            return res.status(400).json({ 
                message: `Platform '${platformId}' is not supported.` 
            });
        }

        // Validate URL format
        if (!config.urlPattern.test(profileUrl)) {
            return res.status(400).json({ 
                message: 'Invalid profile URL format.' 
            });
        }

        let browser = null;
        try {
            browser = await puppeteer.launch({
                headless: "new",
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--window-size=1920x1080'
                ],
            });

            const page = await browser.newPage();
            
            // Set viewport and user agent
            await page.setViewport({ width: 1920, height: 1080 });
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

            // Set default timeout
            page.setDefaultTimeout(30000);

            // Navigate to the profile
            await page.goto(profileUrl, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            // Try each selector until we find one that works
            let extractedName = null;
            let foundElement = null;

            for (const selector of config.nameSelector) {
                try {
                    await page.waitForSelector(selector, { timeout: 5000 });
                    foundElement = await page.$(selector);
                    
                    if (foundElement) {
                        // Get both textContent and innerHTML to handle different name formats
                        const textContent = await page.evaluate(el => el.textContent, foundElement);
                        const innerHTML = await page.evaluate(el => el.innerHTML, foundElement);
                        
                        // Clean up the extracted text
                        extractedName = textContent.trim()
                            .replace(/\s+/g, ' ') // Normalize whitespace
                            .replace(/['"]/g, '') // Remove quotes that might be part of the HTML
                            .trim();

                        console.log(`Found potential name with selector ${selector}:`, extractedName);
                        
                        // If we found a non-empty name, break the loop
                        if (extractedName && extractedName !== '' && !extractedName.includes('undefined')) {
                            break;
                        }
                    }
                } catch (e) {
                    console.log(`Selector ${selector} not found or error:`, e.message);
                }
            }

            if (!extractedName) {
                throw new Error('Could not find display name on the profile page');
            }

            console.log('Found display name:', extractedName);
            console.log('Expected verification code:', verificationCode);

            if (extractedName === verificationCode) {
                return res.status(200).json({ 
                    status: 'verified',
                    message: 'Profile verified successfully!' 
                });
            } else {
                return res.status(400).json({ 
                    status: 'failed',
                    message: 'Verification failed. The profile name does not match the verification code.' 
                });
            }

        } catch (error) {
            console.error('Verification error:', error);
            
            let status = 500;
            let message = 'An unexpected error occurred during verification.';

            if (error.name === 'TimeoutError') {
                status = 400;
                message = 'Could not load the profile page. Please ensure the URL is correct and the profile is public.';
            } else if (error.message.includes('Could not find username')) {
                status = 400;
                message = 'Could not find the username on the profile page. Please ensure the profile URL is correct.';
            }

            return res.status(status).json({ message });

        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    async initVerification(req, res) {
        try {
            console.log('Received verification request:', {
                body: req.body,
                headers: req.headers
            });
            
            if (!req.body) {
                console.error('No request body received');
                return res.status(400).json({
                    status: 'error',
                    message: 'No request body received'
                });
            }
            
            const { platformId, profileUrl, username, verificationCode } = req.body;

            // Detailed input validation
            const missingFields = [];
            if (!platformId) missingFields.push('platformId');
            if (!profileUrl) missingFields.push('profileUrl');
            if (!username) missingFields.push('username');
            if (!verificationCode) missingFields.push('verificationCode');

            if (missingFields.length > 0) {
                console.log('Missing fields:', missingFields);
                return res.status(400).json({ 
                    message: `Missing required fields: ${missingFields.join(', ')}`
                });
            }

            // Platform validation
            const config = PLATFORM_CONFIG[platformId];
            if (!config) {
                console.log('Unsupported platform:', platformId);
                return res.status(400).json({ 
                    message: `Platform '${platformId}' is not supported. Supported platforms: ${Object.keys(PLATFORM_CONFIG).join(', ')}`
                });
            }

            // URL validation with detailed error
            let isValidUrl = false;
            let urlObj;
            
            try {
                // First, ensure the URL starts with http:// or https://
                if (!profileUrl.match(/^https?:\/\//)) {
                    profileUrl = 'https://' + profileUrl;
                }
                
                urlObj = new URL(profileUrl);
                isValidUrl = config.urlPattern.test(profileUrl);
                
                console.log('URL validation:', {
                    originalUrl: req.body.profileUrl,
                    processedUrl: profileUrl,
                    isValid: isValidUrl,
                    patternTest: config.urlPattern.source
                });
                
            } catch (urlError) {
                console.error('URL validation error:', {
                    url: profileUrl,
                    error: urlError.message,
                    stack: urlError.stack
                });
                
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid URL format. Please provide a valid profile URL.',
                    details: {
                        provided: profileUrl,
                        expected: config.getProfileUrl('example'),
                        error: urlError.message
                    }
                });
            }

            if (!isValidUrl) {
                return res.status(400).json({ 
                    message: `Invalid profile URL format for ${platformId}. Expected format: ${config.getProfileUrl('username')}` 
                });
            }

            // Username extraction and validation
            const extractedUsername = config.getUsernameFromUrl(profileUrl);
            console.log('Username validation:', {
                provided: username,
                extracted: extractedUsername,
                match: extractedUsername === username
            });

            if (!extractedUsername) {
                return res.status(400).json({ 
                    message: `Could not extract username from the provided URL. Please check the URL format.`
                });
            }

            if (extractedUsername !== username) {
                return res.status(400).json({ 
                    message: `Username mismatch. URL contains "${extractedUsername}" but "${username}" was provided.`
                });
            }

            // Validation successful, initialize verification
            console.log('Verification initialized successfully for:', {
                platform: platformId,
                username,
                verificationCode
            });

            return res.status(200).json({
                status: 'success',
                message: 'Verification initialized successfully.',
                data: {
                    platform: platformId,
                    username,
                    verificationCode,
                    profileUrl
                },
                nextStep: 'Update your profile display name to the verification code and then proceed with verification.'
            });

        } catch (error) {
            console.error('Initialization error:', {
                message: error.message,
                stack: error.stack,
                body: req.body
            });

            // Determine the appropriate status code
            let statusCode = 500;
            if (error instanceof TypeError || error instanceof URIError) {
                statusCode = 400;
            }

            return res.status(statusCode).json({
                status: 'error',
                message: error.message || 'Failed to initialize verification',
                details: {
                    type: error.name,
                    code: statusCode,
                    timestamp: new Date().toISOString(),
                    requestData: {
                        platformId,
                        profileUrl: profileUrl || null,
                        username: username || null
                    }
                }
            });
        }
    }
}

export default new PlatformVerificationController();
