import CommonPackage from "../../models/CommonPackage.js";
import CategoryPackage from "../../models/CategoryPackage.js";

/* ============================================================
   COMMON PACKAGES
============================================================ */

export const createCommonPackage = async (req, res) => {
  try {
    const { iconUrl, title, description, points, amount, is_home, is_freezone } = req.body;

    // Validation
    if (!title || !description || !Array.isArray(points) || points.length === 0 || points.length > 4) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Invalid fields. Points must be between 1 and 4."
      });
    }

    if (amount === undefined) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Amount is required."
      });
    }

    if (!is_home && !is_freezone) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Select either is_home or is_freezone."
      });
    }

    if (is_home && is_freezone) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Only one of is_home or is_freezone can be true."
      });
    }

    const typeField = is_home ? "is_home" : "is_freezone";
    const existingCount = await CommonPackage.countDocuments({ [typeField]: true });

    if (existingCount >= 3) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Maximum 3 packages allowed for ${typeField}.`
      });
    }

    const newPackage = await CommonPackage.create({
      iconUrl,
      title,
      description,
      points: points.map(p => ({ text: p })),
      amount,
      is_home: !!is_home,
      is_freezone: !!is_freezone
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Common package created successfully.",
      data: newPackage
    });

  } catch (error) {
    console.error("Create Common Package Error:", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Server error while creating package.",
      error: error.message
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



export const updateCommonPackage = async (req, res) => {
  try {
    const { iconUrl, title, description, points, amount, is_home, is_freezone } = req.body;
    const pkg = await CommonPackage.findById(req.params.id);

    if (!pkg) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Package not found."
      });
    }

    // If type changes, validate
    if ((is_home && !pkg.is_home) || (is_freezone && !pkg.is_freezone)) {
      const typeField = is_home ? "is_home" : "is_freezone";
      const count = await CommonPackage.countDocuments({ [typeField]: true, _id: { $ne: pkg._id } });

      if (count >= 3) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: `Max 3 packages allowed for ${typeField}.`
        });
      }
    }

    // Apply updates
    if (title) pkg.title = title;
    if (description) pkg.description = description;
    if (iconUrl !== undefined) pkg.iconUrl = iconUrl;
    if (amount !== undefined) pkg.amount = amount;

    if (points) {
      if (!Array.isArray(points) || points.length === 0 || points.length > 4) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: "Points must be 1–4 items."
        });
      }
      pkg.points = points.map(p => ({ text: p }));
    }

    if (is_home && is_freezone) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Only one of is_home or is_freezone allowed."
      });
    }

    if (is_home !== undefined) pkg.is_home = !!is_home;
    if (is_freezone !== undefined) pkg.is_freezone = !!is_freezone;

    await pkg.save();

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Common package updated successfully.",
      data: pkg
    });

  } catch (error) {
    console.error("Update Package Error:", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Error updating package.",
      error: error.message
    });
  }
};



export const deleteCommonPackage = async (req, res) => {
  try {
    const pkg = await CommonPackage.findByIdAndDelete(req.params.id);
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
      message: "Package deleted successfully."
    });

  } catch (error) {
    console.error("Delete Package Error:", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Error deleting package.",
      error: error.message
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
    const { categoryKey, pageName, title, price, points } = req.body;

    if (!categoryKey || !pageName || !title || price === undefined || !Array.isArray(points) || points.length < 1 || points.length > 4) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Invalid input. Points must be 1–4."
      });
    }

    const categoryDoc = await CategoryPackage.findOne({ categoryKey });
    if (!categoryDoc) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Category not found."
      });
    }

    let page = categoryDoc.pages.find(p => p.pageName === pageName);

    if (page) {
      if (page.packages.length >= 4) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: "Max 4 packages allowed per page."
        });
      }

      page.packages.push({
        title,
        price,
        points: points.map(p => ({ text: p }))
      });

    } else {
      categoryDoc.pages.push({
        pageName,
        packages: [
          {
            title,
            price,
            points: points.map(p => ({ text: p }))
          }
        ]
      });
    }

    const saved = await categoryDoc.save();

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Category package added successfully.",
      data: saved
    });

  } catch (error) {
    console.error("Create Category Package Error:", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Server error.",
      error: error.message
    });
  }
};



export const getCategoryPackages = async (req, res) => {
  try {
    const { categoryKey, pageName } = req.query;

    if (categoryKey) {
      const doc = await CategoryPackage.findOne({ categoryKey });
      if (!doc) {
        return res.status(404).json({
          success: false,
          statusCode: 404,
          message: "Category not found."
        });
      }

      if (pageName) {
        const page = doc.pages.find(p => p.pageName === pageName);
        if (!page) {
          return res.status(404).json({
            success: false,
            statusCode: 404,
            message: "Page not found."
          });
        }

        return res.status(200).json({
          success: true,
          statusCode: 200,
          data: page.packages
        });
      }

      return res.status(200).json({
        success: true,
        statusCode: 200,
        data: doc
      });
    }

    const all = await CategoryPackage.find({});
    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: all
    });

  } catch (error) {
    console.error("Get Category Packages Error:", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Server error.",
      error: error.message
    });
  }
};



export const updateCategoryPackage = async (req, res) => {
  try {
    const { categoryKey, pageName, packageId } = req.params;
    const { title, price, points } = req.body;

    const doc = await CategoryPackage.findOne({ categoryKey });
    if (!doc) return res.status(404).json({ success: false, message: "Category not found." });

    const page = doc.pages.find(p => p.pageName === pageName);
    if (!page) return res.status(404).json({ success: false, message: "Page not found." });

    const pkg = page.packages.id(packageId);
    if (!pkg) return res.status(404).json({ success: false, message: "Package not found." });

    // Update fields
    if (title) pkg.title = title;
    if (price !== undefined) pkg.price = price;

    if (points) {
      if (!Array.isArray(points) || points.length === 0 || points.length > 4) {
        return res.status(400).json({
          success: false,
          message: "Points must be 1–4."
        });
      }
      pkg.points = points.map(p => ({ text: p }));
    }

    pkg.updatedAt = Date.now();

    await doc.save();

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Category package updated successfully.",
      data: pkg
    });

  } catch (error) {
    console.error("Update Category Package Error:", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Server error.",
      error: error.message
    });
  }
};



export const deleteCategoryPackage = async (req, res) => {
  try {
    const { categoryKey, pageName, packageId } = req.params;

    const doc = await CategoryPackage.findOne({ categoryKey });
    if (!doc) return res.status(404).json({ success: false, message: "Category not found." });

    const page = doc.pages.find(p => p.pageName === pageName);
    if (!page) return res.status(404).json({ success: false, message: "Page not found." });

    const pkg = page.packages.id(packageId);
    if (!pkg) return res.status(404).json({ success: false, message: "Package not found." });

    pkg.remove();
    await doc.save();

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Package deleted successfully."
    });

  } catch (error) {
    console.error("Delete Category Package Error:", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Server error.",
      error: error.message
    });
  }
};



export const getCategoryPageCounts = async (req, res) => {
  try {
    const { categoryKey } = req.params;

    const doc = await CategoryPackage.findOne({ categoryKey });
    if (!doc) return res.status(404).json({ success: false, message: "Category not found." });

    const counts = doc.pages.map(p => ({
      pageName: p.pageName,
      count: p.packages.length
    }));

    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: counts
    });

  } catch (error) {
    console.error("Get Page Counts Error:", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Server error.",
      error: error.message
    });
  }
};
