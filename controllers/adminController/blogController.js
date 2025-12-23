import cloudinary from "../../config/cloudinary.js";
import { blog } from "../../models/blogModel.js";


export const createBlog = async (req, res) => {
  try {
    const {
      title,
      excerpt,
      description,
      metaTitle,
      metaKeywords,
      metaDescription,
      status,
      subCategory,
      category,
      canonical,
      url,
    } = req.body;

    // ------------------------------------
    // 1️⃣ Validate required fields
    // ------------------------------------
    if (
      !title ||
      !description ||
      !url ||
      !metaTitle ||
      !metaDescription ||
      !metaKeywords ||
      !canonical ||
      !excerpt ||
      !category
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // ------------------------------------
    // 2️⃣ Check URL uniqueness
    // ------------------------------------
    const existingUrl = await blog.findOne({ url });
    if (existingUrl) {
      return res.status(409).json({
        success: false,
        message: "URL already exists. Please choose a different one.",
      });
    }

    // ------------------------------------
    // 3️⃣ Blog limit based on category
    // ------------------------------------
    const blogCount = await blog.countDocuments({ subCategory });

    const maxLimit = category === "service" ? 5 : 4;

    if (blogCount >= maxLimit) {
      return res.status(400).json({
        success: false,
        message: `You can only create up to ${maxLimit} blogs under '${subCategory}'.`,
      });
    }

    // ------------------------------------
    // 4️⃣ Image handling
    // ------------------------------------
    const image = req.file ? req.file.path : null;

    // ------------------------------------
    // 5️⃣ Create blog
    // ------------------------------------
    const newBlog = await blog.create({
      title,
      excerpt,
      description,
      image,
      metaTitle,
      metaKeywords,
      metaDescription,
      status,
      subCategory,
      category,
      canonical,
      url,
    });

    return res.status(201).json({
      success: true,
      message: "Blog created successfully.",
      data: newBlog,
    });

  } catch (error) {
    console.error("Create Blog Error:", error);

    if (error.code === 11000 && error.keyValue?.url) {
      return res.status(409).json({
        success: false,
        message: "URL already exists (database uniqueness).",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while creating blog.",
      error: error.message,
    });
  }
};





export const getBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;

    const category = req.query.category;

    const query = {};
    if (category && category !== "all") {
      query.category = category;
    }

    const blogs = await blog
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await blog.countDocuments(query);

    res.status(200).json({
      success: true,
      message: "Blogs retrieved successfully",
      data: blogs,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching blogs",
      error: error.message,
    });
  }
};



export const getBlog = async (req, res) => {
  try {
    const blogs = await blog.findById(req.params.id);

    if (!blogs) return res.status(404).json({ success: false, error: "Not Found" });

    res.json({ success: true, data: blogs });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const updates = req.body;
    const blogId = req.params.id;
console.log(req.body);

    // --------------------------------
    // 1️⃣ Fetch existing blog
    // --------------------------------
    const existingBlog = await blog.findById(blogId);
    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found."
      });
    }

    // --------------------------------
    // 2️⃣ Validate required fields
    // --------------------------------
    const requiredFields = [
      "title",
      "excerpt",
      "description",
      "metaTitle",
      "metaDescription",
      "metaKeywords",
      "canonical",
      "url",
      "category"
    ];

    for (const field of requiredFields) {
      if (!updates[field] || updates[field].trim() === "") {
        return res.status(400).json({
          success: false,
          message: `Field '${field}' is required.`
        });
      }
    }
    if (updates.category !== "blog" && !updates.subCategory) {
      return res.status(400).json({
        success: false,
        message: "Subcategory is required for this category."
      });
    }

    // --------------------------------
    // 3️⃣ Normalize URL
    // --------------------------------
    updates.url = updates.url.trim().toLowerCase();
    const oldUrl = existingBlog.url.trim().toLowerCase();
    const newUrl = updates.url;

    const isSameUrl = oldUrl === newUrl;

    // --------------------------------
    // 4️⃣ Validate URL format
    // --------------------------------
    if (!/^[a-z0-9-]+$/.test(newUrl)) {
      return res.status(400).json({
        success: false,
        message: "URL can contain only lowercase letters, numbers, and hyphens."
      });
    }

    // --------------------------------
    // 5️⃣ Check URL uniqueness ONLY if changed
    // --------------------------------
    if (!isSameUrl) {
      const urlExists = await blog.findOne({
        url: newUrl,
        _id: { $ne: blogId }
      });

      if (urlExists) {
        return res.status(409).json({
          success: false,
          message: "URL already exists. Please choose a different one."
        });
      }
    }

    // -----------------------------------------------
    // 6️⃣ Limit: Maximum 5 blogs per subcategory
    //    Only check if subCategory is changed
    // -----------------------------------------------
    if (
      updates.subCategory &&
      updates.subCategory !== existingBlog.subCategory
    ) {
      const blogCount = await blog.countDocuments({
        subCategory: updates.subCategory
      });

      if (blogCount >= 4) {
        return res.status(400).json({
          success: false,
          message: `Only 4 blogs are allowed under '${updates.subCategory}'. Please choose another inner page.`
        });
      }
    }

    // --------------------------------
    // 7️⃣ Cloudinary image replacement
    // --------------------------------
    if (req.file) {
      if (existingBlog.image) {
        try {
          const oldImageUrl = existingBlog.image;

          const publicId = oldImageUrl
            .split("/")
            .slice(-2)
            .join("/")
            .replace(/\.[^/.]+$/, "");

          await cloudinary.uploader.destroy(publicId);

        } catch (err) {
          console.warn("Cloudinary delete failed:", err.message);
        }
      }

      updates.image = req.file.path;
    }

    // --------------------------------
    // 8️⃣ Update blog
    // --------------------------------
    const updatedBlog = await blog.findByIdAndUpdate(blogId, updates, {
      new: true,
      runValidators: true
    });

    return res.status(200).json({
      success: true,
      message: "Blog updated successfully.",
      data: updatedBlog
    });

  } catch (err) {
    console.error("Update Error:", err);

    if (err.code === 11000 && err.keyValue?.url) {
      return res.status(409).json({
        success: false,
        message: "URL already exists (database uniqueness)."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while updating the blog.",
      error: err.message
    });
  }
};




export const deleteBlog = async (req, res) => {
  try {
    const deletedBlog = await blog.findByIdAndDelete(req.params.id);

    if (!deletedBlog) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Blog not found."
      });
    }

    // Delete image from Cloudinary
    if (deletedBlog.image) {
      try {
        const oldUrl = deletedBlog.image;

        const publicId = oldUrl
          .split("/")
          .slice(-2)
          .join("/")
          .replace(/\.[^/.]+$/, "");

        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.warn("Cloudinary delete failed:", err.message);
      }
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Blog deleted successfully."
    });

  } catch (err) {
    console.error("Delete Error:", err);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "An unexpected server error occurred while deleting the blog.",
      error: err.message
    });
  }
};
