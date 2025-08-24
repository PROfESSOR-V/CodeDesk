import axios from "axios";
import * as cheerio from "cheerio";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

// --- LeetCode -------------------------------------------------------------
async function leetCodeStats(profileUrl) {
  // Accept https://leetcode.com/u/<user> or https://leetcode.com/<user>
  const parts = profileUrl.replace(/\/$/, "").split("/");
  let username = parts.pop();
  if (username === "u") username = parts.pop();
  username = username.toLowerCase();

  // Get comprehensive user data
  const query = {
    operationName: "userProfile",
    query: `
      query userProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile { 
            realName 
            ranking 
            userAvatar
            aboutMe
            school
            websites
            countryName
            company
            jobTitle
          }
          submitStats: submitStatsGlobal {
            acSubmissionNum { difficulty count }
            totalSubmissionNum { difficulty count }
          }
          userCalendar {
            activeYears
            streak
            totalActiveDays
            submissionCalendar
          }
          userContestRanking {
            attendedContestsCount
            rating
            globalRanking
            totalParticipants
            topPercentage
          }
        }
      }`,
    variables: { username },
  };

  try {
    const { data } = await axios.post("https://leetcode.com/graphql", query, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": UA,
        Referer: `https://leetcode.com/${username}`,
      },
    });

    const u = data.data.matchedUser;
    if (!u) throw new Error("User not found on LeetCode");

    // Process difficulty breakdown
    const difficulties = { easy: 0, medium: 0, hard: 0 };
    u.submitStats.acSubmissionNum.forEach(item => {
      if (item.difficulty === "Easy") difficulties.easy = item.count;
      else if (item.difficulty === "Medium") difficulties.medium = item.count;
      else if (item.difficulty === "Hard") difficulties.hard = item.count;
    });

    const totalSolved = difficulties.easy + difficulties.medium + difficulties.hard;

    // Generate contribution calendar HTML (simplified version)
    let contributionGraphHtml = '';
    let contributionDataArr = [];
    if (u.userCalendar?.submissionCalendar) {
      const calendar = JSON.parse(u.userCalendar.submissionCalendar);
      contributionGraphHtml = generateLeetCodeCalendarSVG(calendar, u.userCalendar.streak, totalSolved);
      // Build contributionData array [{date,count}]
      contributionDataArr = Object.entries(calendar).map(([ts, cnt]) => {
        const date = new Date(parseInt(ts, 10) * 1000).toISOString().slice(0, 10);
        return { date, count: cnt };
      });
    }

    return {
      platform: "leetcode",
      username: u.username,
      displayName: u.profile.realName || (u.profile.aboutMe ? u.profile.aboutMe.slice(0, 120) : '') || u.username,
      ranking: u.profile.ranking,
      totalSolved,
      easySolved: difficulties.easy,
      mediumSolved: difficulties.medium,
      hardSolved: difficulties.hard,
      activeDays: u.userCalendar?.totalActiveDays || 0,
      currentStreak: u.userCalendar?.streak || 0,
      contestsParticipated: u.userContestRanking?.attendedContestsCount || 0,
      contestRating: u.userContestRanking?.rating || 0,
      maxRating: u.userContestRanking?.rating || 0,
      contributionGraphHtml,
      contributionData: contributionDataArr || [],
      country: u.profile.countryName,
    };
  } catch (error) {
    console.error("LeetCode API error:", error);
    // Fallback to HTML scraping when GraphQL fails (e.g., Cloudflare blocks)
    try {
      const puppeteer = await import("puppeteer");
      const browser = await puppeteer.launch({ 
        headless: "new", 
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-accelerated-2d-canvas"]
      });
      const page = await browser.newPage();
      await page.setUserAgent(UA);
      await page.setViewport({ width: 1366, height: 768 });
      await page.goto(`https://leetcode.com/${username}`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await new Promise(res => setTimeout(res, 2000)); // Wait for JS render

      const pageContent = await page.content();
      await browser.close();

      // Extract with Cheerio for reliability
      const $ = cheerio.load(pageContent);

      // Find submissionCalendar JSON
      let submissionCalendarObj = {};
      let difficulties = { easy: 0, medium: 0, hard: 0 };
      let streak = 0;
      let activeDays = 0;

      // Look for script tags with data
      $('script').each((i, elem) => {
        const text = $(elem).html() || '';
        if (text.includes('submissionCalendar')) {
          const calMatch = text.match(/submissionCalendar:\s*"([^"]+)"/);
          if (calMatch) submissionCalendarObj = JSON.parse(calMatch[1]);

          const subStatsMatch = text.match(/acSubmissionNum:\s*(\[[^\]]+\])/);
          if (subStatsMatch) {
            const arr = JSON.parse(subStatsMatch[1]);
            arr.forEach(it => {
              if (it.difficulty === "Easy") difficulties.easy = it.count;
              else if (it.difficulty === "Medium") difficulties.medium = it.count;
              else if (it.difficulty === "Hard") difficulties.hard = it.count;
            });
          }

          const streakMatch = text.match(/streak:\s*(\d+)/);
          if (streakMatch) streak = parseInt(streakMatch[1]);

          const activeMatch = text.match(/totalActiveDays:\s*(\d+)/);
          if (activeMatch) activeDays = parseInt(activeMatch[1]);
        }
      });

      const totalSolved = difficulties.easy + difficulties.medium + difficulties.hard;

      const contributionDataArr = Object.entries(submissionCalendarObj).map(([ts, cnt]) => ({
        date: new Date(parseInt(ts) * 1000).toISOString().slice(0,10),
        count: cnt
      }));

      const contributionGraphHtml = generateLeetCodeCalendarSVG(submissionCalendarObj, streak, totalSolved);

      return {
        platform: "leetcode",
        username,
        displayName: username,
        ranking: null,
        totalSolved,
        easySolved: difficulties.easy,
        mediumSolved: difficulties.medium,
        hardSolved: difficulties.hard,
        activeDays,
        currentStreak: streak,
        contestsParticipated: 0,
        contestRating: 0,
        maxRating: 0,
        contributionGraphHtml,
        contributionData: contributionDataArr,
        country: null,
      };
    } catch (scrapeErr) {
      console.error("LeetCode scrape fallback failed:", scrapeErr.message);
      throw error; // propagate original
    }
  }
}

// Helper function to generate LeetCode-style calendar SVG
function generateLeetCodeCalendarSVG(submissionCalendar, streak, totalSubmissions) {
  const currentYear = new Date().getFullYear();
  const startDate = new Date(currentYear, 0, 1);
  const endDate = new Date(currentYear, 11, 31);
  
  let svg = `
    <div class="leetcode-calendar" style="background: white; padding: 16px; border-radius: 8px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
        <span><strong>${totalSubmissions}</strong> submissions</span>
        <span>Max Streak: <strong>${streak}</strong></span>
        <div>Current: ${currentYear}</div>
      </div>
      <svg width="700" height="104" style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif;">
  `;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Add month labels
  for (let i = 0; i < 12; i++) {
    const x = 14 + (i * 56);
    svg += `<text x="${x}" y="12" font-size="10" fill="#656d76">${months[i]}</text>`;
  }

  // Add day squares
  let x = 14, y = 20;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const timestamp = Math.floor(currentDate.getTime() / 1000).toString();
    const submissions = submissionCalendar[timestamp] || 0;
    
    let fillColor = '#ebedf0'; // Default gray
    if (submissions > 0) {
      if (submissions >= 10) fillColor = '#196127'; // Dark green
      else if (submissions >= 5) fillColor = '#239a3b'; // Medium green  
      else if (submissions >= 2) fillColor = '#7bc96f'; // Light green
      else fillColor = '#c6e48b'; // Very light green
    }
    
    svg += `<rect x="${x}" y="${y}" width="10" height="10" fill="${fillColor}" rx="2"></rect>`;
    
    y += 12;
    if (currentDate.getDay() === 6) { // Saturday, move to next column
      x += 12;
      y = 20;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  svg += '</svg></div>';
  return svg;
}

// --- Codeforces -----------------------------------------------------------
async function codeforcesStats(profileUrl) {
  const handle = profileUrl.split("/").pop();
  
  try {
    // Get user info
    const { data: userInfo } = await axios.get(
      `https://codeforces.com/api/user.info?handles=${handle}`
    );
    if (!userInfo.result || !userInfo.result.length) throw new Error("User not found");
    const user = userInfo.result[0];

    // Fetch all submissions to build accurate calendar (Codeforces limits to 10k, but for most users it's fine)
    let allSubmissions = [];
    let from = 1;
    let res;
    do {
      res = await axios.get(
        `https://codeforces.com/api/user.status?handle=${handle}&from=${from}&count=5000`
      ).then(r => r.data);
      allSubmissions = allSubmissions.concat(res.result || []);
      from += 5000;
    } while (res.result?.length === 5000);

    // Count solved problems
    const solvedProblems = new Set();
    let contestsParticipated = 0;
    
    if (allSubmissions) {
      allSubmissions.forEach(sub => {
        if (sub.verdict === 'OK') {
          solvedProblems.add(`${sub.problem.contestId}-${sub.problem.index}`);
        }
      });
    }

    // Get contest history for contest count
    try {
      const { data: contestData } = await axios.get(
        `https://codeforces.com/api/user.rating?handle=${handle}`
      );
      contestsParticipated = contestData.result ? contestData.result.length : 0;
    } catch (e) {
      console.log("Contest data not available for", handle);
    }

    // Generate activity calendar (simplified - Codeforces doesn't provide this data easily)
    const contributionGraphHtml = generateCodeforcesCalendarSVG(solvedProblems.size, contestsParticipated);

    // Build contributionData from submissions (daily submission counts)
    const dailyCounts = {};
    if (allSubmissions) {
      allSubmissions.forEach(sub => {
        const date = new Date(sub.creationTimeSeconds * 1000).toISOString().slice(0, 10);
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      });
    }
    const contributionDataArr = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));

    return {
      platform: "codeforces",
      username: user.handle,
      displayName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.handle,
      rating: user.rating || 0,
      maxRating: user.maxRating || 0,
      rank: user.rank || null,
      totalSolved: solvedProblems.size,
      contestsParticipated,
      contestRating: user.rating || 0,
      country: user.country,
      contributionGraphHtml,
      contributionData: contributionDataArr,
      // Codeforces doesn't provide difficulty breakdown easily, mock it
      easySolved: Math.floor(solvedProblems.size * 0.4),
      mediumSolved: Math.floor(solvedProblems.size * 0.4), 
      hardSolved: Math.floor(solvedProblems.size * 0.2),
      activeDays: Math.min(solvedProblems.size * 2, 365), // Rough estimate
    };
  } catch (error) {
    console.error("Codeforces API error:", error);
    throw error;
  }
}

function generateCodeforcesCalendarSVG(totalSolved, contests) {
  return `
    <div class="codeforces-calendar" style="background: white; padding: 16px; border-radius: 8px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
        <span><strong>${totalSolved}</strong> problems solved</span>
        <span>Contests: <strong>${contests}</strong></span>
        <div>Current: 2024</div>
      </div>
      <div style="background: #f5f5f5; height: 80px; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #666;">
        Codeforces Activity Timeline
      </div>
    </div>
  `;
}

// --- GeeksForGeeks --------------------------------------------------------
async function gfgStats(profileUrl) {
  // Derive username reliably: segment after /user/<username>
  let username = null;
  const m = profileUrl.match(/\/user\/([^/]+)/);
  if (m) {
    username = m[1];
  } else {
    // fallback: take the segment before first slash after domain that is not 'practice'
    const parts = profileUrl.replace(/https?:\/\//, '').split('/').filter(Boolean);
    username = parts[parts.indexOf('user') + 1] || parts[parts.length - 1];
    if (username === 'practice' && parts.length >= 2) {
      username = parts[parts.length - 2];
    }
  }
  username = username?.replace(/[^A-Za-z0-9_]/g, '') || 'unknown';

  // GeeksForGeeks website renders the profile data dynamically with JavaScript
  // Always use Puppeteer for reliable data extraction
  console.log(`Scraping GFG profile for ${username} using headless browser...`);
  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.launch({ 
    headless: "new", 
    args: [
      "--no-sandbox", 
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas"
    ]
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.setViewport({ width: 1366, height: 768 });
    
    // Navigate to the profile URL with a longer timeout for GFG's slow loading
    console.log(`Navigating to ${profileUrl}`);
    await page.goto(profileUrl, { waitUntil: "networkidle2", timeout: 60000 });
    
    // Wait for profile content to load with multiple fallback selectors
    console.log('Waiting for profile content to load...');
    try {
      await page.waitForSelector('body', {timeout: 10000});
      // Wait additional time for dynamic content to load
      await page.waitForTimeout(5000);
    } catch (e) {
      console.log('Timeout waiting for selectors, proceeding with extraction...');
    }
    
    // Comprehensive selector extraction - capturing all data for portfolio
    const userData = await page.evaluate(() => {
      // Helper function to safely extract text from elements
      const extractText = (selectors, defaultValue = null) => {
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent) {
            return element.textContent.trim();
          }
        }
        return defaultValue;
      };
      
      // Helper function to safely extract numbers from elements
      const extractNumber = (selectors, defaultValue = null) => {
        const text = extractText(selectors);
        if (!text) return defaultValue;
        
        const match = text.match(/[\d,]+/);
        if (match) {
          return parseInt(match[0].replace(/,/g, ''));
        }
        return defaultValue;
      };
      
      // Extract username from page content - Based on actual GFG profile structure
      const displayName = (() => {
        const fullText = document.body?.textContent || '';
        
        // Try to extract from URL or page title first
        const url = window.location.href;
        const urlMatch = url.match(/\/user\/([^\/]+)/);
        if (urlMatch) {
          return urlMatch[1];
        }
        
        // Fallback to document title parsing
        if (document.title && !document.title.includes('GeeksforGeeks')) {
          const titleParts = document.title.split(' - ');
          if (titleParts.length > 0) {
            return titleParts[0].trim();
          }
        }
        
        // Last resort - try to find any username-like text
        const usernamePattern = /[a-zA-Z0-9_]{3,20}/;
        const match = fullText.match(usernamePattern);
        return match ? match[0] : 'Unknown User';
      })();
      
      // Extract current streak (visible in the page as "STREAK 347/1474 days")
      const currentStreak = (() => {
        const fullText = document.body?.textContent || '';
        // Handle both "STREAK 347/1474 days" and "STREAK347/1474days" formats
        const streakMatch = fullText.match(/STREAK\s*(\d+)\/\d+\s*days/i);
        return streakMatch ? parseInt(streakMatch[1]) : 0;
      })();
      
      // Extract institution info if available
      const institution = (() => {
        const fullText = document.body?.textContent || '';
        // Look for institution text more carefully
        const instMatch = fullText.match(/Institution\s*([^Rank]{10,100}?)(?:Rank|Language|$)/);
        if (instMatch) {
          return instMatch[1].trim().replace(/[^\w\s()-]/g, '').substring(0, 100);
        }
        
        // Look for college/university names in links
        const collegeLinks = document.querySelectorAll('a[href*="/colleges/"]');
        if (collegeLinks.length > 0) {
          return collegeLinks[0].textContent.trim();
        }
        
        return '';
      })();
      
      // Extract ranking info ("1 Rank" visible in the profile)
      const collegeRank = (() => {
        const fullText = document.body?.textContent || '';
        const rankMatch = fullText.match(/(\d+)\s*Rank/);
        return rankMatch ? parseInt(rankMatch[1]) : null;
      })();
      
      // Extract languages used
      const languagesUsed = (() => {
        const fullText = document.body?.textContent || '';
        const langMatch = fullText.match(/Language Used\s*([^Coding]+)/);
        return langMatch ? langMatch[1].trim().replace(/[^\w\s,+]/g, '') : '';
      })();
      
      // Extract coding score (visible as "Coding Score 9480")  
      const codingScore = (() => {
        const fullText = document.body?.textContent || '';
        // Handle both "Coding Score 9480" and "Coding Score9480" formats
        const scoreMatch = fullText.match(/Coding Score\s*(\d+)/i);
        return scoreMatch ? parseInt(scoreMatch[1]) : null;
      })();
      
      // Extract total problems solved (visible as "Problem Solved 3386")
      const practiceProblems = (() => {
        const fullText = document.body?.textContent || '';
        // Handle both "Problem Solved 3386" and "Problem Solved3386" formats
        const problemMatch = fullText.match(/Problem Solved\s*(\d+)/i);
        return problemMatch ? parseInt(problemMatch[1]) : null;
      })();
      
      // Extract contest rating if available
      const contestRating = (() => {
        const fullText = document.body?.textContent || '';
        const ratingMatch = fullText.match(/Contest Rating\s*(\d+)/i);
        return ratingMatch ? parseInt(ratingMatch[1]) : null;
      })();
      
      // Extract difficulty breakdown from the HTML content
      // Looking for patterns like "SCHOOL (2) BASIC (502) EASY (1443) MEDIUM (1215) HARD (224)"
      const difficultyBreakdown = (() => {
        const fullText = document.body?.textContent || '';
        // Handle spacing variations in difficulty breakdown
        const schoolMatch = fullText.match(/SCHOOL\s*\((\d+)\)/i);
        const basicMatch = fullText.match(/BASIC\s*\((\d+)\)/i);
        const easyMatch = fullText.match(/EASY\s*\((\d+)\)/i);
        const mediumMatch = fullText.match(/MEDIUM\s*\((\d+)\)/i);
        const hardMatch = fullText.match(/HARD\s*\((\d+)\)/i);
        
        return {
          school: schoolMatch ? parseInt(schoolMatch[1]) : 0,
          basic: basicMatch ? parseInt(basicMatch[1]) : 0,
          easy: easyMatch ? parseInt(easyMatch[1]) : 0,
          medium: mediumMatch ? parseInt(mediumMatch[1]) : 0,
          hard: hardMatch ? parseInt(hardMatch[1]) : 0
        };
      })();
      
      // Extract submissions in current year (visible as "708 submissions in current year")
      const yearlySubmissions = (() => {
        const fullText = document.body?.textContent || '';
        const submissionMatch = fullText.match(/(\d+)\s+submissions in current year/i);
        return submissionMatch ? parseInt(submissionMatch[1]) : 0;
      })();
      
      // Extract contribution graph if available
      const contributionGraph = document.querySelector('.contribution-graph, .profile-graph, svg.calendar-graph');
      const contributionGraphHtml = contributionGraph?.outerHTML || null;
      
      // Generate monthly activity data based on current year submissions and streak
      const monthlyActivity = (() => {
        const activity = {};
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        
        // Create daily activity for the past year
        const dailyActivity = {};
        const today = new Date();
        
        if (yearlySubmissions > 0 && currentStreak > 0) {
          // Generate activity for the past 365 days
          for (let i = 0; i < 365; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().slice(0, 10);
            
            // Higher activity during streak period
            if (i < currentStreak) {
              dailyActivity[dateStr] = Math.floor(Math.random() * 5) + 1; // 1-5 activities per day
            } else if (Math.random() < 0.3) { // 30% chance of activity outside streak
              dailyActivity[dateStr] = Math.floor(Math.random() * 3) + 1; // 1-3 activities
            } else {
              dailyActivity[dateStr] = 0;
            }
          }
          
          // Calculate monthly aggregates
          Object.keys(dailyActivity).forEach(date => {
            const month = date.slice(0, 7); // YYYY-MM format
            if (!activity[month]) activity[month] = 0;
            activity[month] += dailyActivity[date];
          });
        }
        
        return { daily: dailyActivity, monthly: activity };
      })();
      
      // Build comprehensive stats object using extracted data
      const stats = {
        displayName: displayName || 'Unknown User',
        practiceProblems: practiceProblems || 0,
        codingScore: codingScore || 0,
        monthlyRank: collegeRank || null,
        overallRank: null, // Not clearly visible in current format
        streak: currentStreak || 0,
        institution: institution || '',
        languagesUsed: languagesUsed || '',
        yearlySubmissions: yearlySubmissions || 0,
        contestsParticipated: 0, // Not visible in current format
        contestRating: contestRating || null,
        
        // Enhanced difficulty breakdown using extracted data
        schoolProblems: difficultyBreakdown.school,
        basicProblems: difficultyBreakdown.basic, 
        easyProblems: difficultyBreakdown.easy,
        mediumProblems: difficultyBreakdown.medium,
        hardProblems: difficultyBreakdown.hard,
        
        // Legacy fields for backward compatibility
        totalSolved: practiceProblems || 0,
        easySolved: difficultyBreakdown.easy || 0,
        mediumSolved: difficultyBreakdown.medium || 0, 
        hardSolved: difficultyBreakdown.hard || 0,
        activeDays: Math.min(currentStreak || 0, 365),
        
        // Activity and contribution data
        monthlyActivity: monthlyActivity.monthly,
        dailyActivity: monthlyActivity.daily,
        contributionGraphHtml: contributionGraphHtml,
        
        // Debug information
        debugInfo: {
          fullText: document.body?.textContent?.substring(0, 2000) || '',
          title: document.title,
          url: window.location.href,
          extractedData: {
            streakText: document.body?.textContent?.match(/STREAK[^0-9]*\d+[^0-9]*\d+[^0-9]*days/i)?.[0],
            codingScoreText: document.body?.textContent?.match(/Coding Score[^0-9]*\d+/i)?.[0],
            problemsSolvedText: document.body?.textContent?.match(/Problem Solved[^0-9]*\d+/i)?.[0],
            difficultyText: document.body?.textContent?.match(/SCHOOL[^0-9]*\(\d+\)[^0-9]*BASIC[^0-9]*\(\d+\)[^0-9]*EASY[^0-9]*\(\d+\)[^0-9]*MEDIUM[^0-9]*\(\d+\)[^0-9]*HARD[^0-9]*\(\d+\)/i)?.[0],
            yearlySubmissionsText: document.body?.textContent?.match(/\d+\s+submissions in current year/i)?.[0],
            languageText: document.body?.textContent?.match(/Language Used[^C]*?(?=Coding|$)/i)?.[0],
            institutionText: document.body?.textContent?.match(/Institution[^R]*?(?=Rank|$)/i)?.[0]
          },
          // Additional debug info
          parsedValues: {
            streakParsed: currentStreak,
            codingScoreParsed: codingScore,
            problemsParsed: practiceProblems,
            difficultyParsed: difficultyBreakdown,
            yearlySubmissionsParsed: yearlySubmissions
          }
        }
      };
      
      return stats;
    });
    
    console.log("GFG profile data extracted successfully:", {
      username,
      displayName: userData.displayName,
      practiceProblems: userData.practiceProblems,
      codingScore: userData.codingScore,
      totalSolved: userData.totalSolved,
      breakdown: {
        school: userData.schoolProblems,
        basic: userData.basicProblems,
        easy: userData.easyProblems,
        medium: userData.mediumProblems,
        hard: userData.hardProblems
      },
      streak: userData.streak,
      institution: userData.institution,
      yearlySubmissions: userData.yearlySubmissions,
      contestRating: userData.contestRating,
      extractedTexts: userData.debugInfo?.extractedData
    });
    
    // Generate activity calendar data using daily activity
    const contributionDataArr = [];
    if (userData.dailyActivity) {
      Object.entries(userData.dailyActivity).forEach(([date, count]) => {
        contributionDataArr.push({ date, count });
      });
    }
    
    // Return comprehensive GFG stats matching database schema
    return {
      platform: "gfg",
      username,
      displayName: userData.displayName || username,
      practiceProblems: userData.practiceProblems || 0,
      codingScore: userData.codingScore || 0,
      monthlyRank: userData.monthlyRank,
      overallRank: userData.overallRank,
      streak: userData.streak || 0,
      institution: userData.institution || '',
      languagesUsed: userData.languagesUsed || '',
      yearlySubmissions: userData.yearlySubmissions || 0,
      contestsParticipated: userData.contestsParticipated || 0,
      contestRating: userData.contestRating,
      totalSolved: userData.totalSolved || 0,
      // Enhanced difficulty breakdown
      schoolProblems: userData.schoolProblems || 0,
      basicProblems: userData.basicProblems || 0,
      easyProblems: userData.easyProblems || 0,
      mediumProblems: userData.mediumProblems || 0,
      hardProblems: userData.hardProblems || 0,
      // Legacy fields for compatibility
      easySolved: userData.easyProblems || 0,
      mediumSolved: userData.mediumProblems || 0,
      hardSolved: userData.hardProblems || 0,
      activeDays: userData.activeDays || 0,
      // Activity data for heatmap
      contributionGraphHtml: userData.contributionGraphHtml || generateGFGCalendarSVG(userData.totalSolved || 0, userData.streak || 0, userData.dailyActivity || {}),
      monthlyActivity: userData.monthlyActivity || {},
      dailyActivity: userData.dailyActivity || {},
      contributionData: contributionDataArr,
      debugInfo: userData.debugInfo || {}
    };
  } catch (error) {
    console.error("Error scraping GFG profile:", error);
    // In case of error, return minimal data with just username
    return {
      platform: "gfg",
      username,
      displayName: username,
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

function generateGFGCalendarSVG(totalSolved, streak, dailyActivity = {}) {
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  
  // Generate activity grid similar to GitHub
  let gridHtml = '';
  let currentDate = new Date(oneYearAgo);
  let weekIndex = 0;
  let dayIndex = 0;
  
  while (currentDate <= today) {
    const dateStr = currentDate.toISOString().slice(0, 10);
    const activity = dailyActivity[dateStr] || 0;
    
    // Determine color intensity based on activity
    let fillColor = '#ebedf0'; // No activity
    if (activity > 0) {
      if (activity >= 4) fillColor = '#196f3d'; // High activity
      else if (activity >= 3) fillColor = '#27ae60'; // Medium-high
      else if (activity >= 2) fillColor = '#58d68d'; // Medium
      else fillColor = '#abebc6'; // Low activity
    }
    
    gridHtml += `<rect x="${weekIndex * 11}" y="${dayIndex * 11}" width="10" height="10" fill="${fillColor}" stroke="#fff" stroke-width="1" data-date="${dateStr}" data-count="${activity}" rx="2"/>`;
    
    currentDate.setDate(currentDate.getDate() + 1);
    dayIndex++;
    
    // Start new week (7 days)
    if (dayIndex >= 7) {
      dayIndex = 0;
      weekIndex++;
    }
  }
  
  return `
    <div class="gfg-calendar" style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e1e4e8;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 14px; color: #586069;">
        <div>
          <span style="font-weight: 600; color: #24292e;">${totalSolved}</span> problems solved in the last year
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>Current streak: <strong style="color: #28a745;">${streak}</strong> days</span>
          <div style="display: flex; align-items: center; gap: 4px; font-size: 11px;">
            <span>Less</span>
            <rect width="10" height="10" fill="#ebedf0" rx="2" style="margin: 0 2px;"></rect>
            <rect width="10" height="10" fill="#abebc6" rx="2" style="margin: 0 2px;"></rect>
            <rect width="10" height="10" fill="#58d68d" rx="2" style="margin: 0 2px;"></rect>
            <rect width="10" height="10" fill="#27ae60" rx="2" style="margin: 0 2px;"></rect>
            <rect width="10" height="10" fill="#196f3d" rx="2" style="margin: 0 2px;"></rect>
            <span>More</span>
          </div>
        </div>
      </div>
      <svg width="${weekIndex * 11 + 10}" height="77" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
        <g transform="translate(0, 0)">
          ${gridHtml}
        </g>
        <g transform="translate(0, 0)" style="font-size: 10px; fill: #586069;">
          <text x="0" y="22" class="month">Jan</text>
          <text x="${Math.floor(weekIndex/12) * 11}" y="22" class="month">Mar</text>
          <text x="${Math.floor(weekIndex/6) * 11}" y="22" class="month">Jun</text>
          <text x="${Math.floor(weekIndex*3/4) * 11}" y="22" class="month">Sep</text>
          <text x="${weekIndex * 11 - 20}" y="22" class="month">Dec</text>
        </g>
      </svg>
    </div>
  `;
}

function generateMonthLabels() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map((month, i) => 
    `<text x="${14 + (i * 56)}" y="12" font-size="10" fill="#656d76">${month}</text>`
  ).join('');
}

function generateActivitySquares(totalSolved) {
  let squares = '';
  let x = 14, y = 20;
  const currentDate = new Date(2024, 0, 1);
  const endDate = new Date(2024, 11, 31);
  
  while (currentDate <= endDate) {
    // Simulate activity based on total solved (more solved = more active days)
    const activity = Math.random() < (totalSolved / 500) ? Math.floor(Math.random() * 4) + 1 : 0;
    
    let fillColor = '#ebedf0'; // Default gray
    if (activity > 0) {
      if (activity >= 4) fillColor = '#196127'; // Dark green
      else if (activity >= 3) fillColor = '#239a3b'; // Medium green  
      else if (activity >= 2) fillColor = '#7bc96f'; // Light green
      else fillColor = '#c6e48b'; // Very light green
    }
    
    squares += `<rect x="${x}" y="${y}" width="10" height="10" fill="${fillColor}" rx="2"></rect>`;
    
    y += 12;
    if (currentDate.getDay() === 6) { // Saturday, move to next column
      x += 12;
      y = 20;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return squares;
}

// --- CodeChef (scrape) ----------------------------------------------------
async function codechefStats(profileUrl) {
  const username = profileUrl.split("/").pop();
  try {
    const { data: html } = await axios.get(`https://www.codechef.com/users/${username}`, {
      headers: { "User-Agent": UA },
    });
    const $ = cheerio.load(html);
    const displayName = $("header h2").text().trim() || username;
    const rating = $(".rating-number").first().text().trim();
    
    // Extract problem counts
    const problemsFullySolved = $(".problems-solved .content").text().match(/(\d+)/);
    const totalSolved = problemsFullySolved ? parseInt(problemsFullySolved[1]) : 0;
    
    // Extract contest participation
    const contestCount = $(".contest-participated-count").text().match(/(\d+)/);
    const contestsParticipated = contestCount ? parseInt(contestCount[1]) : 0;
    
    return {
      platform: "codechef",
      username,
      displayName,
      rating: parseInt(rating) || 0,
      totalSolved,
      contestsParticipated,
      contestRating: parseInt(rating) || 0,
      // Estimate difficulty breakdown
      easySolved: Math.floor(totalSolved * 0.4),
      mediumSolved: Math.floor(totalSolved * 0.4),
      hardSolved: Math.floor(totalSolved * 0.2),
      activeDays: Math.min(totalSolved * 2, 365),
    };
  } catch (err) {
    // puppeteer fallback
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.goto(`https://www.codechef.com/users/${username}`, { waitUntil: "networkidle2", timeout: 30000 });
    
    const data = await page.evaluate(() => {
      const displayName = document.querySelector("header h2")?.textContent?.trim() || '';
      const rating = document.querySelector(".rating-number")?.textContent?.trim() || '0';
      const problemsText = document.querySelector(".problems-solved .content")?.textContent || '';
      const problemsMatch = problemsText.match(/(\d+)/);
      const totalSolved = problemsMatch ? parseInt(problemsMatch[1]) : 0;
      
      return { displayName, rating: parseInt(rating) || 0, totalSolved };
    });
    
    // Extract contribution calendar
    const ccCalendar = await page.evaluate(() => {
      const calendarData = [];
      document.querySelectorAll('.rating-calendar-day').forEach(day => {
        const date = day.getAttribute('data-date');
        const count = parseInt(day.getAttribute('data-submissions') || day.querySelector('.submission-count')?.textContent || '0');
        if (date) calendarData.push({ date, count });
      });
      return calendarData;
    });
    
    await browser.close();
    return { 
      platform: "codechef", 
      username, 
      displayName: data.displayName || username, 
      rating: data.rating,
      totalSolved: data.totalSolved,
      contestRating: data.rating,
      easySolved: Math.floor(data.totalSolved * 0.4),
      mediumSolved: Math.floor(data.totalSolved * 0.4),
      hardSolved: Math.floor(data.totalSolved * 0.2),
      activeDays: Math.min(data.totalSolved * 2, 365),
      contributionData: ccCalendar,
    };
  }
}

// --- HackerRank -----------------------------------------------------------
async function hackerRankStats(profileUrl) {
  const username = profileUrl.split("/").filter(Boolean).pop();
  try {
    const { data } = await axios.get(
      `https://www.hackerrank.com/rest/hackers/${username}/profile`,
      { headers: { "User-Agent": UA } }
    );
    if (!data.model) throw new Error("User not found");
    
    const user = data.model;
    return {
      platform: "hackerrank",
      username: user.username,
      displayName: user.name || user.username,
      country: user.country || null,
      followers: user.followings_count,
      score: user.score || 0,
      totalSolved: user.solved_challenges || 0,
      contestsParticipated: user.contests_participated || 0,
      // Estimate other metrics
      easySolved: Math.floor((user.solved_challenges || 0) * 0.5),
      mediumSolved: Math.floor((user.solved_challenges || 0) * 0.3),
      hardSolved: Math.floor((user.solved_challenges || 0) * 0.2),
      activeDays: Math.min((user.solved_challenges || 0) * 1.5, 365),
      contributionData: [], // HackerRank has no public calendar
    };
  } catch (err) {
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.goto(profileUrl, { waitUntil: "networkidle2", timeout: 30000 });
    
    const data = await page.evaluate(() => {
      let displayName = null;
      const selectors = [
        '.profile-user-name',
        '.profile-heading__title',
        '.profile-heading',
        '.name',
        '.profile-name',
        '.profile-card h1',
        'h1'
      ];
      for (const sel of selectors) {
        try {
          const elem = document.querySelector(sel);
          if (elem && elem.textContent) {
            displayName = elem.textContent.trim();
            break;
          }
        } catch {}
      }
      
      // Try to extract solved challenges count
      const solvedText = document.querySelector('.solved-challenges, .challenges-solved')?.textContent || '0';
      const solvedMatch = solvedText.match(/(\d+)/);
      const totalSolved = solvedMatch ? parseInt(solvedMatch[1]) : 0;
      
      return { displayName, totalSolved };
    });
    
    await browser.close();
    return { 
      platform: "hackerrank", 
      username, 
      displayName: data.displayName || username,
      totalSolved: data.totalSolved,
      score: data.totalSolved * 10, // Rough estimate
      easySolved: Math.floor(data.totalSolved * 0.5),
      mediumSolved: Math.floor(data.totalSolved * 0.3),
      hardSolved: Math.floor(data.totalSolved * 0.2),
      activeDays: Math.min(data.totalSolved * 1.5, 365),
      contributionData: [], // HackerRank has no public calendar
    };
  }
}

// External dynamic scrapers removed

// Export individual platform functions
export { gfgStats };

export async function getPlatformStats(platformId, profileUrl) {
  // External dynamic scrapers removed; use built-in implementations below

  // Legacy in-file implementations
  switch (platformId) {
    case 'leetcode':
      return await leetCodeStats(profileUrl);
    case 'codeforces':
      return await codeforcesStats(profileUrl);
    case 'gfg':
      return await gfgStats(profileUrl);
    case 'codechef':
      return await codechefStats(profileUrl);
    case 'hackerrank':
      return await hackerRankStats(profileUrl);
    default:
      throw new Error('Unsupported platform');
  }
} 