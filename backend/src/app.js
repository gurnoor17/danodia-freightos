const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth.routes');
const shipmentRoutes = require('./routes/shipment.routes');
const watchlistRoutes = require('./routes/watchlist.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const errorMiddleware = require('./middleware/error.middleware');

const app = express();

// CORS configuration for frontend
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(
  cors({
    origin: [frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing middleware with strict request size limits for security
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/analytics', analyticsRoutes);

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
