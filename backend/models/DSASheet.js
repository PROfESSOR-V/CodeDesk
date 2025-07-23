import mongoose from "mongoose";

const topicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  },
  { _id: false }
);

const dsaSheetSchema = new mongoose.Schema(
  {
    sheetName: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Educator" }, // or admin user id
    topics: [topicSchema],
  },
  { timestamps: true }
);

const DSASheet = mongoose.model("DSASheet", dsaSheetSchema);
export default DSASheet; 