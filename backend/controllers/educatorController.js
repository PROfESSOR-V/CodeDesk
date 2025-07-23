import asyncHandler from "express-async-handler";
import Educator from "../models/Educator.js";

export const getEducators = asyncHandler(async (req, res) => {
  const educators = await Educator.find({});
  res.json(educators);
});

export const createEducator = asyncHandler(async (req, res) => {
  const educator = await Educator.create(req.body);
  res.status(201).json(educator);
}); 