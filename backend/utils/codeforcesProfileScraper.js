import puppeteer from 'puppeteer';
import axios from 'axios';

/**
 * Codeforces Profile Scraper
 * Scrapes user profile data, contest history, and submission statistics from Codeforces
 */
class CodeforcesProfileScraper {
    constructor() {
        this.baseUrl = 'https://codeforces.com';
        this.apiUrl = 'https://codeforces.com/api';
        this.browser = null;
    }

    /**
     * Validates if the given URL is a valid Codeforces profile URL
     * @param {string} url - The profile URL to validate
     * @returns {boolean} - True if valid, false otherwise
     */
    static isValidProfileUrl(url) {
        const regex = /^https:\/\/codeforces\.com\/profile\/[a-zA-Z0-9_.-]+$/;
        return regex.test(url);
    }

    /**
     * Extracts username from Codeforces profile URL
     * @param {string} url - The profile URL
     * @returns {string} - The username
     */
    static extractUsername(url) {
        const match = url.match(/\/profile\/([a-zA-Z0-9_.-]+)$/);
        return match ? match[1] : null;
    }

    /**
     * Initialize browser for scraping
     */
    async initBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
    }

    /**
     * Close browser
     */
    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    /**
     * Scrape user profile information using Codeforces API and web scraping
     * @param {string} profileUrl - The Codeforces profile URL
     * @returns {Object} - Complete profile data
     */
    async scrapeProfile(profileUrl) {
        const username = CodeforcesProfileScraper.extractUsername(profileUrl);
        if (!username) {
            throw new Error('Invalid Codeforces profile URL');
        }

        console.log(`Starting scrape for Codeforces user: ${username}`);

        try {
            // Get basic user info from API
            const userInfo = await this.getUserInfo(username);

            // Get user rating history
            const ratingHistory = await this.getUserRating(username);

            // Get user submissions
            const submissions = await this.getUserSubmissions(username);

            // Get contest participation
            const contests = await this.getUserContests(username);

            // Scrape additional profile data from web page
            const webData = await this.scrapeWebProfile(profileUrl);

            // Process and aggregate the data
            const profileData = this.processProfileData({
                userInfo,
                ratingHistory,
                submissions,
                contests,
                webData,
                username
            });

            console.log(`Successfully scraped profile for ${username}`);
            return profileData;

        } catch (error) {
            console.error(`Error scraping profile for ${username}:`, error.message);
            throw error;
        }
    }

    /**
     * Get user information from Codeforces API
     */
    async getUserInfo(username) {
        try {
            const response = await axios.get(`${this.apiUrl}/user.info?handles=${username}`);
            if (response.data.status === 'OK' && response.data.result.length > 0) {
                return response.data.result[0];
            }
            throw new Error('User not found');
        } catch (error) {
            console.warn(`API user.info failed for ${username}:`, error.message);
            return null;
        }
    }

    /**
     * Get user rating history from Codeforces API
     */
    async getUserRating(username) {
        try {
            const response = await axios.get(`${this.apiUrl}/user.rating?handle=${username}`);
            if (response.data.status === 'OK') {
                return response.data.result;
            }
            return [];
        } catch (error) {
            console.warn(`API user.rating failed for ${username}:`, error.message);
            return [];
        }
    }

    /**
     * Get user submissions from Codeforces API
     */
    async getUserSubmissions(username) {
        try {
            // Get recent submissions (last 1000)
            const response = await axios.get(`${this.apiUrl}/user.status?handle=${username}&from=1&count=1000`);
            if (response.data.status === 'OK') {
                return response.data.result;
            }
            return [];
        } catch (error) {
            console.warn(`API user.status failed for ${username}:`, error.message);
            return [];
        }
    }

    /**
     * Get user contest participation from rating history
     */
    async getUserContests(username) {
        try {
            const ratingHistory = await this.getUserRating(username);
            return ratingHistory.map(contest => ({
                contestId: contest.contestId,
                contestName: contest.contestName,
                handle: contest.handle,
                rank: contest.rank,
                ratingUpdateTimeSeconds: contest.ratingUpdateTimeSeconds,
                oldRating: contest.oldRating,
                newRating: contest.newRating
            }));
        } catch (error) {
            console.warn(`Error getting contests for ${username}:`, error.message);
            return [];
        }
    }

    /**
     * Scrape additional data from the profile web page
     */
    async scrapeWebProfile(profileUrl) {
        await this.initBrowser();

        try {
            const page = await this.browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

            await page.goto(profileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

            const webData = await page.evaluate(() => {
                const data = {};

                // Try to get additional profile information
                try {
                    // Get contribution count
                    const contributionElement = document.querySelector('.info ul li');
                    if (contributionElement) {
                        const contributionText = contributionElement.textContent;
                        const contributionMatch = contributionText.match(/Contribution:\s*([+-]?\d+)/);
                        if (contributionMatch) {
                            data.contribution = parseInt(contributionMatch[1]);
                        }
                    }

                    // Get friend count
                    const friendsElement = document.querySelector('a[href*="/friends/"]');
                    if (friendsElement) {
                        const friendsText = friendsElement.textContent;
                        const friendsMatch = friendsText.match(/(\d+)/);
                        if (friendsMatch) {
                            data.friendsCount = parseInt(friendsMatch[1]);
                        }
                    }

                    // Get last visit information
                    const lastVisitElement = document.querySelector('.info ul li:last-child');
                    if (lastVisitElement && lastVisitElement.textContent.includes('ago')) {
                        data.lastVisit = lastVisitElement.textContent.trim();
                    }

                } catch (err) {
                    console.warn('Error extracting web data:', err);
                }

                return data;
            });

            await page.close();
            return webData;

        } catch (error) {
            console.warn(`Web scraping failed for ${profileUrl}:`, error.message);
            return {};
        }
    }

    /**
     * Process and aggregate all collected data
     */
    processProfileData({ userInfo, ratingHistory, submissions, contests, webData, username }) {
        // Calculate submission statistics
        const submissionStats = this.calculateSubmissionStats(submissions);

        // Calculate language statistics
        const languageStats = this.calculateLanguageStats(submissions);

        // Calculate tag/topic statistics
        const tagStats = this.calculateTagStats(submissions);

        // Get current and max ratings
        const currentRating = userInfo?.rating || 0;
        const maxRating = userInfo?.maxRating || 0;
        const rank = userInfo?.rank || 'unrated';
        const maxRank = userInfo?.maxRank || 'unrated';

        return {
            // Basic info
            username: username,
            displayName: userInfo?.firstName && userInfo?.lastName ? 
                `${userInfo.firstName} ${userInfo.lastName}` : username,

            // Rating info
            rating: currentRating,
            maxRating: maxRating,
            rank: rank,
            maxRank: maxRank,

            // Additional info from API
            contribution: userInfo?.contribution || webData.contribution || 0,
            friendsCount: webData.friendsCount || 0,
            lastVisit: webData.lastVisit || '',

            // Calculated statistics
            totalSolved: submissionStats.accepted,
            totalSubmissions: submissionStats.total,
            submissionStats: submissionStats,
            languageStats: languageStats,
            tagStats: tagStats,

            // Contest data
            contestHistory: contests,
            totalContests: contests.length,

            // Activity data for heatmap
            activityData: this.generateActivityData(submissions),

            // Raw data for future processing
            ratingHistory: ratingHistory,
            recentSubmissions: submissions.slice(0, 100), // Keep last 100 submissions

            // Metadata
            lastScrapedAt: new Date().toISOString(),
            profileUrl: `https://codeforces.com/profile/${username}`
        };
    }

    /**
     * Calculate submission statistics by verdict
     */
    calculateSubmissionStats(submissions) {
        const stats = {
            total: submissions.length,
            accepted: 0,
            wrongAnswer: 0,
            timeLimitExceeded: 0,
            memoryLimitExceeded: 0,
            compilationError: 0,
            runtimeError: 0,
            other: 0
        };

        // Track unique solved problems
        const solvedProblems = new Set();

        submissions.forEach(submission => {
            const verdict = submission.verdict;

            if (verdict === 'OK') {
                stats.accepted++;
                solvedProblems.add(`${submission.problem.contestId}-${submission.problem.index}`);
            } else if (verdict === 'WRONG_ANSWER') {
                stats.wrongAnswer++;
            } else if (verdict === 'TIME_LIMIT_EXCEEDED') {
                stats.timeLimitExceeded++;
            } else if (verdict === 'MEMORY_LIMIT_EXCEEDED') {
                stats.memoryLimitExceeded++;
            } else if (verdict === 'COMPILATION_ERROR') {
                stats.compilationError++;
            } else if (verdict === 'RUNTIME_ERROR') {
                stats.runtimeError++;
            } else {
                stats.other++;
            }
        });

        stats.uniqueSolved = solvedProblems.size;
        return stats;
    }

    /**
     * Calculate programming language usage statistics
     */
    calculateLanguageStats(submissions) {
        const languageCount = {};

        submissions.forEach(submission => {
            if (submission.verdict === 'OK' && submission.programmingLanguage) {
                const lang = submission.programmingLanguage;
                languageCount[lang] = (languageCount[lang] || 0) + 1;
            }
        });

        return languageCount;
    }

    /**
     * Calculate problem tag/topic statistics
     */
    calculateTagStats(submissions) {
        const tagCount = {};

        submissions.forEach(submission => {
            if (submission.verdict === 'OK' && submission.problem && submission.problem.tags) {
                submission.problem.tags.forEach(tag => {
                    tagCount[tag] = (tagCount[tag] || 0) + 1;
                });
            }
        });

        return tagCount;
    }

    /**
     * Generate activity data for heatmap from submissions
     * @param {Array} submissions - Array of submission objects
     * @returns {Array} Activity data in format [{date: "2024-01-15", count: 5}, ...]
     */
    generateActivityData(submissions) {
        const activityMap = new Map();

        submissions.forEach(submission => {
            if (submission.creationTimeSeconds) {
                // Convert timestamp to date string (YYYY-MM-DD)
                const date = new Date(submission.creationTimeSeconds * 1000);
                const dateStr = date.toISOString().split('T')[0];

                // Count submissions per day
                activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
            }
        });

        // Convert map to array format expected by heatmap component
        const activityData = Array.from(activityMap.entries()).map(([date, count]) => ({
            date,
            count
        }));

        // Sort by date (oldest first)
        activityData.sort((a, b) => new Date(a.date) - new Date(b.date));

        return activityData;
    }
}

export default CodeforcesProfileScraper;
