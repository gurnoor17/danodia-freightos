const { verifyToken } = require('../utils/jwt');
const { getUserProfile } = require('../services/auth.service');

/**
 * Middleware to authenticate requests using JWT Bearer tokens.
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. Missing or malformed authorization header.',
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. Token missing.',
    });
  }

  try {
    // 1. Verify token signature, expiration, issuer, audience, and algorithm
    const decoded = verifyToken(token);

    if (!decoded.sub) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token payload: missing subject identifier.',
      });
    }

    // 2. Retrieve user profile to confirm user still exists in the database
    const user = await getUserProfile(decoded.sub);

    // 3. Attach authenticated user to request context
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication token has expired. Please log in again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid authentication token.',
      });
    }

    // AuthError from user lookup
    if (error.statusCode === 401) {
      return res.status(401).json({
        status: 'error',
        message: error.message,
      });
    }

    return res.status(401).json({
      status: 'error',
      message: 'Authentication failed.',
    });
  }
};

module.exports = authenticateToken;
