import fetch from 'node-fetch';

async function fetchLeetCodeData(query, variables) {
  const url = "https://leetcode.com/graphql";
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

async function fetchLeetCodeStats(username) {
  // --- 1. Fetch Profile & Badges ---
  const profileQuery = `
  query userPublicProfile($username: String!) {
    matchedUser(username: $username) {
      profile {
        realName
      }
      badges {
        displayName
      }
    }
  }`;

  console.log("\n--- PROFILE & BADGES ---");
  const profileData = await fetchLeetCodeData(profileQuery, { username });
  if (profileData?.data?.matchedUser) {
    const userProfile = profileData.data.matchedUser;
    if (userProfile.profile.realName && userProfile.profile.realName !== "") {
      console.log(`- Name: ${userProfile.profile.realName}`);
    }
    userProfile.badges.forEach(badge => console.log(`- Badge: ${badge.displayName}`));
  }

  // --- 2. Fetch Overall Stats (Total & Difficulty) ---
  const statsQuery = `
  query userProblemsSolved($username: String!) {
    matchedUser(username: $username) {
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }
  }`;

  console.log("--- OVERALL STATS ---");
  const statsData = await fetchLeetCodeData(statsQuery, { username });
  if (statsData?.data?.matchedUser) {
    const stats = statsData.data.matchedUser.submitStatsGlobal.acSubmissionNum;
    stats.forEach(stat => {
      console.log(`- ${stat.difficulty} Solved: ${stat.count}`);
    });
  }

  // --- 3. Fetch Contest Stats ---
  const contestQuery = `
  query userContestRankingInfo($username: String!) {
    userContestRanking(username: $username) {
      attendedContestsCount
      rating
      globalRanking
    }
  }`;

  console.log("\n--- CONTEST STATS ---");
  const contestData = await fetchLeetCodeData(contestQuery, { username });
  if (contestData?.data?.userContestRanking) {
    const ranking = contestData.data.userContestRanking;
    console.log(`- Contests Attended: ${ranking.attendedContestsCount}`);
    console.log(`- Rating: ${Math.round(ranking.rating)}`);
  }

  // --- 4. Fetch COMPLETE Submission History (All Years) ---
  console.log("\n--- COMPLETE SUBMISSION HISTORY (HEATMAP) ---");

  const activeYearsQuery = `query userCalendar($username: String!) { matchedUser(username: $username) { userCalendar { activeYears } } }`;
  const yearsData = await fetchLeetCodeData(activeYearsQuery, { username });
  const activeYears = yearsData?.data?.matchedUser?.userCalendar?.activeYears;

  const allSubmissions = {};
  if (activeYears && activeYears.length > 0) {
    console.log(`Fetching submission data for years: ${activeYears.join(', ')}`);

    const submissionCalendarQuery = `query userCalendar($username: String!, $year: Int) { matchedUser(username: $username) { userCalendar(year: $year) { submissionCalendar } } }`;
    const promises = activeYears.map(year => fetchLeetCodeData(submissionCalendarQuery, { username, year }));
    const results = await Promise.all(promises);

    for (const result of results) {
      const calendarString = result?.data?.matchedUser?.userCalendar?.submissionCalendar;
      if (calendarString) {
        Object.assign(allSubmissions, JSON.parse(calendarString));
      }
    }

    const sortedTimestamps = Object.keys(allSubmissions).sort();
    for (const timestamp of sortedTimestamps) {
      const date = new Date(timestamp * 1000).toISOString().split('T')[0];
      const count = allSubmissions[timestamp];
      console.log(`- ${date}: ${count} submissions`);
    }
  } else {
    console.log("Could not find submission history.");
  }

  // --- 5. WEEKLY SUBMISSIONS (Sunday to Today) ---
  console.log("\n--- WEEKLY SUBMISSIONS DETAILS (Sunday to Today) ---");

  const now = new Date();
  const todayDay = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - todayDay);
  sunday.setHours(0, 0, 0, 0);

  const weeklyQuery = `
    query recentAcSubmissions($username: String!) {
      recentAcSubmissionList(username: $username, limit: 50) {
        id
        title
        titleSlug
        timestamp
      }
    }`;

  const weeklyData = await fetchLeetCodeData(weeklyQuery, { username });

  if (weeklyData?.data?.recentAcSubmissionList?.length > 0) {
    const filtered = weeklyData.data.recentAcSubmissionList.filter(sub => {
      const date = new Date(parseInt(sub.timestamp) * 1000);
      return date >= sunday && date <= now;
    });

    if (filtered.length === 0) {
      console.log("- No questions solved this week.");
    } else {
      filtered.forEach(sub => {
        const date = new Date(parseInt(sub.timestamp) * 1000).toISOString().split('T')[0];
        console.log(`- ${date}: ${sub.title} (https://leetcode.com/problems/${sub.titleSlug}/)`);
      });
    }
  } else {
    console.log("- Unable to fetch recent submissions.");
  }

  // --- ✅ 6. CURRENT DAY HEATMAP SUBMISSIONS ---
  console.log("\n📆 CURRENT DAY HEATMAP SUBMISSIONS:");
  const todayDate = new Date().toISOString().split("T")[0];

  let todayCount = 0;
  for (const [timestamp, count] of Object.entries(allSubmissions)) {
    const date = new Date(parseInt(timestamp) * 1000).toISOString().split("T")[0];
    if (date === todayDate) {
      todayCount += count;
    }
  }

  return {
    profile: profileData?.data?.matchedUser,
    stats: statsData?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum,
    contestStats: contestData?.data?.userContestRanking,
    heatmapData: allSubmissions,
    weeklySubmissions: weeklyData?.data?.recentAcSubmissionList,
    todaySubmissions: todayCount
  };
}

export { fetchLeetCodeStats };

