import asyncHandler from "express-async-handler";
import Question from "../models/Question.js";

export const getQuestions = asyncHandler(async (req, res) => {
  const questions = await Question.find({});
  res.json(questions);
});

export const createQuestion = asyncHandler(async (req, res) => {
  const question = await Question.create(req.body);
  res.status(201).json(question);
}); 