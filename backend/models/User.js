import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const progressSchema = new mongoose.Schema(
  {
    sheetId: { type: mongoose.Schema.Types.ObjectId, ref: "DSASheet" },
    topicId: { type: mongoose.Schema.Types.ObjectId },
    completedQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    platformHandles: {
      leetcode: { type: String },
      codeforces: { type: String },
      gfg: { type: String },
    },
    bookmarkedSheets: [{ type: mongoose.Schema.Types.ObjectId, ref: "DSASheet" }],
    progress: [progressSchema],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User; 