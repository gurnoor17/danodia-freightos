/**
 * Centralized application error handling middleware.
 */
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  const isDev = process.env.NODE_ENV === 'development';

  // Sanitize logged message to never output sensitive request headers or tokens
  console.error(`[Error] ${req.method} ${req.originalUrl} - Status ${statusCode}:`, err.message);
  if (isDev && statusCode === 500) {
    console.error(err.stack);
  }

  // Handle unique constraint violation from postgres (e.g. 23505) safely if uncaught
  if (err.code === '23505') {
    return res.status(409).json({
      status: 'error',
      message: 'A record with the specified unique field already exists',
    });
  }

  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(isDev && statusCode === 500 && { stack: err.stack }),
  });
};

module.exports = errorMiddleware;
