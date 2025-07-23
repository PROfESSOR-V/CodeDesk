import mongoose from "mongoose";

const platformSchema = new mongoose.Schema(
  {
    platformName: { type: String, required: true, unique: true },
    logoUrl: { type: String },
    link: { type: String },
    userStats: { type: Object }, // placeholder for future
  },
  { timestamps: true }
);

const Platform = mongoose.model("Platform", platformSchema);
export default Platform; 