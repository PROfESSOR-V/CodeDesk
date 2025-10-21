import express from "express";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import cors from "cors";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" })); // adjust if frontend runs on different port

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Server is running and connected to Supabase ✅");
});

// ✅ DB test route
app.get("/test-db", async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("global_sheets").select("*").limit(1);
    if (error) return res.status(500).json({ message: "❌ Database error", error: error.message });
    res.json({ message: "✅ Database connected!", data });
  } catch (err) {
    next(err);
  }
});

// ✅ Explore Sheets route
app.get("/api/exploreSheets", async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("global_sheets").select("*");
    if (error) return res.status(500).json({ message: "❌ Database error", error: error.message });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ✅ Save to Workspace route
app.post("/api/saveSheet", async (req, res) => {
  try {
    const { sheetId, userId } = req.body;

    if (!sheetId || !userId) {
      return res.status(400).json({ message: "sheetId and userId are required" });
    }

    const { data, error } = await supabase
      .from("user_sheets")
      .insert([{ sheet_id: sheetId, user_id: userId }]);

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ message: "Failed to save sheet", error: error.message });
    }

    res.json({ message: "✅ Sheet saved to workspace!", data });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ❌ Error handling middleware
app.use(notFound);
app.use(errorHandler);

// 🚀 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
