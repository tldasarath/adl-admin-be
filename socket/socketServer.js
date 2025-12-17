// socket/socketServer.js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { verifySocketToken } from './socketAuth.js'; // small helper below

let ioInstance = null;

/**
 * Initialize Socket.IO with an existing HTTP server.
 * - server: http.Server instance
 * - appOrigins: array of allowed origins for CORS
 */
export function initSocketServer(server, { appOrigins = ['http://localhost:5173', 'http://localhost:3000'] } = {}) {
  if (ioInstance) return ioInstance;

  const io = new Server(server, {
    cors: {
      origin: appOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingInterval: 25000,
    pingTimeout: 60000
  });

  // Socket auth: expect token in socket.handshake.auth.token
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error: token required'));

      const user = await verifySocketToken(token); // custom verify that checks JWT and admin role
      if (!user || !user.isAdmin) return next(new Error('Unauthorized'));

      socket.user = user; // attach for later use
      return next();
    } catch (err) {
      return next(new Error('Unauthorized: ' + err.message));
    }
  });

  io.on('connection', socket => {
    console.log(`Socket connected: ${socket.id} user:${socket.user?.email || socket.user?.id}`);
    // join admins room
    socket.join('admins');

    // Optional: client can request a one-off snapshot
    socket.on('analytics:requestSnapshot', async (cb) => {
      // cb is callback to return data or error
      try {
        // prefer to call a REST endpoint or analyticsService directly here to fetch a single snapshot
        const analyticsService = await import('../services/analyticsService.js');
        const data = await analyticsService.getOverview({ days: 1 });
        cb({ success: true, data });
      } catch (e) {
        cb({ success: false, message: e.message });
      }
    });

    // rate-limited ping from client (avoid flooding server)
    socket.on('disconnect', reason => {
      console.log('Socket disconnected:', socket.id, reason);
    });
  });

  ioInstance = io;
  return ioInstance;
}

export function getIo() {
  return ioInstance;
}
