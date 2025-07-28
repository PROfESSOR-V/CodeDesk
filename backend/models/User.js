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
    // For Supabase-managed auth, we store supabaseId instead of local password
    supabaseId: { type: String, unique: true, sparse: true },
    password: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    platformHandles: {
      leetcode: { type: String },
      codeforces: { type: String },
      gfg: { type: String },
    },
    bookmarkedSheets: [{ type: mongoose.Schema.Types.ObjectId, ref: "DSASheet" }],
    progress: [progressSchema],
    bio: { type: String },
    country: { type: String },
    education: [
      {
        degree: String,
        school: String,
        gradeType: String,
        score: String,
        from: Date,
        to: Date,
      },
    ],
    achievements: [
      {
        title: String,
        description: String,
        url: String,
      },
    ],
    workExperience: [
      {
        role: String,
        company: String,
        description: String,
        from: Date,
        to: Date,
      },
    ],
    platforms: [
      {
        id: String,
        url: String,
        verified: Boolean,
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
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