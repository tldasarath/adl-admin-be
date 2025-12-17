import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      default: false, 
    },
    order: {
      type: Number,
      default: 0, 
    },
  },
  { timestamps: true }
);

export const FAQ = mongoose.model("FAQ", faqSchema);
