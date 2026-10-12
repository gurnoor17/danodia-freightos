const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth.routes');
const shipmentRoutes = require('./routes/shipment.routes');
const watchlistRoutes = require('./routes/watchlist.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const errorMiddleware = require('./middleware/error.middleware');

const app = express();

// Standard HTTP Security Headers (defense-in-depth)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Robust CORS configuration supporting production domains, Vercel previews, and local dev
const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach((url) => {
    const trimmed = url.trim().replace(/\/$/, '');
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman, health check probes)
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/$/, '');
      if (
        allowedOrigins.includes(normalizedOrigin) ||
        normalizedOrigin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked request from origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing middleware with strict request size limits for security
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// API Routes (Mounted under /api standard, and root aliases for client resilience)
app.use('/api/health', healthRoutes);
app.use('/health', healthRoutes);

app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/shipments', shipmentRoutes);
app.use('/shipments', shipmentRoutes);

app.use('/api/watchlist', watchlistRoutes);
app.use('/watchlist', watchlistRoutes);

app.use('/api/analytics', analyticsRoutes);
app.use('/analytics', analyticsRoutes);

// Root informational route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Shipment Manager (Danodia FreightOS) API',
    status: 'online',
    phase: 2,
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout',
      },
    },
  });
});

// Handle 404 for unmatched routes
app.use((req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Global centralized error handling middleware
app.use(errorMiddleware);

module.exports = app;
