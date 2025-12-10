import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "/ADL/adl_blogs", // Cloudinary folder name
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

// Single image upload
const upload = multer({ storage });

export default upload;


const galleryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "/ADL/adl_gallery",  
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});
export const uploadGalleryImage = multer({ storage: galleryStorage });


const packageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ADL/adl_packages',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  }
});

export const uploadPackageImage = multer({ storage: packageStorage });