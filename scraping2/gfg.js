// Comprehensive GeeksforGeeks scraper (adapted from your standalone script)
// Provides: profile name, total solved, difficulty breakdown, full heat-map & today count.
// Exports default async function(profileUrl) returning a stats object, **and** supports CLI usage.

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';

function extractUsername(url) {
  const m = url.match(/\/user\/([^/]+)/);
  if (m) return m[1];
  return url.replace(/https?:\/\//, '').split('/').filter(Boolean).pop();
}

export default async function scrapeGfg(profileUrl) {
  const username = extractUsername(profileUrl);
  const url = `https://www.geeksforgeeks.org/user/${username}`;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // Block images/fonts to speed up
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) req.abort();
      else req.continue();
    });

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for heat-map cells (rect) to appear
    await page.waitForSelector('rect[style*="fill"]', { timeout: 50000 });

    /* ----- Extract heat-map & today count ----- */
    const { heatmapData, todayCount } = await page.evaluate(() => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const cells = Array.from(document.querySelectorAll('rect[style*="fill"]'));
      const unique = new Map();
      const todayStr = new Date().toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      });
      let today = 0;

      const hover = async (el) => {
        const box = el.getBoundingClientRect();
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 }));
        await sleep(150);
        const tt = [...document.querySelectorAll('div')].find((d) => {
          const s = getComputedStyle(d);
          return s.position === 'absolute' && d.innerText.toLowerCase().includes('submission');
        });
        if (tt) {
          const txt = tt.innerText.trim();
          const [countStr, full] = txt.split(' submissions on ');
          const date = full.split(', ').slice(1).join(', ').trim();
          const count = parseInt(countStr, 10);
          unique.set(date, { date, count });
          if (date === todayStr) today = count;
        }
        el.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
      };

      return new Promise(async (resolve) => {
        for (const cell of cells) await hover(cell);
        resolve({ heatmapData: Array.from(unique.values()), todayCount: today });
      });
    });

    /* ----- Profile stats: name & totals ----- */
    await page.waitForSelector('div[class*="scoreCard_head_left--score"]', { timeout: 20000 });

    const profileStats = await page.evaluate(() => {
      const profileName = document.title.split(' - ')[0].trim();
      const blocks = [...document.querySelectorAll('div[class*="scoreCard_head_left--score"]')];
      const totalQuestions = parseInt(blocks[1]?.innerText.trim().split('\n')[0] || '0', 10);

      const diffElems = Array.from(document.querySelectorAll('.problemNavbar_head_nav__a4K6P .problemNavbar_head_nav--text__UaGCx'));
      const diff = { Easy: 0, Medium: 0, Hard: 0 };
      diffElems.forEach((el) => {
        const t = el.innerText.trim();
        if (t.includes('EASY')) diff.Easy = parseInt(t.match(/\((\d+)\)/)?.[1] || 0, 10);
        if (t.includes('MEDIUM')) diff.Medium = parseInt(t.match(/\((\d+)\)/)?.[1] || 0, 10);
        if (t.includes('HARD')) diff.Hard = parseInt(t.match(/\((\d+)\)/)?.[1] || 0, 10);
      });

      return { profileName, totalQuestions, diff };
    });

    return {
      platform: 'gfg',
      username,
      displayName: profileStats.profileName,
      totalSolved: profileStats.totalQuestions,
      easySolved: profileStats.diff.Easy,
      mediumSolved: profileStats.diff.Medium,
      hardSolved: profileStats.diff.Hard,
      activeDays: heatmapData.length,
      contestsParticipated: 0,
      contributionData: heatmapData.map(({ date, count }) => ({ date, count })),
      todayCount,
    };
  } finally {
    await browser.close();
  }
}

// ─────────┐ CLI usage ─────────┐
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: node gfg.js <profileUrl>');
    process.exit(1);
  }
  scrapeGfg(url)
    .then((d) => console.log(JSON.stringify(d, null, 2)))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
