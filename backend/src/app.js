const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS configuration
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(
  cors({
    origin: [frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/health', healthRoutes);

// Root path informational route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Shipment Manager (Danodia FreightOS) API',
    status: 'online',
    phase: 1,
    endpoints: {
      health: '/api/health',
    },
  });
});

// Handle 404 for unmatched routes
app.use((req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Global error handling middleware
app.use(errorHandler);

module.exports = app;
