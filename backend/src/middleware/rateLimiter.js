const rateLimit = require('express-rate-limit');

const isProd = process.env.NODE_ENV === 'production';

// Strict limiter for authentication endpoints — prevents brute-force attacks
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,                  // 15-minute window
  max:             isProd ? 20 : 10_000,             // 20 attempts per window in prod
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { message: 'Too many login attempts, please try again later.' },
  skip:            () => !isProd,
});

// General API limiter — prevents scraping / DoS
const apiLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             isProd ? 500 : 10_000,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { message: 'Too many requests, please try again later.' },
  skip:            () => !isProd,
});

module.exports = { authLimiter, apiLimiter };
