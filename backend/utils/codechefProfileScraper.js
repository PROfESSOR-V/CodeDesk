import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { supabase } from '../config/supabaseClient.js';

class CodeChefScraper {
  constructor(options = {}) {
    this.options = {
      headless: options.headless !== false,
      timeout: options.timeout || 30000,
      retryAttempts: options.retryAttempts || 3,
      waitForDynamic: options.waitForDynamic || 8000,
      ...options
    };
    
    this.driver = null;
    this.scraped_data = {};
    this.supabase = supabase
    
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  async initDriver() {
    const options = new chrome.Options();
    
    if (this.options.headless) {
      options.addArguments('--headless=new');
    }
    
    options.addArguments(
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    await this.driver.manage().setTimeouts({
      implicit: 10000,
      pageLoad: 30000,
      script: 30000
    });

    return this.driver;
  }

  async scrapeUserProfile(username) {
    this.log(`Starting scrape for username: ${username}`);
    
    try {
      await this.initDriver();
      
      const profileData = await this.navigateToProfile(username);
      if (!profileData.success) {
        throw new Error(`Profile navigation failed: ${profileData.error}`);
      }

      await this.waitForDynamicContent();

      this.log('Extracting profile data...');
      const basicInfo = await this.extractBasicInfo();
      const contestData = await this.extractContestData();
      const problemData = await this.extractProblemData();
      const heatmapData = await this.extractHeatmapData();
      
      this.scraped_data = {
        username,
        timestamp: new Date().toISOString(),
        basic_info: basicInfo,
        contests: contestData,
        problems: problemData,
        heatmap: heatmapData,
        scraping_metadata: {
          success: true,
          total_contests: contestData.length,
          total_problems: problemData.length,
          heatmap_days: heatmapData.length
        }
      };

      // Store in Supabase instead of saving to file
      await this.storeInSupabase(username);
      this.log(`✅ Data stored in Supabase: ${contestData.length} contests, ${problemData.length} problems, ${heatmapData.length} heatmap days`);
      
      return this.scraped_data;

    } catch (error) {
      this.log(`❌ Scraping failed: ${error.message}`);
      
      if (Object.keys(this.scraped_data).length > 0) {
        this.scraped_data.scraping_metadata = {
          success: false,
          error: error.message,
          partial_data: true
        };
        try {
          await this.storeInSupabase(username, true); // Store partial data
        } catch (storeError) {
          this.log(`Failed to store partial data: ${storeError.message}`);
        }
      }
      
      throw error;
    } finally {
      if (this.driver) {
        await this.driver.quit();
      }
    }
  }

  async navigateToProfile(username) {
    const profileUrl = `https://www.codechef.com/users/${username}`;
    
    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      try {
        this.log(`Navigating to profile (attempt ${attempt}/${this.options.retryAttempts})`);
        
        await this.driver.get(profileUrl);
        await this.driver.wait(until.elementLocated(By.css('body')), 15000);

        const pageStatus = await this.driver.executeScript(() => {
          const bodyText = document.body.innerText.toLowerCase();
          return {
            hasUserNotExist: bodyText.includes('user does not exist'),
            has404: bodyText.includes('404') || bodyText.includes('not found'),
            hasCaptcha: document.querySelectorAll('[class*="captcha"], [id*="captcha"]').length > 0,
            hasBlocked: bodyText.includes('blocked') || bodyText.includes('forbidden'),
            bodyLength: document.body.innerText.length
          };
        });

        if (pageStatus.has404 || pageStatus.hasUserNotExist) {
          throw new Error(`User ${username} does not exist or profile not found`);
        }

        if (pageStatus.hasCaptcha) {
          throw new Error('CAPTCHA detected - manual intervention required');
        }

        if (pageStatus.hasBlocked) {
          throw new Error('Access blocked by CodeChef');
        }

        return { success: true };

      } catch (error) {
        if (attempt === this.options.retryAttempts) {
          return { success: false, error: error.message };
        }
        
        await this.driver.sleep(2000 * attempt);
      }
    }
  }

  async waitForDynamicContent() {
    this.log('Waiting for dynamic content...');
    await this.driver.sleep(this.options.waitForDynamic);
    
    // Check if additional wait is needed
    const changes = await this.driver.executeScript(() => {
      const tableRows = document.querySelectorAll('table tbody tr').length;
      const heatmapCells = document.querySelectorAll('[data-date]').length;
      return { tableRows, heatmapCells };
    });
    
    if (changes.tableRows > 0 || changes.heatmapCells > 100) {
      await this.driver.sleep(2000); // Additional wait for substantial content
    }
  }

  async extractBasicInfo() {
    try {
      const basicInfo = await this.driver.executeScript(() => {
        const info = {};
        
        const usernameEl = document.querySelector('.user-details-container h1, .user-details-container .username, h1');
        info.username = usernameEl ? usernameEl.textContent.trim() : '';
        
        const ratingEl = document.querySelector('.rating, [class*="rating"]');
        info.rating = ratingEl ? ratingEl.textContent.trim() : '';
        
        const starsEl = document.querySelector('.rating, [class*="star"]');
        info.stars = starsEl ? starsEl.textContent.trim() : '';
        
        const countryEl = document.querySelector('[class*="country"], .user-country');
        info.country = countryEl ? countryEl.textContent.trim() : '';
        
        const institutionEl = document.querySelector('[class*="institution"], .user-institution');
        info.institution = institutionEl ? institutionEl.textContent.trim() : '';
        
        const contestCountEl = document.querySelector('.contest-participated-count, [class*="contest-participated"]');
        if (contestCountEl) {
          const match = contestCountEl.textContent.match(/(\d+)/);
          info.contests_participated = match ? parseInt(match[1]) : 0;
        }
        
        return info;
      });
      
      return basicInfo;
      
    } catch (error) {
      return {};
    }
  }

  async extractContestData() {
    try {
      const contests = await this.driver.executeScript(() => {
        const contestRows = Array.from(document.querySelectorAll('table tbody tr'));
        const contestData = [];
        
        contestRows.forEach(row => {
          try {
            const cells = Array.from(row.querySelectorAll('td'));
            if (cells.length >= 3) {
              
              const problemLink = row.querySelector('a[href*="/problems/"]');
              const contestName = problemLink ? problemLink.textContent.trim() : '';
              
              const dateText = cells[0] ? cells[0].textContent.trim() : '';
              const scoreText = cells.length > 1 ? cells[1].textContent.trim() : '';
              
              const languageMatch = row.textContent.match(/(C\+\+|Java|Python|JavaScript|C)/i);
              const language = languageMatch ? languageMatch[1] : '';
              
              if (contestName || dateText) {
                contestData.push({
                  contest_name: contestName,
                  date: dateText,
                  score: scoreText,
                  language: language,
                  raw_text: row.textContent.trim().substring(0, 200)
                });
              }
            }
          } catch (err) {
            // Skip problematic rows
          }
        });
        
        return contestData;
      });
      
      return contests;
      
    } catch (error) {
      return [];
    }
  }

  async extractProblemData() {
    try {
      const problems = await this.driver.executeScript(() => {
        const problemLinks = Array.from(document.querySelectorAll('a[href*="/problems/"]'));
        const problemData = [];
        
        problemLinks.forEach(link => {
          try {
            const problemCode = link.textContent.trim();
            const problemUrl = link.href;
            
            const parentRow = link.closest('tr');
            let additionalInfo = '';
            if (parentRow) {
              additionalInfo = parentRow.textContent.trim();
            }
            
            if (problemCode && problemUrl) {
              problemData.push({
                problem_code: problemCode,
                problem_url: problemUrl,
                context: additionalInfo.substring(0, 100)
              });
            }
          } catch (err) {
            // Skip problematic links
          }
        });
        
        return problemData;
      });
      
      return problems;
      
    } catch (error) {
      return [];
    }
  }

  async extractHeatmapData() {
    try {
      const heatmapData = await this.driver.executeScript(() => {
        const heatmapCells = [];
        
        const dateCells = Array.from(document.querySelectorAll('[data-date]'));
        dateCells.forEach(cell => {
          try {
            const date = cell.getAttribute('data-date');
            const count = cell.getAttribute('data-count') || '0';
            const category = cell.getAttribute('category') || 'none';
            
            if (date) {
              heatmapCells.push({
                date: date,
                count: parseInt(count) || 0,
                category: category,
                element_type: cell.tagName.toLowerCase()
              });
            }
          } catch (err) {
            // Skip problematic cells
          }
        });
        
        const activeCells = Array.from(document.querySelectorAll('rect[data-count]'));
        activeCells.forEach(cell => {
          try {
            const date = cell.getAttribute('data-date');
            const count = cell.getAttribute('data-count');
            const category = cell.getAttribute('category') || 'active';
            
            const exists = heatmapCells.some(existing => existing.date === date);
            if (date && !exists) {
              heatmapCells.push({
                date: date,
                count: parseInt(count) || 0,
                category: category,
                element_type: 'rect'
              });
            }
          } catch (err) {
            // Skip problematic cells
          }
        });
        
        heatmapCells.sort((a, b) => new Date(a.date) - new Date(b.date));
        return heatmapCells;
      });
      
      return heatmapData;
      
    } catch (error) {
      return [];
    }
  }

  async storeInSupabase(username, isPartial = false) {
    const startTime = Date.now();
    this.log(`Storing data in Supabase for user: ${username}${isPartial ? ' (partial data)' : ''}`);
    
    // Start logging the scraping attempt
    let scrapingLogId = null;
    
    try {
      const { basic_info, contests, problems, heatmap, scraping_metadata } = this.scraped_data;
      
      // 1. Log scraping attempt
      const { data: scrapingLog, error: logError } = await this.supabase
        .from('codechef_scraping_logs')
        .insert({
          username: username,
          scraping_started_at: new Date(startTime).toISOString(),
          status: 'started',
          data_points_collected: {
            contests: contests?.length || 0,
            problems: problems?.length || 0,
            heatmap: heatmap?.length || 0,
            basic_info_fields: Object.keys(basic_info || {}).length
          }
        })
        .select()
        .single();

      if (!logError) {
        scrapingLogId = scrapingLog.id;
      }

      // 2. Get existing profile to preserve some data
      const { data: existingProfile } = await this.supabase
        .from('codechef_profiles')
        .select('id, rating, highest_rating, current_streak, longest_streak')
        .eq('username', username)
        .single();

      // 3. Calculate enhanced profile data
      const currentRating = this.parseNumber(basic_info.rating);
      const highestRating = Math.max(
        currentRating,
        existingProfile?.highest_rating || 0
      );
      
      const dataQuality = this.calculateDataQuality(basic_info, contests, problems, heatmap);
      const currentStreak = this.calculateCurrentStreak(heatmap);
      const longestStreak = Math.max(
        currentStreak,
        existingProfile?.longest_streak || 0
      );

      // 4. Insert or update profile with enhanced data
      const profileData = {
        username: username,
        profile_name: basic_info.username || username,
        rating: currentRating,
        star_level: this.parseStarLevel(basic_info.stars),
        country: this.cleanString(basic_info.country),
        institute: this.cleanString(basic_info.institution),
        contests_participated: basic_info.contests_participated || 0,
        total_problems_solved: problems?.length || 0,
        highest_rating: highestRating,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        data_quality_score: dataQuality,
        scraping_status: isPartial ? 'partial' : 'active',
        last_scraped_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: profile, error: profileError } = await this.supabase
        .from('codechef_profiles')
        .upsert(profileData, { 
          onConflict: 'username',
          returning: 'representation'
        })
        .select()
        .single();

      if (profileError) {
        throw new Error(`Profile upsert failed: ${profileError.message}`);
      }

      const profileId = profile.id;
      this.log(`Profile stored with ID: ${profileId}`);

      // 5. Store contest data with better error handling
      if (contests && contests.length > 0) {
        await this.storeContestData(profileId, contests);
      }

      // 6. Store solved problems with deduplication
      if (problems && problems.length > 0) {
        await this.storeSolvedProblems(profileId, problems);
      }

      // 7. Store heatmap data with validation
      if (heatmap && heatmap.length > 0) {
        await this.storeHeatmapData(profileId, heatmap);
      }

      // 8. Calculate and store language statistics
      await this.storeLanguageStats(profileId, contests);

      // 9. Update scraping log with success
      if (scrapingLogId) {
        await this.supabase
          .from('codechef_scraping_logs')
          .update({
            profile_id: profileId,
            scraping_completed_at: new Date().toISOString(),
            status: isPartial ? 'partial' : 'completed',
            execution_time_ms: Date.now() - startTime
          })
          .eq('id', scrapingLogId);
      }

      this.log(`✅ All data successfully stored in Supabase for user: ${username}`);
      return profile;

    } catch (error) {
      this.log(`❌ Supabase storage failed: ${error.message}`);
      
      // Update scraping log with failure
      if (scrapingLogId) {
        await this.supabase
          .from('codechef_scraping_logs')
          .update({
            scraping_completed_at: new Date().toISOString(),
            status: 'failed',
            error_message: error.message,
            execution_time_ms: Date.now() - startTime
          })
          .eq('id', scrapingLogId);
      }
      
      throw error;
    }
  }

  // Helper method for storing contest data
  async storeContestData(profileId, contests) {
    try {
      // Delete existing contest data
      await this.supabase
        .from('codechef_contests')
        .delete()
        .eq('profile_id', profileId);

      // Prepare contest records with validation
      const contestRecords = contests
        .filter(contest => contest.contest_name || contest.date) // Only valid contests
        .map(contest => ({
          profile_id: profileId,
          contest_name: this.cleanString(contest.contest_name),
          contest_code: this.extractContestCode(contest.contest_name),
          score: this.parseNumber(contest.score),
          contest_date: this.parseDate(contest.date),
          created_at: new Date().toISOString()
        }));

      if (contestRecords.length > 0) {
        // Insert in batches to handle large datasets
        const batchSize = 100;
        for (let i = 0; i < contestRecords.length; i += batchSize) {
          const batch = contestRecords.slice(i, i + batchSize);
          const { error } = await this.supabase
            .from('codechef_contests')
            .insert(batch);
            
          if (error) {
            this.log(`Contest batch ${Math.floor(i/batchSize) + 1} insert warning: ${error.message}`);
          }
        }
        this.log(`Inserted ${contestRecords.length} contest records`);
      }
    } catch (error) {
      this.log(`Contest storage error: ${error.message}`);
    }
  }

  // Helper method for storing solved problems
  async storeSolvedProblems(profileId, problems) {
    try {
      // Delete existing solved problems
      await this.supabase
        .from('codechef_solved_problems')
        .delete()
        .eq('profile_id', profileId);

      // Remove duplicates and prepare records
      const uniqueProblems = problems.reduce((acc, problem) => {
        if (problem.problem_code && !acc.some(p => p.problem_code === problem.problem_code)) {
          acc.push(problem);
        }
        return acc;
      }, []);

      const problemRecords = uniqueProblems.map(problem => ({
        profile_id: profileId,
        problem_code: this.cleanString(problem.problem_code),
        problem_name: this.extractProblemName(problem.problem_code),
        difficulty: this.extractDifficulty(problem.context),
        category: this.extractCategory(problem.context),
        solved_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }));

      // Insert in batches
      const batchSize = 100;
      for (let i = 0; i < problemRecords.length; i += batchSize) {
        const batch = problemRecords.slice(i, i + batchSize);
        const { error } = await this.supabase
          .from('codechef_solved_problems')
          .insert(batch);
          
        if (error) {
          this.log(`Problems batch ${Math.floor(i/batchSize) + 1} insert warning: ${error.message}`);
        }
      }
      this.log(`Inserted ${problemRecords.length} unique problem records`);
    } catch (error) {
      this.log(`Problems storage error: ${error.message}`);
    }
  }

  // Helper method for storing heatmap data
  async storeHeatmapData(profileId, heatmap) {
    try {
      // Delete existing heatmap data
      await this.supabase
        .from('codechef_heatmap')
        .delete()
        .eq('profile_id', profileId);

      // Filter and validate heatmap data
      const validHeatmapData = heatmap
        .filter(day => day.date && this.isValidDate(day.date))
        .map(day => ({
          profile_id: profileId,
          date: day.date,
          problem_count: Math.max(0, day.count || 0),
          submission_count: Math.max(0, day.count || 0), // Assuming count represents submissions
          level: this.calculateHeatmapLevel(day.count),
          created_at: new Date().toISOString()
        }));

      if (validHeatmapData.length > 0) {
        // Insert in batches
        const batchSize = 200;
        for (let i = 0; i < validHeatmapData.length; i += batchSize) {
          const batch = validHeatmapData.slice(i, i + batchSize);
          const { error } = await this.supabase
            .from('codechef_heatmap')
            .insert(batch);
            
          if (error) {
            this.log(`Heatmap batch ${Math.floor(i/batchSize) + 1} insert warning: ${error.message}`);
          }
        }
        this.log(`Inserted ${validHeatmapData.length} heatmap records`);
      }
    } catch (error) {
      this.log(`Heatmap storage error: ${error.message}`);
    }
  }

  // Helper method for storing language statistics
  async storeLanguageStats(profileId, contests) {
    try {
      if (!contests || contests.length === 0) return;

      // Extract language usage from contests
      const languageStats = contests.reduce((acc, contest) => {
        if (contest.language) {
          const lang = contest.language.trim();
          if (!acc[lang]) {
            acc[lang] = { count: 0, totalScore: 0, validScores: 0 };
          }
          acc[lang].count++;
          
          const score = this.parseNumber(contest.score);
          if (score > 0) {
            acc[lang].totalScore += score;
            acc[lang].validScores++;
          }
        }
        return acc;
      }, {});

      // Delete existing language stats
      await this.supabase
        .from('codechef_language_stats')
        .delete()
        .eq('profile_id', profileId);

      // Prepare language records
      const languageRecords = Object.entries(languageStats).map(([language, stats]) => ({
        profile_id: profileId,
        language: language,
        problems_solved: stats.count,
        success_rate: stats.validScores > 0 ? (stats.totalScore / stats.validScores).toFixed(2) : 0,
        last_used: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      if (languageRecords.length > 0) {
        const { error } = await this.supabase
          .from('codechef_language_stats')
          .insert(languageRecords);
          
        if (error) {
          this.log(`Language stats insert warning: ${error.message}`);
        } else {
          this.log(`Inserted ${languageRecords.length} language stat records`);
        }
      }
    } catch (error) {
      this.log(`Language stats storage error: ${error.message}`);
    }
  }

  // Enhanced helper methods for better data processing
  calculateDataQuality(basicInfo, contests, problems, heatmap) {
    let score = 0;
    
    // Basic info completeness (40 points max)
    if (basicInfo?.username) score += 10;
    if (basicInfo?.rating && this.parseNumber(basicInfo.rating) > 0) score += 10;
    if (basicInfo?.country) score += 5;
    if (basicInfo?.institution) score += 5;
    if (basicInfo?.stars) score += 5;
    if (basicInfo?.contests_participated) score += 5;
    
    // Data richness (60 points max)
    if (contests?.length > 0) score += 20;
    if (problems?.length > 0) score += 20;
    if (heatmap?.length > 0) score += 20;
    
    return Math.min(score, 100);
  }

  calculateCurrentStreak(heatmap) {
    if (!heatmap || heatmap.length === 0) return 0;
    
    // Sort by date descending
    const sortedDays = heatmap
      .filter(day => day.count > 0)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedDays.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const day of sortedDays) {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today - dayDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff > streak) {
        break;
      }
    }
    
    return streak;
  }

  cleanString(str) {
    if (!str) return null;
    return str.toString().trim().replace(/\s+/g, ' ') || null;
  }

  isValidDate(dateString) {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date.getFullYear() > 2000;
  }

  extractDifficulty(context) {
    if (!context) return null;
    
    const difficultyPatterns = [
      /easy/i, /medium/i, /hard/i, /beginner/i, /intermediate/i, /advanced/i,
      /school/i, /practice/i, /challenge/i
    ];
    
    for (const pattern of difficultyPatterns) {
      const match = context.match(pattern);
      if (match) return match[0].toLowerCase();
    }
    
    return null;
  }

  extractCategory(context) {
    if (!context) return null;
    
    const categoryPatterns = [
      /array/i, /string/i, /math/i, /graph/i, /dp/i, /greedy/i,
      /sorting/i, /searching/i, /tree/i, /implementation/i
    ];
    
    for (const pattern of categoryPatterns) {
      const match = context.match(pattern);
      if (match) return match[0].toLowerCase();
    }
    
    return null;
  }

  // Helper methods for data parsing (enhanced versions)
  parseNumber(value) {
    if (!value) return 0;
    const cleaned = String(value).replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.max(0, Math.floor(parsed));
  }

  parseStarLevel(value) {
    if (!value) return 0;
    const starMatch = String(value).match(/(\d+)\s*\*|(\d+)\s*star/i);
    if (starMatch) {
      const stars = parseInt(starMatch[1] || starMatch[2]);
      return Math.min(Math.max(0, stars), 7); // Cap at 7 stars
    }
    return 0;
  }

  parseDate(dateString) {
    if (!dateString) return null;
    try {
      // Handle various date formats
      const cleaned = dateString.trim();
      let date;
      
      // Try different date formats
      if (cleaned.match(/^\d{4}-\d{2}-\d{2}/)) {
        date = new Date(cleaned);
      } else if (cleaned.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        const [day, month, year] = cleaned.split('/');
        date = new Date(`${year}-${month}-${day}`);
      } else if (cleaned.match(/^\d{2}-\d{2}-\d{4}/)) {
        const [day, month, year] = cleaned.split('-');
        date = new Date(`${year}-${month}-${day}`);
      } else {
        date = new Date(cleaned);
      }
      
      return (isNaN(date.getTime()) || date.getFullYear() < 2008) ? null : date.toISOString();
    } catch {
      return null;
    }
  }

  extractContestCode(contestName) {
    if (!contestName) return null;
    
    // More comprehensive contest code extraction
    const patterns = [
      /([A-Z]{2,}[0-9]+)/,           // COOK123, LTIME99
      /([A-Z]+[0-9]{2,})/,          // START123, JULY2023
      /([A-Z]{3,})/,                // PRACTICE, CHALLENGE
      /([0-9]+[A-Z]+)/              // 2023JULY
    ];
    
    for (const pattern of patterns) {
      const match = contestName.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  extractProblemName(problemCode) {
    // In a real scenario, you might want to maintain a lookup table
    // or make API calls to get full problem names
    return problemCode?.replace(/[_-]/g, ' ')?.toUpperCase() || null;
  }

  calculateHeatmapLevel(count) {
    // Enhanced heatmap level calculation
    const numCount = parseInt(count) || 0;
    if (numCount === 0) return 0;
    if (numCount <= 1) return 1;
    if (numCount <= 3) return 2;
    if (numCount <= 6) return 3;
    return 4;
  }
}

// Multiple retry strategies for reliability
export async function scrapeWithFallbacks(username, supabaseConfig, options = {}) {
  const strategies = [
    { 
      ...options, 
      ...supabaseConfig,
      headless: true, 
      waitForDynamic: 8000 
    },
    { 
      ...options, 
      ...supabaseConfig,
      headless: true, 
      waitForDynamic: 15000 
    },
    { 
      ...options, 
      ...supabaseConfig,
      headless: false, 
      waitForDynamic: 10000 
    },
  ];

  for (const [index, strategy] of strategies.entries()) {
    try {
      console.log(`🔄 Attempting strategy ${index + 1}/${strategies.length}`);
      
      const scraper = new CodeChefScraper(strategy);
      const result = await scraper.scrapeUserProfile(username);
      
      const hasGoodData = (
        result.contests.length > 0 || 
        result.problems.length > 0 || 
        result.heatmap.length > 0
      );
      
      if (hasGoodData) {
        console.log(`✅ Strategy ${index + 1} succeeded!`);
        return result;
      } else {
        console.log(`⚠️ Strategy ${index + 1} completed but with limited data`);
        continue;
      }
      
    } catch (error) {
      console.log(`❌ Strategy ${index + 1} failed: ${error.message}`);
      
      if (index === strategies.length - 1) {
        throw new Error(`All strategies failed. Last error: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

// Simple test function
// export async function testScraper(username, supabaseUrl, supabaseKey) {
//   return await scrapeWithFallbacks(username, {
//     supabaseUrl,
//     supabaseKey
//   });
// }

export default CodeChefScraper;