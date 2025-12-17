// socket/socketAuth.js
import jwt from 'jsonwebtoken';

/**
 * Verify a socket token (JWT)
 * Should match your existing auth scheme. It must return user object { id, email, isAdmin }.
 */
export async function verifySocketToken(token) {
  if (!token) throw new Error('Token missing');

  // token may be "Bearer <token>" or raw token
  const raw = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set in env');

  try {
    const payload = jwt.verify(raw, secret);
    // You may want to fetch the user from DB or check role; keep light here
    // Example expected payload: { id, email, roles: ['admin'] }
    const user = {
      id: payload.id || payload._id,
      email: payload.email,
      isAdmin: Array.isArray(payload.roles) ? payload.roles.includes('admin') : !!payload.isAdmin
    };
    return user;
  } catch (e) {
    throw new Error('Invalid token: ' + e.message);
  }
}
