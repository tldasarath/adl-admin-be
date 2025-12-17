import { herosection } from "../../models/hero.js";

// GET hero section
export const getHeroSection = async (req, res) => {
  try {
    let hero = await herosection.findOne();

    // If doesn't exist, create a blank one
    if (!hero) {
      hero = await herosection.create({
        title: "",
        description: "",
        buttonText: "",
        buttonUrl: "",
      });
    }

    return res.json({ success: true, data: hero });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE hero section
export const updateHeroSection = async (req, res) => {
  try {
    const { title, description, buttonText, buttonUrl } = req.body;

    let hero = await herosection.findOne();

    if (!hero) {
      hero = new herosection({
        title,
        description,
        buttonText,
        buttonUrl,
      });
    } else {
      hero.title = title;
      hero.description = description;
      hero.buttonText = buttonText;
      hero.buttonUrl = buttonUrl;
    }

    await hero.save();

    return res.json({
      success: true,
      message: "Hero Section updated successfully",
      data: hero,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
