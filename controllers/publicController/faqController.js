import { FAQ } from "../../models/faqModel.js";



export const getFAQs = async (req, res) => {
  try {
        const { faq } = req.params;

    
    const faqs = await FAQ.find({section:faq}).sort({ order: 1 });
    res.status(200).json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch FAQs",
      error: error.message,
    });
  }
};


