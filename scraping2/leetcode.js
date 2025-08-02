

function extractUsername(profileUrl) {
  const parts = profileUrl.replace(/\/$/, "").split("/");
  let u = parts.pop();
  if (u === "u") u = parts.pop();
  return u.toLowerCase();
}

async function fetchLeetCodeData(query, variables) {
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error("LeetCode request failed " + res.status);
  return res.json();
}

export default async function scrapeLeetCode(profileUrl) {
  const username = extractUsername(profileUrl);

  /* ---------- Overall solved ---------- */
  const statsQuery = `query($username:String!){matchedUser(username:$username){submitStatsGlobal{acSubmissionNum{difficulty count}}}}`;
  const statsData = await fetchLeetCodeData(statsQuery, { username });
  const acArr = statsData?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum || [];
  let easy = 0, medium = 0, hard = 0;
  acArr.forEach((d) => {
    if (d.difficulty === "Easy") easy = d.count;
    if (d.difficulty === "Medium") medium = d.count;
    if (d.difficulty === "Hard") hard = d.count;
  });
  const totalSolved = easy + medium + hard;

  /* ---------- Contest stats ---------- */
  const contestQ = `query($username:String!){userContestRanking(username:$username){attendedContestsCount rating}}`;
  const contestData = await fetchLeetCodeData(contestQ, { username });
  const contests = contestData?.data?.userContestRanking?.attendedContestsCount || 0;
  const rating = Math.round(contestData?.data?.userContestRanking?.rating || 0);

  /* ---------- Submission calendar ---------- */
  const calQ = `query($username:String!){matchedUser(username:$username){userCalendar{submissionCalendar}}}`;
  const calData = await fetchLeetCodeData(calQ, { username });
  const calStr = calData?.data?.matchedUser?.userCalendar?.submissionCalendar || "{}";
  const calObj = JSON.parse(calStr);
  const today = new Date().toISOString().slice(0,10);
  const todayCount = Object.entries(calObj).reduce((n,[ts,c])=>{
    return new Date(ts*1000).toISOString().slice(0,10)===today ? n+parseInt(c) : n;},0);
  const contributionData = Object.entries(calObj).map(([ts,c])=>({date:new Date(ts*1000).toISOString().slice(0,10),count:c}));

  /* ---------- Build object ---------- */
  return {
    platform: "leetcode",
    username,
    displayName: username,
    totalSolved,
    easySolved: easy,
    mediumSolved: medium,
    hardSolved: hard,
    contestsParticipated: contests,
    rating,
    contestRating: rating,
    contributionData,
    todayCount: todayCount,
    badges: [],
  };
}

/* CLI usage: node scraping2/leetcode.js <profileUrl> */
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: node leetcode.js <profileUrl>");
    process.exit(1);
  }
  scrapeLeetCode(url)
    .then((s) => console.log(JSON.stringify(s,null,2)))
    .catch((e) => {console.error(e);process.exit(1);});
}
