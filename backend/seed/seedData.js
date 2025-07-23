import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Platform from "../models/Platform.js";
import Educator from "../models/Educator.js";
import DSASheet from "../models/DSASheet.js";
import Question from "../models/Question.js";
import bcrypt from "bcryptjs";

dotenv.config();

const seed = async () => {
  try {
    await connectDB();
    await User.deleteMany();
    await Platform.deleteMany();
    await Educator.deleteMany();
    await DSASheet.deleteMany();
    await Question.deleteMany();

    const adminUser = await User.create({
      name: "Admin",
      email: "admin@codedesk.com",
      password: "admin123",
      role: "admin",
    });

    console.log("Data Seeded!");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seed(); 