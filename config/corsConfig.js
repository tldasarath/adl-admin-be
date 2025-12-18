// config/corsConfig.js
/**
 * CORS Configuration Module - Enterprise Grade
 * Centralized, secure, and environment-aware CORS setup
 * @module corsConfig
 */

import { config } from './environment.js';

/**
 * Parse and validate origins from environment
 * @returns {string[]} Array of validated origins
 */
const parseOrigins = () => {
  const envOrigins = process.env.CORS_ORIGINS;
  
  // Development defaults
  const developmentOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
  ];

  if (!envOrigins) {
    if (config.isProduction) {
      throw new Error('❌ CORS_ORIGINS must be set in production');
    }
    console.warn('⚠️  CORS_ORIGINS not set, using development defaults');
    return developmentOrigins;
  }

  try {
    // Handle JSON array format
    if (envOrigins.trim().startsWith('[')) {
      const parsed = JSON.parse(envOrigins);
      if (!Array.isArray(parsed)) {
        throw new Error('CORS_ORIGINS must be an array');
      }
      return parsed.map(origin => origin.trim()).filter(Boolean);
    }

    // Handle comma-separated format
    return envOrigins
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean);
  } catch (error) {
    console.error('❌ Failed to parse CORS_ORIGINS:', error.message);
    if (config.isProduction) {
      throw new Error('Invalid CORS_ORIGINS configuration in production');
    }
    return developmentOrigins;
  }
};

/**
 * Validate origin URL format
 * @param {string} origin - Origin URL to validate
 * @returns {boolean} True if valid
 */
const isValidOrigin = (origin) => {
  try {
    const url = new URL(origin);
    
    // Production: Only HTTPS (except localhost)
    if (config.isProduction) {
      if (!origin.startsWith('https://') && !origin.includes('localhost')) {
        console.error(`❌ Production origin must use HTTPS: ${origin}`);
        return false;
      }
    }
    
    // Must have valid protocol
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

/**
 * Dynamic origin validator with logging
 * @param {string[]} allowedOrigins - Whitelist of origins
 * @returns {Function} CORS origin validator
 */
const createOriginValidator = (allowedOrigins) => {
  return (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) {
      return callback(null, true);
    }

    // Check whitelist
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log blocked attempts in production for security monitoring
      if (config.isProduction) {
        console.warn(`🚫 CORS blocked: ${origin} at ${new Date().toISOString()}`);
      } else {
        console.warn(`🚫 CORS blocked origin: ${origin}`);
        console.log('   Allowed origins:', allowedOrigins);
      }
      callback(new Error('Not allowed by CORS policy'));
    }
  };
};

/**
 * Main CORS configuration for Express
 * @returns {Object} CORS options for Express middleware
 */
export const getCorsConfig = () => {
  const allowedOrigins = parseOrigins();
  
  // Validate all origins
  const invalidOrigins = allowedOrigins.filter(o => !isValidOrigin(o));
  if (invalidOrigins.length > 0) {
    console.error('❌ Invalid origins detected:', invalidOrigins);
    if (config.isProduction) {
      throw new Error('Invalid CORS origins in production');
    }
  }

  // Log configuration
  console.log('\n🌐 CORS Configuration Loaded:');
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Allowed Origins: ${config.isProduction ? '[REDACTED FOR SECURITY]' : JSON.stringify(allowedOrigins, null, 2)}`);
  console.log(`   Credentials: enabled`);
  console.log(`   Max Age: 24 hours\n`);

  return {
    origin: createOriginValidator(allowedOrigins),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
      'Accept',
      'Origin'
    ],
    exposedHeaders: [
      'Set-Cookie',
      'X-Total-Count',
      'X-Page-Count',
      'X-Current-Page'
    ],
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 204
  };
};

/**
 * Socket.IO specific CORS configuration
 * @returns {Object} Socket.IO CORS options
 */
export const getSocketCorsConfig = () => {
  const allowedOrigins = parseOrigins();
  
  console.log('🔌 Socket.IO CORS configured for:', 
    config.isProduction ? '[REDACTED]' : allowedOrigins
  );
  
  return {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    transports: ['websocket', 'polling']
  };
};

/**
 * Development CORS debugging middleware
 * Logs detailed CORS information for troubleshooting
 */
export const corsDebugMiddleware = (req, res, next) => {
  if (!config.isDevelopment) {
    return next();
  }

  const origin = req.headers.origin;
  console.log('\n📨 CORS Request Debug:');
  console.log(`   Origin: ${origin || 'No origin header'}`);
  console.log(`   Method: ${req.method}`);
  console.log(`   Path: ${req.path}`);
  console.log(`   Credentials: ${req.headers.cookie ? 'Present' : 'None'}`);
  
  // Log response headers after response is sent
  const originalSend = res.send;
  res.send = function(data) {
    console.log('   Response CORS Headers:');
    console.log(`      Access-Control-Allow-Origin: ${res.getHeader('Access-Control-Allow-Origin') || 'Not set'}`);
    console.log(`      Access-Control-Allow-Credentials: ${res.getHeader('Access-Control-Allow-Credentials') || 'Not set'}\n`);
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Preflight request handler for complex requests
 * Handles OPTIONS requests explicitly
 */
export const handlePreflightRequests = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
  } else {
    next();
  }
};

/**
 * Export all CORS utilities
 */
export default {
  getCorsConfig,
  getSocketCorsConfig,
  corsDebugMiddleware,
  handlePreflightRequests
};