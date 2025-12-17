import cloudinary from "../../config/cloudinary.js";
import { blog } from "../../models/blogModel.js";





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

    const blogs = await blog.find({ url: req.params.url });

    if (!blogs) return res.status(404).json({ success: false, error: "Not Found" });

    res.json({ success: true, data: blogs });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
export const getInnerPageBlog = async (req, res) => {
  try {
const page =`/${req.params.subcategory}`

    const blogs = await blog.find({ subCategory: page });

    if (!blogs) return res.status(404).json({ success: false, error: "Not Found" });

    res.json({ success: true, data: blogs });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

