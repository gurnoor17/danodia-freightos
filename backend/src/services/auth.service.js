const bcrypt = require('bcrypt');
const { query } = require('../config/database');
const { generateToken } = require('../utils/jwt');

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Custom error class carrying HTTP status code.
 */
class AuthError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

/**
 * Registers a new user.
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<object>} The newly created safe user profile.
 */
const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  // 1. Check if user with this email already exists
  const existingUserCheck = await query(
    'SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [normalizedEmail]
  );

  if (existingUserCheck.rows.length > 0) {
    throw new AuthError('An account with this email address already exists', 409);
  }

  // 2. Hash password with bcrypt
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // 3. Insert new user into database with parameterized query
  const insertResult = await query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at, updated_at`,
    [trimmedName, normalizedEmail, passwordHash]
  );

  const newUser = insertResult.rows[0];

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    created_at: newUser.created_at,
    updated_at: newUser.updated_at,
  };
};

/**
 * Authenticates user credentials and returns a JWT access token.
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<{ token: string, user: object }>}
 */
const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Query user by email
  const userResult = await query(
    `SELECT id, name, email, password_hash, created_at, updated_at
     FROM users
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [normalizedEmail]
  );

  if (userResult.rows.length === 0) {
    // Generic error message to prevent account enumeration
    throw new AuthError('Invalid email or password', 401);
  }

  const user = userResult.rows[0];

  // 2. Verify password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AuthError('Invalid email or password', 401);
  }

  // 3. Issue signed JWT token
  const token = generateToken(user.id);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
  };
};

/**
 * Retrieves the authenticated user's profile by ID.
 * @param {string} userId
 * @returns {Promise<object>} Safe user profile.
 */
const getUserProfile = async (userId) => {
  const result = await query(
    `SELECT id, name, email, created_at, updated_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AuthError('User account not found or no longer active', 401);
  }

  return result.rows[0];
};

module.exports = {
  AuthError,
  registerUser,
  loginUser,
  getUserProfile,
};
