import { FAQ } from "../../models/faqModel.js";

export const addFAQ = async (req, res) => {
  try {
    const { question, answer, section, order } = req.body;

    const faq = await FAQ.create({ question, answer, section, order });

    res.status(201).json({
      success: true,
      message: "FAQ created successfully",
      data: faq,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to create FAQ",
      error: error.message,
    });
  }
};

export const getFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ order: 1 });
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

export const updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, home, order } = req.body;

    const faq = await FAQ.findByIdAndUpdate(
      id,
      { question, answer, home, order },
      { new: true }
    );

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "FAQ updated successfully",
      data: faq,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update FAQ",
      error: error.message,
    });
  }
};

export const deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;

    const faq = await FAQ.findByIdAndDelete(id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "FAQ deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to delete FAQ",
      error: error.message,
    });
  }
};
export const homeFAQ = async (req, res) => {
  try {
    
    const { id } = req.params;
    const { home } = req.body;

    const faq = await FAQ.findByIdAndUpdate(
      id,
      { home },
      { new: true }
    );

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "Failed to add FAQ to home section",
      });
    }

    res.status(200).json({
      success: true,
      message: "FAQ added to home section successfully",
      data: faq, // return updated FAQ if you want
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update FAQ home section",
      error: error.message,
    });
  }
};
export const editFAQOrder = async (req, res) => {
  try {
    
    const { id } = req.params;
    const { order } = req.body;
    const faq = await FAQ.findByIdAndUpdate(
      id,
      { order },
      { new: true }
    );

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "Failed to add FAQ to home section",
      });
    }

    res.status(200).json({
      success: true,
      message: "FAQ added to home section successfully",
      data: faq, // return updated FAQ if you want
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update FAQ home section",
      error: error.message,
    });
  }
};
