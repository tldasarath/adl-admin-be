import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
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

export const blog = mongoose.model("Blog", blogSchema);
