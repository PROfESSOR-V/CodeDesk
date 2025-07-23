import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    link: { type: String },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Easy" },
    topicTags: [{ type: String }],
    companyTags: [{ type: String }],
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);
export default Question; 