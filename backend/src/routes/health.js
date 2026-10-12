const express = require('express');
const { testConnection } = require('../config/database');

const router = express.Router();
const API_VERSION = '1.0.0';

/**
 * @route   GET /api/health
 * @desc    Health check endpoint returning API & database connectivity status
 * @access  Public
 */
router.get('/', async (req, res) => {
  const currentTimestamp = new Date().toISOString();

  try {
    const dbTest = await testConnection();

    return res.status(200).json({
      status: 'healthy',
      version: API_VERSION,
      timestamp: currentTimestamp,
      database: {
        status: 'connected',
        timestamp: dbTest.timestamp,
      },
    });
  } catch (error) {
    console.error('[Health Check DB Error]:', error.message);

    return res.status(503).json({
      status: 'degraded',
      version: API_VERSION,
      timestamp: currentTimestamp,
      database: {
        status: 'disconnected',
        error: error.message,
      },
    });
  }
});

module.exports = router;
