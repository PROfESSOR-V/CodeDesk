import asyncHandler from "express-async-handler";
import { supabaseAdmin } from "../utils/supabaseClient.js";

// @desc submit user feedback
// @route POST /api/feedback
// @access Private
export const userFeedback = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }
  const { data, error } = await supabaseAdmin
    .from("feedback")
    .insert([
      {
        name,
        email,
        subject,  
        message,
        user_id: req.user.id,
      },
    ]).select();
  if (error) {
    return res.status(500).json({ message: error.message });
  }
  return res.status(200).json({ message: "Feedback submitted successfully", feedback: data[0] });
  
})

// @desc get users feedbacks
// @route GET /api/feedback
// @access Private
export const getUserFeedbacks = asyncHandler(async(req,res)=>{
  const {data, error} = await supabaseAdmin
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });
    if (error){
      return res.status(500).json({ message: error.message });
    }
    return res.status(200).json(data || []);
})

// @desc get a user feedbacks
// @route GET /api/feedback/getAUserFeedbacks
// @access Private
export const getAUserFeedbacks = asyncHandler(async(req,res)=>{
  const {data, error} = await supabaseAdmin
    .from("feedback")
    .select("*")
    .eq("user_id", req.params.userId)
    .order("created_at", { ascending: false });
    if (error){
      return res.status(500).json({ message: error.message });
    }
    return res.status(200).json(data || []);
})