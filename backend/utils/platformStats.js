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
      displayName: u.profile.realName || u.username,
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
    await page.goto(profileUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    // wait for profile name element or fallback 5s
    try {
      await page.waitForSelector('.profile-realName, .profile_name, .geek-name, .userName', {timeout: 8000});
    } catch {}
    
    // Older Puppeteer versions (< v13) don't expose page.waitForTimeout
    await new Promise((res) => setTimeout(res, 2000));
    
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
      
      // Extract all possible name selectors - GFG has inconsistent UI
      const displayName = extractText([
        '.profile-realName',            // Verified new selector
        '.profile_name',                // Alternative selector
        '.profile-name-text',           // Another variation
        '.profileDetail__name',         // Another possible variation
        '.profile_head_user_name',      // Alternative possible selector
        '.userName',                    // Another alternative
        '.profile-user-name',
        '.profile-userName',
        '.rating-card-header__title',
        '.geek_username',
        'div.profile_displayName__o_g4D',
        '.profile-header-name',         // Another possible variation
        '.geek-name',                   // Older version
        'h1.username',                  // Generic possibility
        'h2.username',                  // Generic possibility
        'h3.username',                  // Generic possibility
        'h4.username',                  // Generic possibility
        'h1', 'h2', 'h3', 'h4'          // Last resort - grab any heading
      ]);
      
      // Some names may include non-breaking spaces, remove them
      const cleanDisplayName = displayName?.replace(/\u00A0/g, ' ').trim();
      
      // Fallback: use document.title when it contains '- GeeksforGeeks'
      const finalDisplayName = cleanDisplayName || (document.title.includes("GeeksforGeeks") ? document.title.split('|')[0].trim() : null);
      if (!finalDisplayName) {
        throw new Error('Display name not found with known selectors');
      }
      
      // Take screenshot of entire profile page for debugging
      const contributionGraph = document.querySelector('.contribution-graph, .profile-graph, svg.calendar-graph');
      const contributionGraphHtml = contributionGraph?.outerHTML || null;
      
      // Extract key stats for portfolio
      const stats = {
        displayName,
        practiceProblems: extractNumber([
          '.score_card_value:nth-child(1)',
          '[data-tip="Problems Solved"]',
          '.problems-solved',
          '.problems_solved',
          '.totalProblemsSolved'
        ]),
        codingScore: extractNumber([
          '.score_card_value:nth-child(2)',
          '[data-tip="Coding Score"]',
          '.coding-score',
          '.codingScore'
        ]),
        monthlyRank: extractNumber([
          '.score_card_value:nth-child(3)',
          '[data-tip="Monthly Rank"]',
          '.monthly-rank',
          '.monthlyRank'
        ]),
        overallRank: extractNumber([
          '.score_card_value:nth-child(4)',
          '[data-tip="Overall Rank"]',
          '.overall-rank',
          '.overallRank'
        ]),
        streak: extractNumber([
          '.streak-count',
          '.streakCount',
          '.current-streak'
        ]),
        // Extract contest participation if available
        contestsParticipated: extractNumber([
          '.contest-count',
          '.contests-participated',
          '[data-tip="Contests"]'
        ]) || 0,
        // Estimate difficulty breakdown (GFG doesn't provide this directly)
        totalSolved: 0, // Will be calculated
        easySolved: 0,
        mediumSolved: 0, 
        hardSolved: 0,
        activeDays: 0, // Will be estimated
        // Store the raw HTML - entire page content for verification
        rawHtml: document.documentElement.outerHTML
      };
      
      // Calculate totals and estimates
      if (stats.practiceProblems) {
        stats.totalSolved = stats.practiceProblems;
        // Rough estimates for difficulty breakdown
        stats.easySolved = Math.floor(stats.practiceProblems * 0.5);
        stats.mediumSolved = Math.floor(stats.practiceProblems * 0.35);
        stats.hardSolved = Math.floor(stats.practiceProblems * 0.15);
        // Estimate active days based on problems solved
        stats.activeDays = Math.min(Math.floor(stats.practiceProblems * 0.8), 365);
      }
      
      return {
        ...stats,
        displayName: finalDisplayName,
        contributionGraphHtml
      };
    });
    
    console.log("GFG profile data extracted:", {
      username,
      displayName: userData.displayName,
      practiceProblems: userData.practiceProblems,
      codingScore: userData.codingScore,
      contributionGraphHtml: userData.contributionGraphHtml ? "Graph HTML captured" : "No graph found"
    });
    
    // Extract contribution data
    const contributionDataArr = [];
    const gfgCalendar = await page.evaluate(() => {
      const days = document.querySelectorAll('.contribution-day');
      const data = [];
      days.forEach(day => {
        const date = day.getAttribute('data-date');
        const count = parseInt(day.getAttribute('data-count') || '0');
        if (date) data.push({date, count});
      });
      return data;
    });
    
    // Return comprehensive object with all the data
    return {
      platform: "gfg",
      username,
      displayName: userData.displayName || username,
      practiceProblems: userData.practiceProblems,
      totalSolved: userData.totalSolved || userData.practiceProblems,
      codingScore: userData.codingScore,
      monthlyRank: userData.monthlyRank,
      overallRank: userData.overallRank,
      streak: userData.streak,
      contestsParticipated: userData.contestsParticipated,
      easySolved: userData.easySolved,
      mediumSolved: userData.mediumSolved,
      hardSolved: userData.hardSolved,
      activeDays: userData.activeDays,
      contributionGraphHtml: userData.contributionGraphHtml || generateGFGCalendarSVG(userData.totalSolved || userData.practiceProblems || 0, userData.streak || 0),
      rawHtml: userData.rawHtml,
      contributionData: gfgCalendar
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

function generateGFGCalendarSVG(totalSolved, streak) {
  return `
    <div class="gfg-calendar" style="background: white; padding: 16px; border-radius: 8px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
        <span><strong>${totalSolved}</strong> problems solved</span>
        <span>Streak: <strong>${streak}</strong></span>
        <div>Current: 2024</div>
      </div>
      <svg width="700" height="104" style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif;">
        ${generateMonthLabels()}
        ${generateActivitySquares(totalSolved)}
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