const express = require('express');
const authenticateToken = require('../middleware/auth.middleware');
const analyticsController = require('../controllers/analytics.controller');

const router = express.Router();

// Enforce JWT authentication on analytics endpoint
router.use(authenticateToken);

router.get('/', analyticsController.getAnalytics);

module.exports = router;
