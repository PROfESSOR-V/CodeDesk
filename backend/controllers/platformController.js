import asyncHandler from "express-async-handler";
import Platform from "../models/Platform.js";

export const getPlatforms = asyncHandler(async (req, res) => {
  const platforms = await Platform.find({});
  res.json(platforms);
});

export const createPlatform = asyncHandler(async (req, res) => {
  const { platformName, logoUrl, link } = req.body;
  const platform = await Platform.create({ platformName, logoUrl, link });
  res.status(201).json(platform);
}); 