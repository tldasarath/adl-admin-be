import mongoose from "mongoose";

const HeroSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    buttonText: {
      type: String,
      required: true,
    },
    buttonUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export  const herosection=  mongoose.model("HeroSection", HeroSectionSchema);
