require("dotenv").config();

const express = require("express");
const { scrapeGFG } = require("./scraper");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

app.post("/scrape", async (req, res) => {
  const { username, supabase_id } = req.body;
  if (!username || !supabase_id) {
    return res.status(400).json({ error: "Missing username or supabase_id" });
  }

  try {
    const data = await scrapeGFG(username);

    const { error } = await supabase.from("gfg_stats").upsert({
      supabase_id,
      profile_name: data.profileName,
      total_questions: data.totalQuestions,
      easy_solved: data.easy_solved,
      medium_solved: data.medium_solved,
      hard_solved: data.hard_solved,
      rating: null,
      total_contests: null,
      badges: [],
      heatmap: data.heatmap,
      today_count: data.today_count,
      raw_stats: data.raw_stats,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    res.json({ success: true, message: "GFG data inserted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
