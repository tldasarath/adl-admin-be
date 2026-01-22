import mongooseInstance from "../config/mongooseInstance.js";

const blogSchema = new mongooseInstance.Schema(
    {
        title: { type: String, required: true },
        excerpt: { type: String, required: false },
        description: { type: String, required: true },
        image: { type: String },

        metaTitle: { type: String, required: false },
        metaKeywords: { type: String, required: false },
        metaDescription: { type: String, required: false },
        canonical: { type: String, required: false },
        subCategory: { type: String, required: false },
        category: { type: String, required: false },
        url: { type: String, required: false },

        status: {
            type: String,
            enum: ["draft", "published"],
            default: "published"
        }
    },
    { timestamps: true }
);

const Blog =
  mongooseInstance.models.Blog || mongooseInstance.model("Blog", blogSchema);

export default Blog;
