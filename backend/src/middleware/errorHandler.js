/**
 * Centralized error handling middleware.
 * Formats errors into consistent JSON responses.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || res.statusCode >= 400 ? res.statusCode : 500;
  const isDev = process.env.NODE_ENV === 'development';

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = errorHandler;
