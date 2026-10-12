const express = require('express');
const authenticateToken = require('../middleware/auth.middleware');
const watchlistController = require('../controllers/watchlist.controller');

const router = express.Router();

// Enforce JWT authentication on all watchlist endpoints
router.use(authenticateToken);

router.get('/', watchlistController.list);
router.get('/ids', watchlistController.getIds);
router.post('/:shipmentId', watchlistController.add);
router.delete('/:shipmentId', watchlistController.remove);

module.exports = router;
