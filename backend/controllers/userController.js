import asyncHandler from "express-async-handler";
import { supabaseAdmin } from "../utils/supabaseClient.js";

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("supabase_id", req.user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message);
  }

  res.json(data || {});
});

// @desc    Sync Supabase user to MongoDB
// @route   POST /api/users/sync
// @access  Public (called by frontend or webhook)
export const syncSupabaseUser = asyncHandler(async (req, res) => {
  const { supabaseId, email, name } = req.body;
  if (!supabaseId || !email) {
    res.status(400);
    throw new Error("Missing supabaseId or email");
  }

  let user = await User.findOne({ email });
  if (user) {
    if (!user.supabaseId) {
      user.supabaseId = supabaseId;
      await user.save();
    }
  } else {
    user = await User.create({ name: name || "", email, supabaseId });
  }

  const { generateToken } = await import("../utils/generateToken.js");
  const token = generateToken(user._id, user.role);
  res.status(200).json({ message: "User synced", userId: user._id, token });
});

// @desc    Update user basic info
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, bio, country, avatarUrl } = req.body;

  const updatePayload = {
    first_name: firstName,
    last_name: lastName,
    bio,
    country,
    avatar_url: avatarUrl,
  };

  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert({ supabase_id: req.user.id, ...updatePayload }, { onConflict: "supabase_id" });

  if (error) throw new Error(error.message);

  res.json({ message: "Profile updated" });
});

// @desc   Update user sections arrays
// @route  PUT /api/users/sections
// @access Private
export const updateUserSections = asyncHandler(async (req, res) => {
  const { education, achievements, workExperience, platforms } = req.body;

  const payload = { supabase_id: req.user.id };
  if (education) payload.education = education;
  if (achievements) payload.achievements = achievements;
  if (workExperience) payload.work_experience = workExperience;
  if (platforms) payload.platforms = platforms;

  const { error } = await supabaseAdmin.from("profiles").upsert(payload, { onConflict: "supabase_id" });
  if (error) throw new Error(error.message);

  res.json({ message: "Sections updated" });
});

// @desc   Remove a platform from user's profile
// @route  DELETE /api/users/platform
// @access Private
export const removePlatform = asyncHandler(async (req, res) => {
  const { platformName } = req.body;
  
  // Get current platforms
  const { data, error: fetchError } = await supabaseAdmin
    .from("profiles")
    .select("platforms")
    .eq("supabase_id", req.user.id)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  
  // Filter out the platform to remove
  const updatedPlatforms = (data?.platforms || []).filter(p => p.name !== platformName);
  
  // Update platforms array
  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ platforms: updatedPlatforms })
    .eq("supabase_id", req.user.id);

  if (updateError) throw new Error(updateError.message);

  res.json({ message: "Platform removed successfully", platforms: updatedPlatforms });
}); 