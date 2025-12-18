// config/security.js
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './environment.js';

export const securityHeaders = helmet({
  contentSecurityPolicy: config.isProduction ? undefined : false,
  hsts: config.isProduction ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false
});

export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.isDevelopment // Skip in development
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later.'
});