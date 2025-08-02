import asyncio
from playwright.async_api import async_playwright
from pprint import pprint
from datetime import datetime

async def scrape_gfg_profile(url):
    data = {
        "profile_name": None,
        "total_questions_solved": None,
        "contest_rating": None,
        "total_contests": None,
        "heatmap": {},
    }

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url, wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(3000)

        # 1. Profile Name
        try:
            title = await page.title()
            data["profile_name"] = title.split("-")[0].strip()
        except:
            pass

        # 2. Total Questions Solved
        try:
            solved = await page.evaluate("""() => {
                const blocks = [...document.querySelectorAll('div[class*="scoreCard_head_left--score"]')];
                const solvedBlock = blocks[1];
                const problemsSolved = solvedBlock ? solvedBlock.innerText.trim().split('\\n')[0] : null;
                return problemsSolved;
            }""")
            data["total_questions_solved"] = int(solved) if solved else None
        except Exception as e:
            print(f"❌ Problem Solved not found: {e}")

        # 3 & 4. Contest Rating and Total Contests
        try:
            rating = await page.evaluate("""() => {
                const getDetail = (label) => {
                    const titles = document.querySelectorAll('p[class*="contestDetailsCard_head_detail--title"]');
                    const element = [...titles].find(p => p.innerText.trim() === label);
                    return element?.nextElementSibling?.innerText.trim() || null;
                };
                return {
                    rating: getDetail("Contest Rating"),
                    contests: getDetail("Contest Attended")
                };
            }""")
            data["contest_rating"] = float(rating["rating"]) if rating["rating"] else None
            data["total_contests"] = int(rating["contests"]) if rating["contests"] else None
        except Exception as e:
            print("❌ Contest info failed:", e)

    return data  # ✅ This was missing

# Run & Display
if __name__ == "__main__":
    url = "https://www.geeksforgeeks.org/user/username/"
    result = asyncio.run(scrape_gfg_profile(url))
    pprint(result)
