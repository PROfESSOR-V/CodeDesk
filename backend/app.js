import express from "express";
import dotenv from "dotenv";
import cors from "cors";
// Mongo connection removed
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { startDailyRefresh } from "./utils/scheduler.js";

// Route files
import userRoutes from "./routes/userRoutes.js";
import platformRoutes from "./routes/platformRoutes.js";
import verificationRoutes from "./routes/verificationRoutes.js";
import codeforcesRoutes from "./routes/codeforcesRoutes.js";
import CodeChefRouter from "./routes/codechefRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js"; // 1. Import the new workspace routes

// Removed legacy Mongo routes

dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  'http://localhost:5173',
  'http://localhost:3000',
  'https://localhost:5173',
  'https://localhost:3000',
].filter(Boolean);

// Helper to decide if an origin is allowed (supports *.vercel.app previews)
function isAllowedOrigin(origin) {
  if (!origin) return true; // non-browser or same-origin
  if (allowedOrigins.includes(origin)) return true;
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    if (hostname === 'localhost') return true;
    // Allow any Vercel preview or production subdomain
    if (hostname.endsWith('.vercel.app')) return true;
    // Optional: allow CSV list via EXTRA_CORS_ORIGINS
    if (process.env.EXTRA_CORS_ORIGINS) {
      const extras = process.env.EXTRA_CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);
      if (extras.includes(origin)) return true;
    }
  } catch (_) {
    // ignore parse errors; fall through to deny
  }
  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/platforms", platformRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/codeforces", codeforcesRoutes);
app.use("/api/workspace", workspaceRoutes); 
app.use("/api/codechef" , CodeChefRouter)

// Healthcheck
app.get("/", (req, res) => res.send("CodeDesk API is running"));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startDailyRefresh();
});
