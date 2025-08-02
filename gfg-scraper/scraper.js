const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");


async function scrapeGFG(username) {
  const url = `https://www.geeksforgeeks.org/user/${username}`;
  const browser = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    args: chromium.args,
  });
  
  

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Block unnecessary assets
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 0, // disables timeout
  });
  
  await page.waitForSelector('rect[style*="fill"]', { visible: true });

  // Wait for difficulty stats to load (up to 15 s). They’re rendered via JS after initial page paint.
  await page.waitForFunction(() => {
    const els = document.querySelectorAll('.problemNavbar_head_nav__a4K6P .problemNavbar_head_nav--text__UaGCx');
    return els && els.length >= 3;
  }, { timeout: 15000 }).catch(() => {});

  const { heatmapData, currentDayHeatmapData } = await page.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const cells = Array.from(document.querySelectorAll('rect[style*="fill"]'));
    const data = new Map();
    const currentDay = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    let today = { date: currentDay, submissions: 0 };

    for (const cell of cells) {
      const box = cell.getBoundingClientRect();
      cell.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: box.left, clientY: box.top }));
      await sleep(200);

      const tooltip = [...document.querySelectorAll('div')].find(el =>
        getComputedStyle(el).position === 'absolute' && el.innerText.toLowerCase().includes('submission')
      );

      if (tooltip) {
        const [count, fullDate] = tooltip.innerText.split(' submissions on ');
        const date = fullDate.split(', ').slice(1).join(', ').trim();
        const submissions = parseInt(count);
        data.set(date, { date, submissions });
        if (date === currentDay) today.submissions = submissions;
      }

      cell.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
      await sleep(100);
    }

    return {
      heatmapData: Array.from(data.values()),
      currentDayHeatmapData: today
    };
  });

  // Get additional stats
  const profileStats = await page.evaluate(() => {
    const profileName = document.title.split(' - ')[0].trim();
    const blocks = [...document.querySelectorAll('div[class*="scoreCard_head_left--score"]')];
    const totalQuestions = parseInt(blocks[1]?.innerText.split('\n')[0]) || 0;

    // Try multiple patterns to extract difficulty counts
    const difficultyData = { Easy: 0, Medium: 0, Hard: 0 };

    // 1. Original navbar elements
    const navEls = Array.from(document.querySelectorAll('.problemNavbar_head_nav__a4K6P .problemNavbar_head_nav--text__UaGCx'));
    navEls.forEach(el => {
      const t = el.innerText.trim().toUpperCase();
      if (t.startsWith('EASY')) difficultyData.Easy = parseInt(t.match(/\((\d+)\)/)?.[1] || 0);
      if (t.startsWith('MEDIUM')) difficultyData.Medium = parseInt(t.match(/\((\d+)\)/)?.[1] || 0);
      if (t.startsWith('HARD')) difficultyData.Hard = parseInt(t.match(/\((\d+)\)/)?.[1] || 0);
    });

    // 2. Score-card sections (fallback)
    if (!difficultyData.Easy && !difficultyData.Medium && !difficultyData.Hard) {
      const scoreTexts = Array.from(document.querySelectorAll('div')).map(el => el.innerText.trim());
      scoreTexts.forEach(t => {
        const m = t.match(/^(Easy|Medium|Hard)\s*\((\d+)\)/i);
        if (m) {
          const key = m[1];
          difficultyData[key] = parseInt(m[2]);
        }
      });
    }

    // Ensure numbers
    ['Easy','Medium','Hard'].forEach(k=>{ if(isNaN(difficultyData[k])) difficultyData[k]=0; });

    return {
      profileName,
      totalQuestions,
      easy_solved: difficultyData.Easy,
      medium_solved: difficultyData.Medium,
      hard_solved: difficultyData.Hard,
    };
  });

  await browser.close();
  return {
    ...profileStats,
    heatmap: heatmapData,
    today_count: currentDayHeatmapData.submissions,
    raw_stats: { full_heatmap: heatmapData, today: currentDayHeatmapData }
  };
}

module.exports = { scrapeGFG };
