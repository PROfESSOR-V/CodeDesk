import { Builder, By, until, Key } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import { supabase } from "../config/supabaseClient.js";
import { v4 as uuidv4 } from "uuid";

class CodeChefScraper {
    constructor() {
        this.driver = null;
        this.profileId = null;
        this.isInitialized = false;
        this.retryConfig = {
            maxAttempts: 3,
            backoffFactor: 1.5,
            initialDelay: 2000,
            maxDelay: 8000,
        };
    }

    async initializeBrowser() {
        try {
            if (this.isInitialized && this.driver) {
                await this.cleanup();
            }

            const options = new chrome.Options();

            // Windows-compatible Chrome options to prevent crashes
            options.addArguments([
                // Essential stability (Windows compatible)
                "--no-sandbox",
                "--disable-dev-shm-usage",

                // GPU and graphics handling for Windows
                "--disable-gpu",
                "--disable-gpu-sandbox",
                "--disable-software-rasterizer",
                "--disable-3d-apis",
                "--disable-accelerated-2d-canvas",
                "--disable-accelerated-jpeg-decoding",
                "--disable-accelerated-video-decode",
                "--disable-background-media-processing",

                // Headless mode for stability
                "--headless=new",

                // Process management (removed single-process for Windows compatibility)
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding",

                // Memory management
                "--memory-pressure-off",
                "--disable-dev-shm-usage",

                // Disable resource-heavy features
                "--disable-extensions",
                "--disable-plugins",
                "--disable-images",
                "--disable-web-security",
                "--disable-features=VizDisplayCompositor,TranslateUI,Vulkan",

                // Network optimizations (Windows friendly)
                "--disable-background-networking",
                "--disable-default-apps",
                "--disable-sync",
                "--disable-translate",

                // Conservative window settings
                "--window-size=1366,768",
                "--start-maximized",

                // User agent
                "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",

                // Reduce logging
                "--log-level=3",
                "--silent",
                "--disable-logging",
            ]);

            // Set page load strategy to 'normal' for better stability
            options.setPageLoadStrategy("normal");

            // Remove Chrome binary path detection to avoid require() issues
            // Let ChromeDriver auto-detect Chrome installation

            // Remove additional prefs that may cause Windows conflicts
            // Keep minimal feature disabling

            // Build the driver with error handling
            let driver;
            try {
                driver = await new Builder()
                    .forBrowser("chrome")
                    .setChromeOptions(options)
                    .build();
            } catch (buildError) {
                console.error("Chrome build failed:", buildError.message);

                // Fallback: Try with ultra-minimal options for Windows
                console.log(
                    "Standard Chrome build failed, trying minimal Windows-compatible options..."
                );
                const minimalOptions = new chrome.Options();
                minimalOptions.addArguments([
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--headless=new",
                    "--disable-gpu",
                    "--disable-web-security",
                    "--window-size=1366,768",
                ]);
                minimalOptions.setPageLoadStrategy("normal");

                driver = await new Builder()
                    .forBrowser("chrome")
                    .setChromeOptions(minimalOptions)
                    .build();
            }

            this.driver = driver;

            // Set conservative timeouts to prevent hanging
            await this.driver.manage().setTimeouts({
                implicit: 10000, // Wait for elements
                pageLoad: 45000, // Page load timeout
                script: 15000, // Script execution timeout
            });

            // Test browser functionality with simple operations
            try {
                await this.driver.executeScript("return document.readyState");
                await this.driver.executeScript("return navigator.userAgent");
            } catch (testError) {
                throw new Error(
                    `Browser functionality test failed: ${testError.message}`
                );
            }

            this.isInitialized = true;
            console.log(
                "Browser initialized successfully with crash prevention measures"
            );
        } catch (error) {
            console.error("Browser initialization failed:", error.message);
            this.isInitialized = false;

            // Cleanup on failure
            if (this.driver) {
                try {
                    await this.driver.quit();
                } catch (cleanupError) {
                    console.error(
                        "Cleanup after init failure:",
                        cleanupError.message
                    );
                }
                this.driver = null;
            }

            throw new Error(`Browser initialization failed: ${error.message}`);
        }
    }

    // Enhanced page loading with crash recovery
    async loadPageSimple(url) {
        console.log(`Loading page: ${url}`);

        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                // Check if driver is still alive
                try {
                    await this.driver.executeScript("return 'alive'");
                } catch (aliveError) {
                    console.log("Driver not responsive, reinitializing...");
                    await this.initializeBrowser();
                }

                // Navigate to page with timeout handling
                const navigationPromise = this.driver.get(url);
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(
                        () => reject(new Error("Navigation timeout")),
                        30000
                    );
                });

                await Promise.race([navigationPromise, timeoutPromise]);

                // Wait for basic page structure
                await this.driver.sleep(3000);

                // Verify we reached the correct domain
                const currentUrl = await this.driver.getCurrentUrl();
                if (!currentUrl.includes("codechef.com")) {
                    throw new Error("Failed to reach CodeChef domain");
                }

                // Check for page elements or error conditions
                await this.driver.wait(
                    until.elementLocated(By.css("body")),
                    15000
                );

                // Look for either profile content or error indicators
                try {
                    await Promise.race([
                        this.driver.wait(
                            until.elementLocated(
                                By.css(".user-details-container")
                            ),
                            10000
                        ),
                        this.driver.wait(
                            until.elementLocated(By.css(".error, .not-found")),
                            10000
                        ),
                    ]);
                } catch (e) {
                    console.log(
                        "Standard selectors not found, checking page state..."
                    );
                }

                // Check for error conditions
                const errorElements = await this.driver.findElements(
                    By.css('.error, .not-found, [class*="404"]')
                );
                if (errorElements.length > 0) {
                    throw new Error("Profile not found or error page detected");
                }

                console.log("Page loaded successfully");
                return true;
            } catch (error) {
                attempts++;
                console.error(
                    `Page load attempt ${attempts} failed: ${error.message}`
                );

                if (attempts >= maxAttempts) {
                    throw error;
                }

                // Wait before retry and reinitialize browser if needed
                if (
                    error.message.includes("crash") ||
                    error.message.includes("not reachable")
                ) {
                    console.log("Browser crash detected, reinitializing...");
                    await this.cleanup();
                    await new Promise((resolve) => setTimeout(resolve, 5000));
                    await this.initializeBrowser();
                } else {
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                }
            }
        }
    }

    // Enhanced retry wrapper with browser health checks
    async withRetry(operation, operationName) {
        let attempt = 0;
        let lastError;

        while (attempt < this.retryConfig.maxAttempts) {
            try {
                // Health check: ensure browser is responsive
                if (!this.isInitialized || !this.driver) {
                    await this.initializeBrowser();
                } else {
                    // Quick health check
                    try {
                        await this.driver.executeScript("return 'healthy'");
                    } catch (healthError) {
                        console.log(
                            "Browser health check failed, reinitializing..."
                        );
                        await this.initializeBrowser();
                    }
                }

                const result = await operation();
                if (attempt > 0) {
                    console.log(
                        `✅ ${operationName} succeeded on attempt ${
                            attempt + 1
                        }`
                    );
                }
                return result;
            } catch (error) {
                lastError = error;
                attempt++;

                console.log(
                    `⚠️ ${operationName} failed (attempt ${attempt}/${this.retryConfig.maxAttempts}): ${error.message}`
                );

                // Check if error indicates browser crash
                const isBrowserCrash =
                    error.message.includes("crash") ||
                    error.message.includes("not reachable") ||
                    error.message.includes("disconnected") ||
                    error.message.includes("Session");

                if (isBrowserCrash) {
                    console.log(
                        "Browser crash detected, recreating browser..."
                    );
                    await this.cleanup();
                    this.isInitialized = false;
                    // Extra delay for crash recovery
                    await new Promise((resolve) => setTimeout(resolve, 5000));
                }

                if (attempt < this.retryConfig.maxAttempts) {
                    const delay =
                        this.retryConfig.initialDelay *
                        Math.pow(this.retryConfig.backoffFactor, attempt - 1);
                    console.log(`🔄 Waiting ${delay}ms before retry...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    // Network connectivity check (unchanged)
    async checkNetworkConnectivity() {
        try {
            const response = await fetch("https://www.codechef.com", {
                method: "HEAD",
                timeout: 10000,
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    // Enhanced scraping method with better error handling
    async scrapeProfile(username, user_id) {
        const startTime = Date.now();

        try {
            this.checkNetworkConnectivity();
            console.log(`Starting enhanced scrape for user: ${username}`);

            // Initialize browser if needed
            await this.initializeBrowser();

            // Load profile page safely
            const profileUrl = `https://www.codechef.com/users/${username}`;
            await this.loadPageSimple(profileUrl);

            // Extract profile data with retry
            const profileData = await this.withRetry(
                async () => await this.extractProfileData(username),
                "Profile data extraction"
            );

            // Store profile data
            await this.withRetry(
                async () => await this.storeProfileData(profileData,user_id),
                "Profile data storage"
            );

            if (!this.profileId) {
                throw new Error("Failed to generate or retrieve profile ID");
            }

            // Continue with other extractions...
            const [ratingHistory, contests, heatmapData, badges, activities] =
                await Promise.all([
                    this.withRetry(
                        async () => await this.extractRatingHistory(),
                        "Rating history extraction"
                    ),
                    this.withRetry(
                        async () => await this.extractContestHistory(),
                        "Contest history extraction"
                    ),
                    this.withRetry(
                        async () => await this.extractHeatmapData(),
                        "Heatmap data extraction"
                    ),
                    this.withRetry(
                        async () => await this.extractBadges(),
                        "Badges extraction"
                    ),
                    this.withRetry(
                        async () =>
                            await this.extractRecentActivity(this.profileId),
                        "Recent Activity extraction"
                    ),
                ]);

            // Store all data
            if (this.profileId) {
                await Promise.all([
                    this.withRetry(
                        async () =>
                            await this.storeRatingHistory(ratingHistory),
                        "Rating history storage"
                    ),
                    this.withRetry(
                        async () => await this.storeContests(contests),
                        "Contest data storage"
                    ),
                    this.withRetry(
                        async () => await this.storeHeatmapData(heatmapData),
                        "Heatmap data storage"
                    ),
                    this.withRetry(
                        async () => await this.storeBadges(badges),
                        "Badges storage"
                    ),
                    this.withRetry(
                        async () =>
                            await this.storeTotalProblems(
                                activities,
                                this.profileId
                            ),
                        "Problems storage"
                    ),
                    this.withRetry(
                        async () =>
                            await this.updateProfileData(
                                profileData,
                                contests,
                                activities,
                                badges,
                                heatmapData
                            ),
                        "Update Profile Data storage"
                    ),
                ]);
            }

            const endTime = Date.now();
            const executionTime = endTime - startTime;

            console.log(
                `Scraping completed successfully in ${executionTime}ms`
            );
            console.log("Network Stats:", this.networkStats);

            return { success: true, profileId: this.profileId };
        } catch (error) {
            console.error("Final scraping error:", error);
            throw error;
        } finally {
            // Don't cleanup browser immediately, keep it for subsequent requests
            if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
                await this.cleanup();
            }
        }
    }

    // Enhanced retry mechanism with circuit breaker pattern
    // async withRetry(operation, operationName) {
    //     let lastError;
    //     let delay = this.retryConfig.initialDelay;

    //     for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
    //         try {
    //             const result = await operation();
    //             if (attempt > 1) {
    //                 console.log(`✅ ${operationName} succeeded on attempt ${attempt}`);
    //             }
    //             return result;
    //         } catch (error) {
    //             lastError = error;

    //             // Check if error is retryable
    //             if (!this.isRetryableError(error)) {
    //                 throw error;
    //             }

    //             if (attempt < this.retryConfig.maxAttempts) {
    //                 console.log(`⚠️ ${operationName} failed (attempt ${attempt}/${this.retryConfig.maxAttempts}): ${error.message}`);

    //                 // Add jitter to delay
    //                 const jitteredDelay = delay + (Math.random() * this.retryConfig.jitterRange);
    //                 console.log(`🔄 Retrying in ${Math.round(jitteredDelay)}ms...`);

    //                 await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    //                 delay = Math.min(delay * this.retryConfig.backoffFactor, this.retryConfig.maxDelay);
    //             }
    //         }
    //     }

    //     throw lastError;
    // }

    // Determine if an error should trigger a retry
    isRetryableError(error) {
        const retryableErrors = [
            "timeout",
            "network",
            "connection",
            "ECONNRESET",
            "ENOTFOUND",
            "ETIMEDOUT",
            "stale element",
            "element not found",
            "no such element",
        ];

        const errorMessage = error.message.toLowerCase();
        return retryableErrors.some((retryable) =>
            errorMessage.includes(retryable)
        );
    }

    async isProfileNotFound() {
        try {
            const notFoundElements = await this.driver.findElements(
                By.css('.error, .not-found, [class*="404"]')
            );
            return notFoundElements.length > 0;
        } catch {
            return false;
        }
    }

    async extractProfileData(username) {
        console.log("Extracting basic profile data...");

        try {
            const profileUrl = `https://www.codechef.com/users/${username}`;

            // Navigate with retry
            let loadAttempts = 0;
            while (loadAttempts < 3) {
                try {
                    await this.driver.get(profileUrl);
                    await this.driver.sleep(2000); // Wait for initial load
                    break;
                } catch (error) {
                    loadAttempts++;
                    if (loadAttempts === 3) throw error;
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                }
            }

            // Wait for page load with multiple conditions
            await this.driver.wait(
                async () => {
                    try {
                        const readyState = await this.driver.executeScript(
                            "return document.readyState"
                        );
                        const userDetailsExists =
                            await this.driver.findElements(
                                By.css(".user-details-container")
                            );
                        const errorExists = await this.isProfileNotFound();

                        if (errorExists) {
                            throw new Error(
                                `Profile not found for username: ${username}`
                            );
                        }

                        // Check if critical elements are present
                        const criticalElements = await Promise.all([
                            this.driver.findElements(By.css(".h2-style")),
                            this.driver.findElements(By.css(".rating-number")),
                            this.driver.findElements(By.css(".rating-star")),
                        ]);

                        const allElementsPresent = criticalElements.every(
                            (elements) => elements.length > 0
                        );

                        return (
                            readyState === "complete" &&
                            userDetailsExists.length > 0 &&
                            allElementsPresent
                        );
                    } catch (err) {
                        return false;
                    }
                },
                30000,
                "Page failed to load completely"
            ); // Increased timeout

            // Force wait for dynamic content
            await this.driver.sleep(3000);

            // Rest of your existing extractProfileData code...
            const profileData = {
                username: username,
                profile_name: "",
                rating: 0,
                star_level: 0,
                division: "",
                global_rank: null,
                country_rank: null,
                country: "",
                contests_participated: 0,
                total_problems_solved: 0,
                institute: "",
                total_problems: 0,
            };

            // Use explicit waits for each element
            try {
                const nameElement = await this.driver.wait(
                    until.elementLocated(By.css(".h2-style")),
                    10000
                );
                profileData.profile_name =
                    (await nameElement.getText()) || username;
            } catch (e) {
                console.log("Could not find name element, using username");
                profileData.profile_name = username;
            }

            try {
                const ratingElement = await this.driver.wait(
                    until.elementLocated(By.css(".rating-number")),
                    10000
                );
                const ratingText = await ratingElement.getText();
                profileData.rating =
                    parseInt(ratingText.replace(/[^\d]/g, "")) || 0;
            } catch (e) {
                console.log("Could not find rating element");
            }

            try {
                const starElement = await this.driver.findElement(
                    By.css(".rating")
                );
                profileData.star_level = Number(
                    (await starElement.getText()).replace("★", "").trim()
                );
            } catch (e) {
                console.log("Could not find star elements");
            }

            try {
                const divisionElement = await this.driver.findElement(
                    By.css(".rating-header div:nth-child(2)")
                );
                const divisionText = await divisionElement.getText();
                profileData.division = divisionText.includes("Div")
                    ? divisionText.slice(1, divisionText.length - 1)
                    : "";
            } catch (e) {
                console.log("Could not find division element");
            }

            // Extract ranks if available
            try {
                const rankElements = await this.driver.findElements(
                    By.css(".rating-ranks")
                );
                for (const rankEl of rankElements) {
                    const rankText = await rankEl.getText();
                    if (rankText.includes("Global")) {
                        const globalMatch = rankText.match(/(\d+)/);
                        profileData.global_rank = globalMatch
                            ? parseInt(globalMatch[1])
                            : null;
                    }
                    if (rankText.includes("Country")) {
                        const countryMatch = rankText.match(/(\d+)/);
                        profileData.country_rank = countryMatch
                            ? parseInt(countryMatch[1])
                            : null;
                    }
                }
            } catch (e) {
                console.log("Could not find rank elements");
            }

            // Extract country
            try {
                const countryElement = await this.driver.findElement(
                    By.css(".user-country-name")
                );
                profileData.country = await countryElement.getText();
            } catch (e) {
                console.log("Could not find country element");
            }
            // Extract institute
            try {
                const instituteElement = await this.driver.findElement(
                    By.css(".user-details .side-nav li:nth-child(4)")
                );
                profileData.institute = (await instituteElement.getText())
                    .replace("Institution:", "")
                    .trim();
            } catch (error) {
                console.log("Could not find institute element");
            }

            return profileData;
        } catch (error) {
            console.error(
                `Error extracting profile data for ${username}:`,
                error
            );
            throw new Error(`Profile data extraction failed: ${error.message}`);
        }
    }

    // Add new helper method for checking page state
    async isPageLoaded() {
        try {
            const readyState = await this.driver.executeScript(
                "return document.readyState"
            );
            const userDetailsExist = await this.driver.findElements(
                By.css(".user-details-container")
            );
            return readyState === "complete" && userDetailsExist.length > 0;
        } catch {
            return false;
        }
    }

    async extractRatingHistory() {
        console.log("Extracting rating history...");
        const ratingHistory = [];

        try {
            // Check if rating graph data exists
            const scriptElements = await this.driver.findElements(
                By.css("script")
            );

            for (const script of scriptElements) {
                const scriptContent = await script.getAttribute("innerHTML");
                if (scriptContent && scriptContent.includes("all_rating")) {
                    // Extract rating data from JavaScript
                    const ratingMatch = scriptContent.match(
                        /var all_rating = (\[.*?\]);/s
                    );
                    if (ratingMatch) {
                        const ratingData = JSON.parse(ratingMatch[1]);

                        for (const contest of ratingData) {
                            ratingHistory.push({
                                contest_code: contest.code,
                                contest_name: contest.name,
                                contest_date: new Date(contest.end_date),
                                new_rating: parseInt(contest.rating),
                                global_rank: parseInt(contest.rank),
                                rating_change: this.calculateRatingChange(
                                    ratingData,
                                    contest
                                ),
                            });
                        }
                    }
                    break;
                }
            }

            // Try clicking rating graph buttons to get old rating system data
            try {
                const oldRatingButton = await this.driver.findElement(
                    By.id("graph-button-all-old")
                );
                await oldRatingButton.click();
                await this.driver.sleep(2000);
                // Extract old rating system data if available
            } catch (error) {
                console.log("Old rating system data not available");
            }
        } catch (error) {
            console.error("Error extracting rating history:", error);
        }

        return ratingHistory;
    }

    async extractContestHistory() {
        console.log("Extracting contest history...");
        const contests = [];

        try {
            // Find all contest sections
            const contestSections = await this.driver.findElements(
                By.css(".content h5")
            );

            for (const section of contestSections) {
                const contestName = await section.getText();

                // Get problems for this contest
                const problemsContainer = section.findElement(
                    By.xpath("./following-sibling::p")
                );
                const problemsText = await problemsContainer.getText();
                const problems = problemsText
                    .split(", ")
                    .map((p) => p.trim())
                    .filter((p) => p);

                contests.push({
                    contest_name: contestName,
                    problems_solved: problems.length,
                    contest_date: this.parseContestDate(contestName),
                    difficulty: this.parseContestDifficulty(contestName),
                });
            }
        } catch (error) {
            console.error("Error extracting contest history:", error);
        }

        return contests;
    }

    async extractHeatmapData() {
        console.log("Extracting heatmap data...");
        const heatmapData = [];

        try {
            // Try different period selectors
            const periods = ["current", "2025-2", "2025-1", "2024-2", "2024-1"];

            for (const period of periods) {
                try {
                    const selector = await this.driver.findElement(
                        By.id("heatmap-period-selector")
                    );
                    await selector.sendKeys(Key.CONTROL + "a");
                    await selector.sendKeys(period);
                    await selector.sendKeys(Key.ENTER);
                    await this.driver.sleep(2000);

                    // Extract heatmap rectangles
                    const heatmapRects = await this.driver.findElements(
                        By.css("#js-heatmap rect.day[data-date][data-count]")
                    );

                    for (const rect of heatmapRects) {
                        const date = await rect.getAttribute("data-date");
                        const count = await rect.getAttribute("data-count");
                        const category = await rect.getAttribute("category");

                        if (date && count) {
                            heatmapData.push({
                                date: new Date(date),
                                count: parseInt(count),
                                level: parseInt(category) || 0,
                            });
                        }
                    }
                } catch (error) {
                    console.log(`Could not extract data for period ${period}`);
                }
            }
        } catch (error) {
            console.error("Error extracting heatmap data:", error);
        }

        return heatmapData;
    }

    async extractBadges() {
        console.log("Extracting badges...");
        const badges = [];

        try {
            const badgeElements = await this.driver.findElements(
                By.css(".badge")
            );

            for (const badge of badgeElements) {
                const titleElement = await badge.findElement(
                    By.css(".badge__title")
                );
                const descElement = await badge.findElement(
                    By.css(".badge__description")
                );

                const title = await titleElement.getText();
                const description = await descElement.getText();

                // Extract badge value from description
                const valueMatch = description.match(/(\d+)/);
                const value = valueMatch ? valueMatch[1] : null;

                badges.push({
                    badge_name: title,
                    badge_value: value,
                });
            }
        } catch (error) {
            console.error("Error extracting badges:", error);
        }

        return badges;
    }

    async extractRecentActivity(profileId) {
        console.log("Extracting recent activity...");
        const activities = [];

        try {
            // Wait for the activities table to load completely
            await this.waitForElement(".dataTable tbody tr", 9000);

            let hasNextPage = true;
            let pageCount = 0;
            let consecutiveEmptyPages = 0;

            while (hasNextPage && pageCount <= 20) {
                if (consecutiveEmptyPages) continue; // Skip if empty pages
                console.log(`Processing activities page ${pageCount + 1}...`);

                // Wait for page to be fully loaded
                await this.driver.wait(async () => {
                    const loadingElements = await this.driver.findElements(
                        By.css('.loading, .spinner, [class*="loading"]')
                    );
                    return loadingElements.length === 0;
                }, 10000);

                const activityRows = await this.driver.findElements(
                    By.css(".dataTable tbody tr")
                );

                let rowsProcessed = 0;

                for (const row of activityRows) {
                    try {
                        const cells = await row.findElements(By.css("td"));
                        if (cells.length >= 4) {
                            // Minimum required columns
                            // Get time with better error handling
                            const timeElement = cells[0];
                            const time = await timeElement.getAttribute(
                                "title"
                            );

                            if (!time) {
                                console.log("Skipping row with no time data");
                                continue;
                            }

                            // Get problem code
                            const problemElement = await cells[1].findElement(
                                By.css("a")
                            );
                            const problemCode = await problemElement.getText();
                            if (!problemCode) {
                                console.log("Skipping row with no problem code");
                                continue;
                            }

                            const prob_resp = await fetch(`https://www.codechef.com/api/contests/PRACTICE/problems/${problemCode}`)
                            const problemData = await prob_resp.json();
                            const difficulty_rating = problemData.difficulty_rating
                            
                            // Get result and language
                            const resultText = await cells[2].getText();
                            const result =
                                Number(resultText.replace(/[()]/g, "")) || 0;
                            const language = await cells[3].getText();

                            if (time && problemCode) {
                                activities.push({
                                    supabase_id: profileId,
                                    submission_time: time,
                                    problem_code: problemCode,
                                    difficulty_rating: difficulty_rating,
                                    result: result,
                                    language: language,
                                });
                                rowsProcessed = rowsProcessed + 1;
                            }
                        }
                    } catch (rowError) {
                        console.log("Error processing row:", rowError.message);
                        continue;
                    }
                }

                if (rowsProcessed === 0) {
                    consecutiveEmptyPages++;
                    console.log(
                        `Empty page detected (${consecutiveEmptyPages}/3)`
                    );
                } else {
                    consecutiveEmptyPages = 0;
                    console.log(
                        `Processed ${rowsProcessed} activities on page ${
                            pageCount + 1
                        }`
                    );
                }

                // Try to navigate to next page with better error handling
                try {
                    let isEnabled = false;
                    let isDisplayed = false;
                    let nextButton = null;
                    // Try multiple selectors for the next button
                    const nextSelector = 'a[onclick*="next"]';
                    try {
                        const element = await this.driver.findElement(
                            By.css(nextSelector)
                        );
                        isEnabled = await element.isEnabled();
                        isDisplayed = await element.isDisplayed();
                        if (isEnabled && isDisplayed) {
                            nextButton = element;
                        }
                        console.log(
                            `Next button - Enabled: ${isEnabled}, Displayed: ${isDisplayed}`
                        );
                    } catch (e) {
                        console.log(`Error in Selector`);
                    }

                    if (nextButton) {
                        await this.driver.sleep(1000);

                        await nextButton.click();

                        // Consistent delay between pages
                        await this.driver.sleep(1000);
                        pageCount = pageCount + 1;
                    } else {
                        hasNextPage = false;
                        console.log("Next button not found");
                    }
                } catch (nextError) {
                    console.log("No more pages available:", nextError.message);
                    hasNextPage = false;
                }
            }

            console.log(
                `Extracted ${activities.length} activities from ${
                    pageCount
                } pages`
            );

            return activities;
        } catch (error) {
            console.error("Error extracting recent activity:", error);
            return activities; // Return what we got so far
        }
    }

    async storeProfileData(profileData, user_id) {
        try {
            // Insert or update profile
            const { data: existingProfile } = await supabase
                .from("codechef_profiles")
                .select("supabase_id")
                .eq("username", profileData.username)
                .single();

            const profileUpdateData = {
                profile_name: profileData.profile_name,
                username: profileData.username,
                rating: profileData.rating,
                last_scraped_at: new Date(),
            };

            if (existingProfile) {
                this.profileId = existingProfile.supabase_id;
                const { error: updateError } = await supabase
                    .from("codechef_profiles")
                    .update(profileUpdateData)
                    .eq("supabase_id", this.profileId);
                if (updateError) throw updateError;
            } else {
                this.profileId = user_id

                const { error: insertError } = await supabase
                    .from("codechef_profiles")
                    .insert({
                        supabase_id: this.profileId,
                        ...profileUpdateData,
                        created_at: new Date(),
                    });
                if (insertError) throw insertError;
            }

            console.log(
                "Profile data stored successfully :",
                profileUpdateData
            );
        } catch (error) {
            console.error("Error storing profile data:", error);
            throw error;
        }
    }

    async updateProfileData(
        profileData,
        contests,
        activities,
        badges,
        heatmap
    ) {
        const { data: existingProfile } = await supabase
            .from("codechef_profiles")
            .select("supabase_id")
            .eq("username", profileData.username)
            .single();

        try {
            if (!this.profileId) {
                throw new Error(
                    "Profile ID not set. Cannot update profile data."
                );
            }

            const profileUpdateData = {
                badges: badges,
                heatmap: heatmap,
                total_contests: contests.length,
                total_questions: (await this.calculateProblems(activities))
                    .total,
                raw_stats: {
                    star_level: profileData.star_level,
                    division: profileData.division,
                    global_rank: profileData.global_rank,
                    country_rank: profileData.country_rank,
                    country: profileData.country,
                    institute: profileData.institute,
                    total_problems_solved: (
                        await this.calculateProblems(activities)
                    ).solved,
                },
                updated_at: new Date(Date.now()),
            };

            const { error } = await supabase
                .from("codechef_profiles")
                .update(profileUpdateData)
                .eq("supabase_id", this.profileId);

            if (error) {
                console.error("Error updating profile data:", error);
                throw error;
            }

        } catch (error) {
            console.error("Error updating profile data:", error);
            throw error;
        }
    }

    // Add validation to each store method
    async validateProfileId(operation) {
        if (!this.profileId) {
            throw new Error(`Cannot ${operation} - profile ID is not set`);
        }
    }

    async storeRatingHistory(ratingHistory) {
        await this.validateProfileId("store rating history");
        if (!ratingHistory.length) return;

        try {
            // Delete existing rating history
            await supabase
                .from("codechef_rating_history")
                .delete()
                .eq("supabase_id", this.profileId);

            // Insert new rating history
            const ratingData = ratingHistory.map((rating) => ({
                id: uuidv4(),
                supabase_id: this.profileId,
                ...rating,
            }));

            await supabase.from("codechef_rating_history").insert(ratingData);

            console.log(
                `Stored ${ratingHistory.length} rating history entries`
            );
        } catch (error) {
            console.error("Error storing rating history:", error);
        }
    }

    async storeContests(contests) {
        await this.validateProfileId("store contests");
        if (!contests.length) return;

        try {
            // Delete existing contests for this profile
            await supabase
                .from("codechef_contests")
                .delete()
                .eq("supabase_id", this.profileId);

            // Create an object to track unique contests
            const uniqueContests = {};

            // Process each contest, keeping only the most recent one for each name
            for (const contest of contests) {
                const key = contest.contest_name;

                // If this contest hasn't been seen or has a more recent date, update it
                if (
                    !uniqueContests[key] ||
                    (contest.contest_date &&
                        uniqueContests[key].contest_date &&
                        new Date(contest.contest_date) >
                            new Date(uniqueContests[key].contest_date))
                ) {
                    uniqueContests[key] = {
                        id: uuidv4(),
                        supabase_id: this.profileId,
                        created_at: new Date(),
                        ...contest,
                    };
                }
            }

            // Convert unique contests object to array
            const contestsToInsert = Object.values(uniqueContests);

            // Insert in batches of 100 to avoid potential payload size limits
            const batchSize = 100;
            for (let i = 0; i < contestsToInsert.length; i += batchSize) {
                const batch = contestsToInsert.slice(i, i + batchSize);
                const { error } = await supabase
                    .from("codechef_contests")
                    .insert(batch);

                if (error) {
                    console.error(
                        `Error inserting batch ${i / batchSize + 1}:`,
                        error
                    );
                    throw error;
                }
            }

            console.log(
                `Successfully stored ${contestsToInsert.length} unique contests`
            );
        } catch (error) {
            console.error("Error storing contests:", error);
            throw error;
        }
    }

    // Updated storeHeatmapData method - Simple delete then insert approach
    async storeHeatmapData(heatmapData) {
        await this.validateProfileId("store heatmap data");
        if (!heatmapData.length) {
            console.log("No heatmap data to store");
            return;
        }

        const client = supabase; // Assuming you have supabase client available

        try {
            console.log(`Processing ${heatmapData.length} heatmap entries...`);

            // Step 1: Clean and prepare data
            const uniqueEntries = new Map();
            heatmapData.forEach((entry) => {
                const dateKey =
                    entry.date instanceof Date
                        ? entry.date.toISOString().split("T")[0]
                        : new Date(entry.date).toISOString().split("T")[0];

                if (this.isValidDate(dateKey)) {
                    const submissionCount = Math.max(
                        0,
                        parseInt(entry.count) || 0
                    );
                    const level = Math.max(
                        0,
                        Math.min(4, parseInt(entry.level) || 0)
                    );

                    if (
                        !uniqueEntries.has(dateKey) ||
                        submissionCount >
                            uniqueEntries.get(dateKey).count
                    ) {
                        uniqueEntries.set(dateKey, {
                            date: dateKey,
                            count: submissionCount,
                            level: level,
                        });
                    }
                }
            });

            const cleanedData = Array.from(uniqueEntries.values());
            console.log(`Cleaned to ${cleanedData.length} unique entries`);

            if (cleanedData.length === 0) {
                console.log("No valid heatmap entries to process");
                return;
            }

            // Step 2: Delete existing heatmap data for this profile
            console.log(
                `Deleting existing heatmap data for profile: ${this.profileId}`
            );
            const { error: deleteError } = await client
                .from("codechef_heatmap")
                .delete()
                .eq("supabase_id", this.profileId);

            if (deleteError) {
                console.error(
                    "Error deleting existing heatmap data:",
                    deleteError
                );
                throw deleteError;
            }

            console.log("Successfully deleted existing heatmap data");

            // Step 3: Wait a moment for the delete to complete
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Step 4: Insert new data in batches
            const batchSize = 100;
            let totalInserted = 0;

            for (let i = 0; i < cleanedData.length; i += batchSize) {
                const batch = cleanedData.slice(i, i + batchSize);

                const insertData = batch.map((entry) => ({
                    supabase_id: this.profileId,
                    date: entry.date,
                    count: entry.count,
                    level: entry.level,
                    created_at: new Date().toISOString(),
                }));

                console.log(
                    `Inserting batch ${
                        Math.floor(i / batchSize) + 1
                    }/${Math.ceil(cleanedData.length / batchSize)} (${
                        batch.length
                    } records)`
                );

                const { data: insertResult, error: insertError } = await client
                    .from("codechef_heatmap")
                    .insert(insertData)
                    .select("id");

                if (insertError) {
                    console.error(
                        `Error inserting batch ${
                            Math.floor(i / batchSize) + 1
                        }:`,
                        insertError
                    );
                    throw insertError;
                }

                totalInserted += insertResult?.length || batch.length;
                console.log(
                    `Successfully inserted batch ${
                        Math.floor(i / batchSize) + 1
                    }`
                );

                // Small delay between batches to avoid overwhelming the database
                if (i + batchSize < cleanedData.length) {
                    await new Promise((resolve) => setTimeout(resolve, 200));
                }
            }

            console.log(`Successfully stored ${totalInserted} heatmap records`);
            return { success: true, count: totalInserted };
        } catch (error) {
            console.error("Error storing heatmap data:", error);
            throw error;
        }
    }

    // Enhanced date validation helper
    isValidDate(dateString) {
        if (!dateString) return false;

        const date = new Date(dateString);
        const isValid = date instanceof Date && !isNaN(date);
        const matchesFormat = /^\d{4}-\d{2}-\d{2}$/.test(dateString);

        // Date should be reasonable (not too far in future/past)
        const now = new Date();
        const minDate = new Date("2008-01-01"); // CodeChef started around 2009
        const maxDate = new Date(now.getFullYear() + 1, 11, 31); // Max 1 year in future

        return isValid && matchesFormat && date >= minDate && date <= maxDate;
    }

    async storeBadges(badges) {
        await this.validateProfileId("store badges");
        if (!badges.length) return;

        try {
            // First delete existing badges
            await supabase
                .from("codechef_badges")
                .delete()
                .eq("supabase_id", this.profileId);

            // Filter out duplicates before inserting
            const uniqueBadges = badges.reduce((acc, badge) => {
                const key = `${badge.badge_name}`;
                if (!acc[key]) {
                    acc[key] = {
                        id: uuidv4(),
                        supabase_id: this.profileId,
                        ...badge,
                    };
                }
                return acc;
            }, {});

            // Insert unique badges
            const { error } = await supabase
                .from("codechef_badges")
                .insert(Object.values(uniqueBadges));

            if (error) throw error;
            console.log(
                `Stored ${Object.keys(uniqueBadges).length} unique badges`
            );
        } catch (error) {
            console.error("Error storing badges:", error);
            throw error;
        }
    }

    async storeTotalProblems(rawData, profileId) {
        const BATCH_SIZE = 50;
        const MIN_DELAY = 2000;
        const MAX_DELAY = 4000;

        // Helper function to create random delay
        const randomDelay = () => {
            const delay =
                Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) +
                MIN_DELAY;
            return new Promise((resolve) => setTimeout(resolve, delay));
        };

        try {
            console.log(
                `Starting to store ${rawData.length} total problems...`
            );

            // Prepare data with correct field mapping
            const problemsData = this.prepareCodeChefData(rawData, profileId);

            // Validate first record to ensure correct structure
            if (problemsData.length > 0) {
                const sampleRecord = problemsData[0];

                // Check required fields
                const requiredFields = ["supabase_id", "problem_code"];
                const missingFields = requiredFields.filter(
                    (field) => !sampleRecord[field]
                );

                if (missingFields.length > 0) {
                    throw new Error(
                        `Missing required fields: ${missingFields.join(", ")}`
                    );
                }
            }

            // Check if we should clear existing data first
            const { data: existingData, error: checkError } = await supabase
                .from("codechef_total_problems")
                .select("id")
                .eq("supabase_id", profileId)
                .limit(1);

            if (checkError) {
                throw new Error(
                    `Error checking existing data: ${checkError.message}`
                );
            }

            const hasExistingData = existingData && existingData.length > 0;

            // Clear existing data for this profile if we have a lot of new data
            if (hasExistingData) {
                console.log("Clearing existing data for profile...");

                const { error: deleteError } = await supabase
                    .from("codechef_total_problems")
                    .delete()
                    .eq("supabase_id", profileId);

                if (deleteError) {
                    throw new Error(
                        `Error deleting existing data: ${deleteError.message}`
                    );
                }

                console.log("Existing data cleared successfully");
                await randomDelay();
            }

            // Process data in batches
            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            for (let i = 0; i < problemsData.length; i += BATCH_SIZE) {
                const batch = problemsData.slice(i, i + BATCH_SIZE);
                const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
                const totalBatches = Math.ceil(
                    problemsData.length / BATCH_SIZE
                );

                console.log(
                    `Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)...`
                );

                try {
                    // Insert the batch
                    const result = await supabase
                        .from("codechef_total_problems")
                        .insert(batch);

                    if (result.error) {
                        console.error(
                            `Batch ${batchNumber} error:`,
                            result.error
                        );

                        // Log the problematic data structure for debugging
                        console.error("Problematic batch sample:", batch[0]);

                        errors.push({
                            batch: batchNumber,
                            error: result.error.message,
                            sampleData: batch[0],
                        });
                        errorCount += batch.length;
                    } else {
                        console.log(
                            `Batch ${batchNumber} completed successfully`
                        );
                        successCount += batch.length;
                    }
                } catch (batchError) {
                    console.error(
                        `Batch ${batchNumber} exception:`,
                        batchError.message
                    );
                    errors.push({
                        batch: batchNumber,
                        error: batchError.message,
                        sampleData: batch[0],
                    });
                    errorCount += batch.length;
                }

                // Add delay between batches
                if (i + BATCH_SIZE < problemsData.length) {
                    console.log(`Waiting before next batch...`);
                    await randomDelay();
                }
            }

            // Summary
            console.log("\n=== Storage Summary ===");
            console.log(`Total records processed: ${problemsData.length}`);
            console.log(`Successfully stored: ${successCount}`);
            console.log(`Errors: ${errorCount}`);

            if (errors.length > 0) {
                console.log(`\nBatches with errors: ${errors.length}`);
                errors.forEach((error) => {
                    console.log(`- Batch ${error.batch}: ${error.error}`);
                    console.log(`  Sample data:`, error.sampleData);
                });
            }

            return {
                success: errorCount === 0,
                totalProcessed: problemsData.length,
                successCount,
                errorCount,
                errors: errors.length > 0 ? errors : null,
            };
        } catch (error) {
            console.error("Fatal error in storeTotalProblems:", error.message);
            throw error;
        }
    }

    // Correct way to prepare data for insertion
    prepareCodeChefData(rawScrapedData, profileId) {
        return rawScrapedData.map((item) => ({
            supabase_id: profileId,
            submission_time: item.time
                ? new Date(item.time).toISOString()
                : new Date().toISOString(),
            problem_code: item.problem_code,
            difficulty_rating: item.difficulty_rating,
            result: parseFloat(item.result) || 0,
            language: item.language || null,
            created_at: new Date().toISOString(),
        }));
    }

    // Logging methods
    async logScrapingStart(logId, username) {
        await supabase.from("codechef_scraping_logs").insert({
            id: logId,
            username,
            supabase_id: this.profileId,
            scraping_started_at: new Date(),
            status: "started",
            scraper_version: "1.0.0",
        });
    }

    async logScrapingComplete(
        logId,
        status,
        dataPoints,
        executionTime,
        errorMessage = null
    ) {
        try {
            // Clean up the data points to only show unique counts
            const cleanDataPoints = {
                contests: dataPoints.contests || 0,
                badges: dataPoints.badges || 0,
                problems: dataPoints.problems || 0,
                heatmap: dataPoints.heatmap || 0,
            };

            await supabase
                .from("codechef_scraping_logs")
                .update({
                    scraping_completed_at: new Date(),
                    status,
                    data_points_collected: cleanDataPoints,
                    execution_time_ms: executionTime,
                    error_message: errorMessage,
                })
                .eq("id", logId);
        } catch (error) {
            console.error("Logging error:", error);
        }
    }

    // Helper methods
    async safeGetText(selector) {
        try {
            const element = await this.driver.findElement(By.css(selector));
            return await element.getText();
        } catch {
            return "";
        }
    }

    calculateRatingChange(allRatings, currentContest) {
        const currentIndex = allRatings.findIndex(
            (r) => r.code === currentContest.code
        );
        if (currentIndex > 0) {
            const previousRating = parseInt(
                allRatings[currentIndex - 1].rating
            );
            const currentRating = parseInt(currentContest.rating);
            return currentRating - previousRating;
        }
        return 0;
    }

    // Add to calculateProblems method
    async calculateProblems(activities) {
        if (!Array.isArray(activities) || activities.length === 0) {
            return { total: 0, solved: 0 };
        }


        const totalProblems = activities.length;
        const solvedProblems = activities.filter(
            (activity) => activity.result === 100
        ).length;

        return {
            total: totalProblems,
            solved: solvedProblems,
        };
    }

    parseContestDate(contestName) {
        // Extract date from contest name if possible
        const dateMatch = contestName.match(/(\d{4})/);
        return dateMatch ? new Date(`${dateMatch[1]}-01-01`) : null;
    }

    parseContestDifficulty(contestName) {
        if (contestName.includes("Division 1")) return "Division 1";
        if (contestName.includes("Division 2")) return "Division 2";
        if (contestName.includes("Division 3")) return "Division 3";
        return "Unknown";
    }

    // Add smart waiting mechanism
    async waitForElement(selector, timeout = 15000) {
        try {
            const element = await this.driver.wait(
                until.elementLocated(By.css(selector)),
                timeout
            );
            await this.driver.wait(until.elementIsVisible(element), timeout);
            return element;
        } catch (error) {
            throw new Error(
                `Timeout waiting for element ${selector}: ${error.message}`
            );
        }
    }

    async cleanup() {
        if (this.driver) {
            try {
                // Try graceful shutdown first
                await Promise.race([
                    this.driver.quit(),
                    new Promise((_, reject) =>
                        setTimeout(
                            () => reject(new Error("Quit timeout")),
                            10000
                        )
                    ),
                ]);
            } catch (error) {
                console.error("Graceful cleanup failed:", error.message);

                // Force cleanup
                try {
                    if (this.driver.session_) {
                        await this.driver.session_.quit();
                    }
                } catch (forceError) {
                    console.error("Force cleanup failed:", forceError.message);
                }
            } finally {
                this.driver = null;
                this.isInitialized = false;
                console.log("Browser cleanup completed");
            }
        }
    }
}

// Export for use
export default CodeChefScraper;
