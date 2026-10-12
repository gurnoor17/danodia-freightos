const jwt = require('jsonwebtoken');

const JWT_ISSUER = 'Danodia-FreightOS';
const JWT_AUDIENCE = 'danodia-freightos-client';
const JWT_ALGORITHM = 'HS256';

/**
 * Signs a short-lived access JWT containing the user ID in the `sub` claim.
 * @param {string} userId - The unique UUID of the user.
 * @returns {string} Signed JWT access token.
 */
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is missing from environment variables');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '15m';

  return jwt.sign({}, secret, {
    subject: String(userId),
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn,
    algorithm: JWT_ALGORITHM,
  });
};

/**
 * Verifies a JWT access token, validating signature, algorithm, issuer, audience, and expiration.
 * @param {string} token - The JWT string to verify.
 * @returns {object} Decoded token payload.
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is missing from environment variables');
  }

  return jwt.verify(token, secret, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithms: [JWT_ALGORITHM],
  });
};

module.exports = {
  generateToken,
  verifyToken,
  JWT_ISSUER,
  JWT_AUDIENCE,
  JWT_ALGORITHM,
};
