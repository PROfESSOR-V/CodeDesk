import express from "express";
import dotenv from "dotenv";
import cors from "cors";
// Mongo connection removed
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// Route files
import userRoutes from "./routes/userRoutes.js";
import platformRoutes from "./routes/platformRoutes.js";
import verificationRoutes from "./routes/verificationRoutes.js";
// Removed legacy Mongo routes

dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
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

// Healthcheck
app.get("/", (req, res) => res.send("CodeDesk API is running"));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 