import asyncHandler from "express-async-handler";
import DSASheet from "../models/DSASheet.js";

export const getSheets = asyncHandler(async (req, res) => {
  const sheets = await DSASheet.find({}).populate("topics.questions");
  res.json(sheets);
});

export const createSheet = asyncHandler(async (req, res) => {
  const sheet = await DSASheet.create(req.body);
  res.status(201).json(sheet);
}); 