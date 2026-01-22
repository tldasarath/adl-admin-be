import mongooseInstance from "../config/mongooseInstance.js";
const enquirySchema = new mongooseInstance.Schema({
  firstName: {
    type: String,
    required: true,
    
  },
  lastName: {
    type: String,
    required: true,

  },
  email: {
    type: String,
    required: true,

  },
  message: {
    type: String,
    required: true,
  },
  enquiryDate: {
    type: Date,
    default: Date.now()
  }
}, { timestamps: true });

const Enquiry =
  mongooseInstance.models.Enquiry || mongooseInstance.model("Enquiry", enquirySchema);

export default Enquiry;
