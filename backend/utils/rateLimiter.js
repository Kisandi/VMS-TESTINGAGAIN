// utils/rateLimiter.js
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    handler: (req, res) => {
        return res.status(429).json({
            success: false,
            message: 'Too many login attempts. Please try again after 15 minutes.',
        });
    },
    keyGenerator: (req) => req.ip,
    standardHeaders: true,
    legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes window
    max: 3, // Allow 3 requests per window
    handler: (req, res) => {
        return res.status(429).json({
            success: false,
            message: 'Too many password reset requests. Try again in 30 minutes.',
        });
    },
    keyGenerator: (req) => req.ip,
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {loginLimiter, forgotPasswordLimiter};
