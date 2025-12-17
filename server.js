// server.js
import env from 'dotenv';
env.config(); // <-- must run before reading process.env

import express from 'express';
import cors from 'cors';
import connectDB from './config/connectDb.js';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import adminroute from './route/admin/indexRoute.js';
import publicRoute from './route/public/indexRoute.js';
import cookieParser from 'cookie-parser';
import http from 'http';
import { initSocketServer } from './socket/socketServer.js';
import { startPoller } from './socket/poller.js';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(morgan("dev"));

app.use(cookieParser()); 
// Connect DB
connectDB();

// Cors - allow your frontend origins
app.use(cors({
  origin: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
            .split(',')
            .map(s => s.trim()),
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes (mounted before server start - that's fine)
app.use('/public/v1', publicRoute);
app.use('/api/v1/admin', adminroute);

// Port (fallback safe default)
const PORT = Number(process.env.PORT) || 8080;

// Create HTTP server for Socket.IO to attach to
const server = http.createServer(app);

let io = null; // will hold socket io instance

async function startServer() {
  try {
    // 1) Connect database (ensure connectDB returns a Promise)
    await connectDB();
    console.log('MongoDB connected successfully (server startup).');

    // 2) Initialize Socket.IO (attach to HTTP server).
    // Pass origins from env or defaults
    const appOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',').map(s => s.trim());
    io = initSocketServer(server, { appOrigins });

    // 3) Start poller AFTER DB connected and socket server initialized
    startPoller({ pollMs: Number(process.env.ANALYTICS_POLL_MS || 15000) });

    // 4) Start HTTP server
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown: close server, socket and exit cleanly
async function shutdown(signal) {
  console.log(`Received ${signal} - closing server...`);
  try {
    // stop accepting new connections
    server.close(err => {
      if (err) console.error('Error closing server:', err);
      else console.log('HTTP server closed.');
    });

    // close socket.io (if running)
    if (io && io.close) {
      await io.close();
      console.log('Socket.IO server closed.');
    }

    // Optional: if your poller has cleanup/releaseLock, ensure it's invoked by process events in poller.js
    // Give a short grace period then exit
    setTimeout(() => process.exit(0), 1000);
  } catch (e) {
    console.error('Shutdown error:', e);
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
