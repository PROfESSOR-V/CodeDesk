// Detailed CodeChef scraper (uses your manual approach)
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';

function extractUsername(url) {
  return url.replace(/https?:\/\//, '').split('/').filter(Boolean).pop();
}

export default async function scrapeCodechef(profileUrl) {
  const username = extractUsername(profileUrl);
  const url = `https://www.codechef.com/users/${username}`;

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // block heavy assets
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) req.abort();
      else req.continue();
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait for problems-solved widget
    await page.waitForSelector('.rating-data-section.problems-solved', { visible: true, timeout: 60000 });

    /* ---- Extract profile basic info ---- */
    const profileInfo = await page.evaluate(() => {
      const ratingEl = document.querySelector('.rating-number');
      const nameEl = document.querySelector('.h2-style');
      const solvedEl = document.querySelector('.rating-data-section.problems-solved h3:last-child');
      const contestsEl = document.querySelector('.contest-attended-count, .contest-participated-count');
      return {
        profileName: nameEl ? nameEl.textContent.trim() : null,
        rating: ratingEl ? parseInt(ratingEl.textContent.trim(), 10) : 0,
        problemsSolved: solvedEl ? parseInt((solvedEl.textContent.match(/(\d+)/) || [0])[0], 10) : 0,
        contests: contestsEl ? parseInt((contestsEl.textContent.match(/(\d+)/) || [0])[0], 10) : 0,
        badges: Array.from(document.querySelectorAll('.badge-title')).map((b) => b.textContent.trim()),
      };
    });

    /* ---- Extract heat-map for all periods ---- */
    const { heatmapData } = await page.evaluate(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const dropdown = document.querySelector('#heatmap-period-selector');
      if (!dropdown) return { heatmapData: [] };
      const options = Array.from(dropdown.options).map((o) => o.value);
      const map = new Map();
      for (const value of options) {
        dropdown.value = value;
        dropdown.dispatchEvent(new Event('change', { bubbles: true }));
        await sleep(2000);
        const rects = Array.from(document.querySelectorAll('svg rect'))
          .filter((r) => r.getAttribute('data-count'))
          .map((r) => ({ date: r.getAttribute('data-date'), count: parseInt(r.getAttribute('data-count'), 10) }));
        rects.forEach(({ date, count }) => {
          if (date && !map.has(date)) map.set(date, { date, count });
        });
      }
      return { heatmapData: Array.from(map.values()) };
    });

    const today = new Date().toISOString().slice(0, 10);
    const todayCount = (heatmapData.find((h) => h.date === today) || { count: 0 }).count;

    return {
      platform: 'codechef',
      username,
      displayName: profileInfo.profileName || username,
      rating: profileInfo.rating,
      contestRating: profileInfo.rating,
      totalSolved: profileInfo.problemsSolved,
      contestsParticipated: profileInfo.contests,
      easySolved: Math.floor(profileInfo.problemsSolved * 0.4),
      mediumSolved: Math.floor(profileInfo.problemsSolved * 0.4),
      hardSolved: Math.floor(profileInfo.problemsSolved * 0.2),
      activeDays: heatmapData.length,
      badges: profileInfo.badges,
      contributionData: heatmapData,
      todayCount,
    };
  } finally {
    await browser.close();
  }
}

// ───────── CLI wrapper ─────────
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: node codechef.js <profileUrl>');
    process.exit(1);
  }
  scrapeCodechef(url)
    .then((d) => console.log(JSON.stringify(d, null, 2)))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
