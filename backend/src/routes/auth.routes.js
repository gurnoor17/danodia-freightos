const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { registerSchema, loginSchema, validateBody } = require('../validators/auth.validator');
const authenticateToken = require('../middleware/auth.middleware');

const router = express.Router();

// Rate limiting for authentication endpoints to prevent brute-force attacks
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 authentication requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

// Public endpoints with rate limiting & schema validation
router.post('/register', authRateLimiter, validateBody(registerSchema), authController.register);
router.post('/login', authRateLimiter, validateBody(loginSchema), authController.login);
router.post('/logout', authController.logout);

// Protected endpoint requiring valid JWT
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
