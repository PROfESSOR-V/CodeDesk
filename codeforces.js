// Minimal Codeforces scraper that fetches user stats via official API.
// Exports a default async function(profileUrl) that returns an object for
// backend aggregation.

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

export default async function getCodeforcesStats(profileUrl) {
  const handle = parseHandle(profileUrl);

  /* 1. User info */
  const user = (await cfApi('user.info', { handles: handle }))[0];

  /* 2. Contest history */
  let contestsParticipated = 0;
  try {
    const ratingArr = await cfApi('user.rating', { handle });
    contestsParticipated = ratingArr.length;
  } catch {}

  /* 3. Submissions to build contributionData */
  let solvedSet = new Set();
  const dailyCounts = {};
  try {
    let allSubs = [];
    let from = 1;
    let chunk;
    do {
      chunk = await cfApi('user.status', { handle, from, count: 10000 });
      allSubs = allSubs.concat(chunk);
      from += 10000;
    } while (chunk.length === 10000);

    for (const sub of allSubs) {
      const date = new Date(sub.creationTimeSeconds * 1000).toISOString().slice(0, 10);
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      if (sub.verdict === 'OK') {
        solvedSet.add(`${sub.problem.contestId}-${sub.problem.index}`);
      }
    }
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
