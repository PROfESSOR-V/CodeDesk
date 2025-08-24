import asyncHandler from "express-async-handler";
import { supabaseAdmin } from "../utils/supabaseClient.js";

export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }

  const token = authHeader.split(" ")[1];
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    res.status(401);
    throw new Error("Not authorized, token invalid");
  }

  req.user = data.user; // contains id, email, etc.
  next();
});

export const admin = (req, res, next) => {
  // Implement role check if you store roles in user metadata later
  next();
}; 