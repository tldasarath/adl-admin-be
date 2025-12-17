import CommonPackage from "../../models/CommonPackage.js";
import cloudinary from "../../config/cloudinary.js";
import { categoryPackage } from "../../models/CategoryPackage.js";



export const createCommonPackage = async (req, res) => {
  try {
    const { title, description, amount } = req.body;

    // points sent as points[] from UI
    const points = Array.isArray(req.body.points)
      ? req.body.points.map(p => p.trim()).filter(Boolean)
      : [];

    const is_home =
      req.body.is_home === "true" ||
      req.body.is_home === true ||
      req.body.is_home === "1";

    const is_freezone =
      req.body.is_freezone === "true" ||
      req.body.is_freezone === true ||
      req.body.is_freezone === "1";

    // Validation
    if (!title || !description) {
      return res
        .status(400)
        .json({ success: false, message: "Title and description are required." });
    }

    if (points.length < 1 || points.length > 4) {
      return res.status(400).json({
        success: false,
        message: "Points must contain 1 to 4 items.",
      });
    }

    if (!amount || Number.isNaN(Number(amount))) {
      return res
        .status(400)
        .json({ success: false, message: "Valid amount is required." });
    }

    if (!is_home && !is_freezone) {
      return res
        .status(400)
        .json({ success: false, message: "Choose either home or freezone." });
    }

    if (is_home && is_freezone) {
      return res.status(400).json({
        success: false,
        message: "Only one of is_home or is_freezone can be true.",
      });
    }

    const typeField = is_home ? "is_home" : "is_freezone";
    const count = await CommonPackage.countDocuments({ [typeField]: true });

    if (count >= 3) {
      return res.status(400).json({
        success: false,
        message: `Maximum 3 packages allowed for ${typeField}.`,
      });
    }

    // Build object
    const pkgObj = {
      title,
      description,
      points,
      amount: Number(amount),
      is_home,
      is_freezone,
    };

    // image upload
    if (req.file) {
      pkgObj.iconUrl =
        req.file.secure_url || req.file.path || req.file.url || req.file.location;
      pkgObj.iconPublicId =
        req.file.public_id || req.file.filename || req.file.originalname;
    }

    const created = await CommonPackage.create(pkgObj);

    return res.status(201).json({
      success: true,
      message: "Common package created successfully.",
      data: created,
    });
  } catch (error) {
    console.error("Create Common Package Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error.",
      error: error.message,
    });
  }
};

export const getAllCommonPackages = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type === "home") filter.is_home = true;
    if (type === "freezone") filter.is_freezone = true;

    const packages = await CommonPackage.find(filter).sort({ amount: 1 });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Common packages retrieved successfully.",
      count: packages.length,
      data: packages
    });

  } catch (error) {
    console.error("Get Packages Error:", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Error fetching common packages.",
      error: error.message
    });
  }
};



export const getCommonPackageById = async (req, res) => {
  try {
    const pkg = await CommonPackage.findById(req.params.id);
    if (!pkg) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Package not found."
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: pkg
    });

  } catch (error) {
    console.error("Get Package Error:", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Server error.",
      error: error.message
    });
  }
};



/* ---------------- Update Common Package ---------------- */
export const updateCommonPackage = async (req, res) => {
  try {
    const pkg = await CommonPackage.findById(req.params.id);
    if (!pkg) return res.status(404).json({ success: false, statusCode: 404, message: 'Package not found.' });

    // helper: normalize incoming points into Array<string> or null (if not provided)
    const normalizePoints = (raw) => {
      if (raw === undefined || raw === null) return null;

      // If already an array
      if (Array.isArray(raw)) {
        return raw.map(p => String(p).trim()).filter(Boolean);
      }

      // If object-like (e.g. {0: 'a', 1: 'b'} from some form encoders)
      if (typeof raw === 'object') {
        try {
          return Object.values(raw).map(v => String(v).trim()).filter(Boolean);
        } catch (e) {
          return null;
        }
      }

      // If a string: maybe comma separated or a single value
      if (typeof raw === 'string') {
        if (raw.indexOf(',') !== -1) {
          return raw.split(',').map(s => s.trim()).filter(Boolean);
        }
        if (raw.trim() === '') return [];
        return [raw.trim()];
      }

      return null;
    };

    // read simple fields
    const { title, description, amount } = req.body;

    // Normalize points (no external parsePoints used)
    const points = req.body.points ? normalizePoints(req.body.points) : null;

    // booleans (accept '1'/'0', 'true'/'false', true/false)
    const is_home = req.body.is_home === 'true' || req.body.is_home === true || req.body.is_home === '1' || req.body.is_home === 1;
    const is_freezone = req.body.is_freezone === 'true' || req.body.is_freezone === true || req.body.is_freezone === '1' || req.body.is_freezone === 1;

    // If type changes, enforce limit
    if ((is_home && !pkg.is_home) || (is_freezone && !pkg.is_freezone)) {
      const typeField = is_home ? 'is_home' : 'is_freezone';
      const count = await CommonPackage.countDocuments({ [typeField]: true, _id: { $ne: pkg._id } });
      if (count >= 3) return res.status(400).json({ success: false, statusCode: 400, message: `Max 3 packages allowed for ${typeField}.` });
    }

    // handle new image: delete old from Cloudinary then set new
    if (req.file) {
      if (pkg.iconPublicId) {
        try {
          await cloudinary.uploader.destroy(pkg.iconPublicId);
        } catch (err) {
          console.warn('Cloudinary delete failed (non-fatal):', err.message);
        }
      }
      pkg.iconUrl = req.file.secure_url || req.file.path || req.file.url || req.file.location;
      pkg.iconPublicId = req.file.public_id || req.file.filename || req.file.path;
    }

    // update primitive fields only if provided
    if (title !== undefined) pkg.title = title;
    if (description !== undefined) pkg.description = description;
    if (amount !== undefined) pkg.amount = Number(amount);

    // points: store as array of strings (schema expects [String])
    if (points !== null) {
      if (!Array.isArray(points) || points.length === 0 || points.length > 4) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'Points must be 1–4.' });
      }
      pkg.points = points.map(p => String(p));
    }

    // validate exclusive booleans
    if (is_home && is_freezone) {
      return res.status(400).json({ success: false, statusCode: 400, message: 'Only one of is_home or is_freezone allowed.' });
    }
    if (req.body.is_home !== undefined) pkg.is_home = !!is_home;
    if (req.body.is_freezone !== undefined) pkg.is_freezone = !!is_freezone;

    pkg.updatedAt = Date.now();
    await pkg.save();

    return res.status(200).json({ success: true, statusCode: 200, message: 'Package updated.', data: pkg });

  } catch (error) {
    console.error('Update Common Package Error:', error);
    return res.status(500).json({ success: false, statusCode: 500, message: 'Server error.', error: error.message });
  }
};



/* ---------------- Delete Common Package ---------------- */
export const deleteCommonPackage = async (req, res) => {
  try {
    const pkg = await CommonPackage.findById(req.params.id);
    if (!pkg)
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Package not found.",
      });

    // delete cloudinary image only if publicId exists
    if (pkg.iconPublicId) {
      try {
        const result = await cloudinary.uploader.destroy(pkg.iconPublicId);
        console.log("Cloudinary delete:", result);
      } catch (err) {
        console.warn("Cloudinary deletion failed:", err.message);
      }
    }

    // delete DB record
    await CommonPackage.deleteOne({ _id: pkg._id });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Package deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Common Package Error:", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Server error.",
      error: error.message,
    });
  }
};



export const getCommonPackageCounts = async (req, res) => {
  try {
    const homeCount = await CommonPackage.countDocuments({ is_home: true });
    const freezoneCount = await CommonPackage.countDocuments({ is_freezone: true });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Counts retrieved successfully.",
      data: { is_home: homeCount, is_freezone: freezoneCount }
    });

  } catch (error) {
    console.error("Count Error:", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Error fetching counts.",
      error: error.message
    });
  }
};



/* ============================================================
   CATEGORY PACKAGES (Nested)
============================================================ */


export const createCategoryPackage = async (req, res) => {
  try {
    const { page, title, amount, description, innerPage } = req.body;
    console.log(req.body);
    
    const rawPoints = req.body.points;
    const pointsArray =
      typeof rawPoints === "string"
        ? rawPoints.split(",").map(p => p.trim()).filter(Boolean)
        : rawPoints;

    // ✅ Basic validation
    if (
      !page ||
      !innerPage ||
      !title ||
      amount === undefined ||
      !Array.isArray(pointsArray) ||
      pointsArray.length < 1 ||
      pointsArray.length > 4
    ) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Invalid input. Points must be 1–4.",
      });
    }

    // ✅ LIMIT CHECK: max 5 packages per innerPage
    const existingCount = await categoryPackage.countDocuments({
      page,
      innerPage,
    });

    if (existingCount >= 4) {
      return res.status(400).json({
        success: false,
        message: "Maximum of 4 packages allowed for this page section.",
      });
    }

    // ✅ Create package
    const newPackage = new categoryPackage({
      page,
      innerPage,
      title,
      price: amount,
      points: pointsArray,
      description,
      image: req.file?.path || null,
    });

    await newPackage.save();

    return res.status(201).json({
      success: true,
      message: "Category package created successfully",
      data: newPackage,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};




export const getCategoryPackages = async (req, res) => {
  try {
    const { page, innerPage } = req.query;
    const filter = {};
    if (page) filter.page = page;
    if (innerPage) filter.innerPage = innerPage;
    const packages = await categoryPackage.find(filter).sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: packages,
    });
  } catch (error) {
    console.error("Get Category Packages Error:", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Server error.",
      error: error.message,
    });
  }
};




export const updateCategoryPackage = async (req, res) => {
  try {
    const { packageId } = req.params;
    const { title, price, points, description } = req.body;
console.log(req.params,req.body);

    // 1️⃣ Find package
    const pkg = await categoryPackage.findById(packageId);

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: "Category package not found",
      });
    }

    if (title !== undefined) pkg.title = title;
    if (price !== undefined) pkg.price = price;
    if (points !== undefined) pkg.points = points;
    if (description !== undefined) pkg.description = description;
console.log(req.file);


    if (req.file) {
      try {
        const publicId = pkg.image
          .split("/upload/")[1]
          .replace(/^v\d+\//, "")
          .replace(/\.[^/.]+$/, "");

        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Cloudinary delete result:", result);
        pkg.image = req.file.path;

      } catch (err) {
        console.warn("Cloudinary delete failed:", err.message);
      }
    }

    // 4️⃣ Save updated package
    const updatedPackage = await pkg.save();

    return res.status(200).json({
      success: true,
      message: "Category package updated successfully",
      data: updatedPackage,
    });

  } catch (error) {
    console.error("Update Category Package Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};



export const deleteCategoryPackage = async (req, res) => {
  try {
    const { categoryId } = req.query;
    console.log(categoryId);

    const pkg = await categoryPackage.findOne({ _id: categoryId });

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    // ✅ Delete image from Cloudinary
    if (pkg.image) {
      try {
        const publicId = pkg.image
          .split("/upload/")[1]
          .replace(/^v\d+\//, "")
          .replace(/\.[^/.]+$/, "");

        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Cloudinary delete result:", result);
      } catch (err) {
        console.warn("Cloudinary delete failed:", err.message);
      }
    }


    // ✅ Delete from DB
    await categoryPackage.deleteOne({ _id: pkg._id });

    return res.status(200).json({
      success: true,
      message: "Package deleted successfully",
    });

  } catch (error) {
    console.error("Delete Category Package Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};




// export const getCategoryPageCounts = async (req, res) => {
//   try {
//     const { categoryKey } = req.params;

//     const doc = await CategoryPackage.findOne({ categoryKey });
//     if (!doc) return res.status(404).json({ success: false, message: "Category not found." });

//     const counts = doc.pages.map(p => ({
//       pageName: p.pageName,
//       count: p.packages.length
//     }));

//     return res.status(200).json({
//       success: true,
//       statusCode: 200,
//       data: counts
//     });

//   } catch (error) {
//     console.error("Get Page Counts Error:", error);
//     return res.status(500).json({
//       success: false,
//       statusCode: 500,
//       message: "Server error.",
//       error: error.message
//     });
//   }
// };
