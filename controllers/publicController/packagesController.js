import CommonPackage from "../../models/CommonPackage.js";
import  { categoryPackage } from "../../models/CategoryPackage.js";




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




// export const getCategoryPackages = async (req, res) => {
//   try {
//     const { categoryKey, pageName } = req.query;

//     if (categoryKey) {
//       const doc = await CategoryPackage.findOne({ categoryKey });
//       if (!doc) {
//         return res.status(404).json({
//           success: false,
//           statusCode: 404,
//           message: "Category not found."
//         });
//       }

//       if (pageName) {
//         const page = doc.pages.find(p => p.pageName === pageName);
//         if (!page) {
//           return res.status(404).json({
//             success: false,
//             statusCode: 404,
//             message: "Page not found."
//           });
//         }

//         return res.status(200).json({
//           success: true,
//           statusCode: 200,
//           data: page.packages
//         });
//       }

//       return res.status(200).json({
//         success: true,
//         statusCode: 200,
//         data: doc
//       });
//     }

//     const all = await CategoryPackage.find({});
//     return res.status(200).json({
//       success: true,
//       statusCode: 200,
//       data: all
//     });

//   } catch (error) {
//     console.error("Get Category Packages Error:", error);
//     return res.status(500).json({
//       success: false,
//       statusCode: 500,
//       message: "Server error.",
//       error: error.message
//     });
//   }
// };


export const getCategoryPackages = async (req, res) => {
  try {
    const {  url } = req.params;
    console.log(url);
    
    const packages = await categoryPackage.find({innerPage:url}).sort({ updatedAt: -1 });

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