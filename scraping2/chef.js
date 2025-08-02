const puppeteer = require("puppeteer");

(async () => {
  const username = "username"; // Change this as needed
  const url = `https://www.codechef.com/users/${username}`;

  console.log(`🔍 Scraping data for: ${url}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'stylesheet', 'font'].includes(type)) req.abort();
      else req.continue();
    });

    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    await page.waitForSelector('.rating-data-section.problems-solved', {
      timeout: 60000,
      visible: true
    });

    const profileInfo = await page.evaluate(() => {
      const ratingElement = document.querySelector('.rating-number');
      const nameElement = document.querySelector('.h2-style');
      const solvedElement = document.querySelector('.rating-data-section.problems-solved h3:last-child');

      return {
        profileName: nameElement ? nameElement.innerText.trim() : null,
        rating: ratingElement ? ratingElement.innerText.trim() : null,
        problemsSolved: solvedElement ? solvedElement.innerText.match(/\d+/)?.[0] : null
      };
    });

    const heatmapData = await page.evaluate(async () => {
      const sleep = (ms) => new Promise(res => setTimeout(res, ms));
      const dropdown = document.querySelector('#heatmap-period-selector');
      const options = Array.from(dropdown.options).map(opt => opt.value);
      const seen = new Set();
      const cleanData = [];

      for (const value of options) {
        dropdown.value = value;
        dropdown.dispatchEvent(new Event('change', { bubbles: true }));
        await sleep(2000); // wait for heatmap to render

        const rects = Array.from(document.querySelectorAll('svg rect'))
          .filter(rect => rect.getAttribute('data-count'))
          .map(rect => ({
            date: rect.getAttribute('data-date'),
            count: parseInt(rect.getAttribute('data-count'))
          }));

        for (const { date, count } of rects) {
          if (!seen.has(date)) {
            cleanData.push({ Date: date, Submissions: count });
            seen.add(date);
          }
        }
      }

      return cleanData;
    });

    const todayObj = new Date();
    const today = `${todayObj.getFullYear()}-${todayObj.getMonth() + 1}-${todayObj.getDate()}`;
    const todayHeatmap = heatmapData.find(d => d.Date === today);


    console.log('\n📊 Profile Information:');
    console.log(profileInfo);

    console.log(`\n🎯 Total active submission days: ${heatmapData.length}`);
    console.table(heatmapData);

    console.log(`\n📅 📍 Current Day Heatmap (${today}):`);
    if (todayHeatmap) {
      console.table([todayHeatmap]);
    } else {
      console.log("No submissions made today.");
    }

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await browser.close();
  }
})();
