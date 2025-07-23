import mongoose from "mongoose";

const linkSchema = new mongoose.Schema(
  {
    type: { type: String },
    url: { type: String },
  },
  { _id: false }
);

const educatorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    bio: { type: String },
    profileImg: { type: String },
    platforms: [{ type: String }], // ['YouTube', 'Website']
    links: [linkSchema],
    tags: [{ type: String }],
  },
  { timestamps: true }
);

const Educator = mongoose.model("Educator", educatorSchema);
export default Educator; 