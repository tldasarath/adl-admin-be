import mongooseInstance from "../config/mongooseInstance.js";

const gallerySchema = new mongooseInstance.Schema(
  {
    image: {
      type: String,
      required: true,
    },

  
  },
  { timestamps: true }
);


const Gallery =
  mongooseInstance.models.Gallery || mongooseInstance.model("Gallery", gallerySchema);

export default Gallery;
