import jwt from "jsonwebtoken";

const secret = process.env.UNSUBSCRIBE_JWT_SECRET || "fallback_secret";

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
