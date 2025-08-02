import express from "express";
import axios from "axios";
import puppeteer from "puppeteer";
import crypto from "crypto";
import dotenv from "dotenv";
import { protect } from "../middleware/authMiddleware.js";
import { supabaseAdmin } from "../utils/supabaseClient.js";
import { getPlatformStats } from "../utils/platformStats.js";
import { aggregatePortfolio } from "../utils/aggregatePortfolio.js";
import { upsertPlatformStats } from "../utils/platformTables.js";

dotenv.config();

const router = express.Router();

// Helper to generate random alphanumeric code
function generateCode(len = 6) {
  return crypto.randomBytes(len).toString("base64url").slice(0, len).toUpperCase();
}

// @route POST /api/verification/init
// @desc  Generate random verification code for a profile URL and save a temporary platform entry
// @access Private
router.post("/init", protect, async (req, res) => {
  try {
    const { profileUrl, platformId } = req.body;
    if (!profileUrl || !platformId) {
      return res.status(400).json({ message: "profileUrl and platformId are required" });
    }

    // Basic URL validation
    try {
      new URL(profileUrl);
    } catch (e) {
      return res.status(400).json({ message: "Invalid URL" });
    }

    const verificationCode = generateCode(6);

    // Save / replace temporary platform entry (verified:false)
    const { data: profileData, error: fetchErr } = await supabaseAdmin
      .from("profiles")
      .select("platforms")
      .eq("supabase_id", req.user.id)
      .maybeSingle();

    if (fetchErr) {
      console.error("Supabase fetch error", fetchErr);
      return res.status(500).json({ message: "Database error" });
    }

    const existingArr = Array.isArray(profileData?.platforms) ? profileData.platforms : [];
    // Remove any existing record for this platformId first
    const updated = [
      ...existingArr.filter((p) => p.id !== platformId),
      {
        id: platformId,
        url: profileUrl,
        verified: false,
        verification_code: verificationCode,
        createdAt: new Date().toISOString(),
      },
    ];

    let upsertErr;
    if (profileData) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ platforms: updated })
        .eq("supabase_id", req.user.id);
      upsertErr = error;
    } else {
      const { error } = await supabaseAdmin
        .from("profiles")
        .insert({ supabase_id: req.user.id, platforms: updated });
      upsertErr = error;
    }

    if (upsertErr) {
      console.error("Supabase update error", upsertErr);
      return res.status(500).json({ message: "Database error" });
    }

    return res.json({ verificationCode });
  } catch (err) {
    console.error("Verification init error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// @route POST /api/verification/confirm
// @desc  Fetch profile URL contents and verify the code appears anywhere in page
// @access Private
router.post("/confirm", protect, async (req, res) => {
  try {
    const { profileUrl, verificationCode, platformId } = req.body;
    if (!profileUrl || !verificationCode || !platformId) {
      return res.status(400).json({ message: "profileUrl, verificationCode and platformId are required" });
    }

    // first attempt: fetch stats via platform API/scraper
    let stats;
    try {
      stats = await getPlatformStats(platformId, profileUrl);
    } catch (fetchErr) {
      console.error("stats fetch error", fetchErr.message);
    }

    // fall back: raw HTML fetch and simple code search
    let html = "";
    const fetchPageHTML = async () => {
      try {
        const { data } = await axios.get(profileUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
          },
          timeout: 15000,
        });
        html = data;
      } catch (err) {
        console.error("HTML fetch error", err.message, "- trying puppeteer");
        try {
          const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
          const page = await browser.newPage();
          await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36");
          await page.goto(profileUrl, { waitUntil: "networkidle2", timeout: 30000 });
          html = await page.content();
          await browser.close();
        } catch (pupErr) {
          console.error("puppeteer fetch error", pupErr.message);
        }
      }
    };

    // Determine if verification code can be found
    const normalize = (s) => (s || "")
      .split(/\s+/)[0]                 // take first word
      .replace(/[^A-Z0-9]/gi, "")     // keep only alphanumerics
      .toUpperCase();
    let found = false;
    if (stats && stats.displayName) {
      console.log("🔍 Stats.displayName:", stats.displayName, "Expected:", verificationCode);
      found = normalize(stats.displayName) === normalize(verificationCode);
    }
    
    // Special handling for GFG - check full page HTML if available
    if (!found && stats && stats.platform === 'gfg' && stats.rawHtml) {
      console.log("📄 GFG special check: Looking for verification code in page HTML");
      found = stats.rawHtml.toUpperCase().includes(verificationCode.toUpperCase());
      console.log("📄 GFG verification result from HTML scan:", found);
    }
    
    // Regular fallback to direct HTML fetch if needed
    if (!found) {
      await fetchPageHTML();
      if (html) {
        const htmlContains = html.toUpperCase().includes(verificationCode.toUpperCase());
        console.log("🔍 HTML contains code?", htmlContains);
        found = htmlContains;
      }
    }
  
    // 🐢  GFG cache can take a few seconds to update. If still not found, retry up to 3× with 5-second gaps.
    if (!found && platformId === "gfg") {
      for (let i = 0; i < 3 && !found; i++) {
        console.log(`⏳ GFG name mismatch – retry ${i + 1}/3 after 5s`);
        await new Promise((r) => setTimeout(r, 5000));
        try {
          const bustUrl = profileUrl + (profileUrl.includes("?") ? "&" : "?") + "ts=" + Date.now();
          const retryStats = await getPlatformStats(platformId, bustUrl);
          console.log("🔄 Retry fetched displayName:", retryStats.displayName);
          found = normalize(retryStats.displayName) === normalize(verificationCode);
          if (found) stats = retryStats; // keep final stats for storage
        } catch (err) {
          console.error("Retry scrape error", err.message);
        }
      }
    }

    // Fetch current platforms array once
    const { data: profileData, error: fetchErr } = await supabaseAdmin
      .from("profiles")
      .select("platforms")
      .eq("supabase_id", req.user.id)
      .maybeSingle();

    if (fetchErr) {
      console.error("Supabase fetch error", fetchErr);
      return res.status(500).json({ message: "Database error" });
    }

    const existing = profileData?.platforms || [];

    if (found) {
      // Extract simple stats (placeholder). In real impl. parse HTML or API.
      const statsObj = stats || {
        displayName: verificationCode,
        fetchedAt: new Date().toISOString(),
      };

      const updated = [
        ...existing.filter((p) => p.id !== platformId),
        {
          id: platformId,
          url: profileUrl,
          verified: true,
          verifiedAt: new Date().toISOString(),
          stats: statsObj,
        },
      ];

      const { error: upsertErr } = await supabaseAdmin
        .from("profiles")
        .upsert(
          { supabase_id: req.user.id, platforms: updated },
          { onConflict: "supabase_id", ignoreDuplicates: false }
        );

      if (upsertErr) {
        console.error("Supabase upsert error", upsertErr);
        return res.status(500).json({ message: "Database error" });
      }
      // Recalculate aggregated portfolio stats after successful verification
      const { data: updatedProfile } = await supabaseAdmin
        .from("profiles")
        .select("platforms")
        .eq("supabase_id", req.user.id)
        .single();

      // Store detailed stats into dedicated *_stats table
      await upsertPlatformStats(platformId, req.user.id, statsObj);

      const portfolioData = aggregatePortfolio(updatedProfile?.platforms || [], { id: req.user.id });

      await supabaseAdmin
        .from("profiles")
        .update({ portfolio: portfolioData.aggregatedStats })
        .eq("supabase_id", req.user.id);

      return res.json({ verified: true, stats: statsObj, aggregated: portfolioData.aggregatedStats });
    } else {
      // Remove the temp entry to allow user to try again
      const updated = existing.filter((p) => p.id !== platformId);
      await supabaseAdmin
        .from("profiles")
        .upsert(
          { supabase_id: req.user.id, platforms: updated },
          { onConflict: "supabase_id", ignoreDuplicates: false }
        );

      return res.json({ verified: false, message: "Verification failed" });
    }
  } catch (err) {
    console.error("Verification confirm error", err.message);
    return res.status(500).json({ message: "Could not verify profile" });
  }
});

export default router; 