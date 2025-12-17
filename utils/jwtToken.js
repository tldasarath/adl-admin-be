import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
const secret = process.env.UNSUBSCRIBE_JWT_SECRET || "fallback_secret";

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

export const generateRefreshToken = (payload)=>{
  return jwt.sign(
    payload,
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );}

export function signUnsubscribe(email) {
  return jwt.sign({ email }, secret);
}

export function verifyUnsubscribe(token) {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
}