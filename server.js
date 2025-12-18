// server.js
import env from 'dotenv';
env.config();
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import http from 'http';

// Config imports
import { config } from './config/environment.js';
import { getCorsConfig, corsDebugMiddleware } from './config/corsConfig.js';
import { securityHeaders, apiLimiter, authLimiter } from './config/security.js';
import connectDB from './config/connectDb.js';

// Route imports
import adminroute from './route/admin/indexRoute.js';
import publicRoute from './route/public/indexRoute.js';

// Socket imports
import { initSocketServer } from './socket/socketServer.js';
import { startPoller } from './socket/poller.js';

const app = express();
const server = http.createServer(app);

// ============ MIDDLEWARE ============
app.use(securityHeaders);
app.use(morgan(config.isProduction ? 'combined' : 'dev'));
app.use(cookieParser());

// CORS
app.use(cors(getCorsConfig()));
if (config.isDevelopment) {
  app.use(corsDebugMiddleware);
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (production only)
if (config.isProduction) {
  app.use('/api', apiLimiter);
  app.use('/api/v1/admin/auth', authLimiter);
}

// ============ ROUTES ============
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    env: config.nodeEnv,
    timestamp: new Date().toISOString() 
  });
});

app.use('/public/v1', publicRoute);
app.use('/api/v1/admin', adminroute);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: config.isProduction ? 'Internal server error' : err.message
  });
});

// ============ SERVER STARTUP ============
let io = null;

async function startServer() {
  try {
    await connectDB();
    console.log('✅ Database connected');

    const { getSocketCorsConfig } = await import('./config/corsConfig.js');
    io = initSocketServer(server, { corsOptions: getSocketCorsConfig() });
    console.log('✅ Socket.IO initialized');

    startPoller({ pollMs: config.analytics.pollMs });
    console.log('✅ Analytics poller started');

    server.listen(config.port, () => {
      console.log(`\n🚀 Server running on port ${config.port}`);
      console.log(`📍 Environment: ${config.nodeEnv}`);
      console.log(`🌐 CORS configured\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
async function shutdown(signal) {
  console.log(`\n⚠️  ${signal} received, closing server...`);
  server.close(() => console.log('✅ HTTP server closed'));
  if (io?.close) {
    await io.close();
    console.log('✅ Socket.IO closed');
  }
  setTimeout(() => process.exit(0), 1000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));