import mongooseInstance from "../config/mongooseInstance.js";

const HeroSectionSchema = new mongooseInstance.Schema(
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

const HeroSection =
  mongooseInstance.models.HeroSection ||
  mongooseInstance.model("HeroSection", HeroSectionSchema);

export default HeroSection;
