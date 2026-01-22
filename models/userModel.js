
import mongooseInstance from "../config/mongooseInstance.js";

import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

const userSchema = new mongooseInstance.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["superadmin", "admin"], default: "admin" },
    isActive: { type: Boolean, default: true },
    refreshToken: { type: String },
    verify: { type: Boolean, default: true }, 
  },
  { timestamps: true }
);


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});


userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongooseInstance.models.User || mongooseInstance.model("User", userSchema);
export default User;
