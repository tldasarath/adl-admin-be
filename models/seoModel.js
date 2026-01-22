import mongooseInstance from "../config/mongooseInstance.js";

const seoSchema = new mongooseInstance.Schema(
  {
    page: {
      type: String,
      required: true,
    },

    innerPage: {
      type: String,
      default: null,
    },

    title: {
      type: String,
      required: true,
    },

    keywords: {
      type: [String],   
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    canonical: {
      type: String,
      required: true,
    }
  },
  { timestamps: true }
);

const SeoMeta =
  mongooseInstance.models.SeoMeta ||
  mongooseInstance.model("SeoMeta", seoSchema);

export default SeoMeta;
