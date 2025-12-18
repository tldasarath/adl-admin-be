// config/environment.js
export const config = {
  // Server
  port: Number(process.env.PORT) || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Booleans
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
  
  // Database - FIX: Changed from MONGODB_URI to MONGO_URL
  db: {
    uri: process.env.MONGO_URL,  // ⭐ Changed this
    options: {
      maxPoolSize: Number(process.env.DB_POOL_SIZE) || 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },
  
  // CORS
  cors: {
    origins: process.env.CORS_ORIGINS,
    credentials: process.env.CORS_CREDENTIALS !== 'false'
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.REFRESH_TOKEN_SECRET,  // ⭐ Fixed name
    accessExpiry: process.env.JWT_EXPIRES_IN || '1d',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 min
    max: Number(process.env.RATE_LIMIT_MAX) || 100
  },
  
  // Analytics
  analytics: {
    pollMs: Number(process.env.ANALYTICS_POLL_MS) || 15000
  },
  
  // Website
  website: {
    baseUrl: process.env.WEBSITE_BASE_URL || 'http://localhost:3000'
  },
  
  // Email
  email: {
    from: process.env.EMAIL_FROM,
    smtp: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  },
  
  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  
  // Security
  recaptcha: {
    secretKey: process.env.RECAPTCHA_SECRET_KEY
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
  }
};

export default config;
