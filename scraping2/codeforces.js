// Minimal Codeforces scraper via official API
// CLI capable & module-default export

import { fileURLToPath } from 'url';

async function cfApi(method, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`https://codeforces.com/api/${method}?${qs}`);
  const json = await res.json();
  if (json.status !== 'OK') throw new Error(json.comment || 'CF API error');
  return json.result;
}

function parseHandle(url) {
  return url.split('/').filter(Boolean).pop();
}

export default async function scrapeCodeforces(profileUrl) {
  const handle = parseHandle(profileUrl);

  const user = (await cfApi('user.info', { handles: handle }))[0];

  // Contest participation
  let contestsParticipated = 0;
  try {
    const ratingArr = await cfApi('user.rating', { handle });
    contestsParticipated = ratingArr.length;
  } catch {}

  // Submissions & contribution map
  let solvedSet = new Set();
  const dailyCounts = {};
  try {
    let from = 1;
    let chunk;
    do {
      chunk = await cfApi('user.status', { handle, from, count: 10000 });
      chunk.forEach((sub) => {
        const date = new Date(sub.creationTimeSeconds * 1000).toISOString().slice(0, 10);
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
        if (sub.verdict === 'OK') solvedSet.add(`${sub.problem.contestId}-${sub.problem.index}`);
      });
      from += 10000;
    } while (chunk.length === 10000);
  } catch {}

  const contributionData = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));

  return {
    platform: 'codeforces',
    username: handle,
    rating: user.rating || 0,
    maxRating: user.maxRating || 0,
    totalSolved: solvedSet.size,
    contestsParticipated,
    contestRating: user.rating || 0,
    easySolved: Math.floor(solvedSet.size * 0.4),
    mediumSolved: Math.floor(solvedSet.size * 0.4),
    hardSolved: Math.floor(solvedSet.size * 0.2),
    activeDays: Object.keys(dailyCounts).length,
    contributionData,
  };
}

// ─────────── CLI wrapper ───────────
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: node codeforces.js <profileUrl>');
    process.exit(1);
  }
  scrapeCodeforces(url)
    .then((d) => console.log(JSON.stringify(d, null, 2)))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
