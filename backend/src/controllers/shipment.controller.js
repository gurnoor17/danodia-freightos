const shipmentService = require('../services/shipment.service');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(id) {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

/**
 * Controller for creating a shipment.
 */
async function create(req, res, next) {
  try {
    const shipment = await shipmentService.createShipment(req.user.id, req.body);
    return res.status(201).json({
      status: 'success',
      data: { shipment },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for listing shipments with search, filtering, and pagination.
 */
async function list(req, res, next) {
  try {
    const result = await shipmentService.getShipments(req.user.id, req.query);
    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for getting dashboard summary card aggregates.
 */
async function getSummary(req, res, next) {
  try {
    const summary = await shipmentService.getShipmentSummary(req.user.id);
    return res.status(200).json({
      status: 'success',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for retrieving a single shipment by ID.
 */
async function getById(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidUuid(id)) {
      return res.status(404).json({
        status: 'error',
        message: 'Shipment not found',
      });
    }

    const shipment = await shipmentService.getShipmentById(req.user.id, id);
    if (!shipment) {
      return res.status(404).json({
        status: 'error',
        message: 'Shipment not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { shipment },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for updating an existing shipment.
 */
async function update(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidUuid(id)) {
      return res.status(404).json({
        status: 'error',
        message: 'Shipment not found',
      });
    }

    const updated = await shipmentService.updateShipment(req.user.id, id, req.body);
    if (!updated) {
      return res.status(404).json({
        status: 'error',
        message: 'Shipment not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { shipment: updated },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for deleting a shipment.
 */
async function remove(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidUuid(id)) {
      return res.status(404).json({
        status: 'error',
        message: 'Shipment not found',
      });
    }

    const deleted = await shipmentService.deleteShipment(req.user.id, id);
    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Shipment not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Shipment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  list,
  getSummary,
  getById,
  update,
  remove,
};
