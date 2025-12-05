import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
const secret = process.env.UNSUBSCRIBE_JWT_SECRET || "fallback_secret";

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};


export function signUnsubscribe(email) {
  // short expiry or no expiry depending on design; we can include createdAt to validate
  return jwt.sign({ email }, secret);
}

export function verifyUnsubscribe(token) {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
}