const express = require('express');
const authenticateToken = require('../middleware/auth.middleware');
const { validateBody } = require('../validators/auth.validator');
const {
  createShipmentSchema,
  updateShipmentSchema,
} = require('../validators/shipment.validator');
const shipmentController = require('../controllers/shipment.controller');

const router = express.Router();

// Enforce JWT authentication on all shipment routes
router.use(authenticateToken);

// Aggregate summary endpoint for dashboard cards
router.get('/summary', shipmentController.getSummary);

// List shipments with search, filtering, and pagination
router.get('/', shipmentController.list);

// Create shipment
router.post('/', validateBody(createShipmentSchema), shipmentController.create);

// Get shipment by ID
router.get('/:id', shipmentController.getById);

// Update shipment
router.patch('/:id', validateBody(updateShipmentSchema), shipmentController.update);

// Delete shipment
router.delete('/:id', shipmentController.remove);

module.exports = router;
