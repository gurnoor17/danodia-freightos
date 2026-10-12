const Joi = require('joi');

const REGION_OPTIONS = ['USA', 'UK', 'Germany', 'Walmart US'];
const STATUS_OPTIONS = ['In Transit', 'Delivered', 'Pending Customs', 'Booked', 'Cancelled'];

/**
 * Validates date sequencing:
 * - sailing_date must not be before pickup_date
 * - expected_eta must not be before sailing_date
 * - actual_arrival (if present) must not be before pickup_date
 */
const validateDateOrder = (data, helpers) => {
  const { pickup_date, sailing_date, expected_eta, actual_arrival } = data;

  if (pickup_date && sailing_date) {
    if (new Date(sailing_date) < new Date(pickup_date)) {
      return helpers.message('Sailing date cannot precede pickup date');
    }
  }

  if (sailing_date && expected_eta) {
    if (new Date(expected_eta) < new Date(sailing_date)) {
      return helpers.message('Expected ETA cannot precede sailing date');
    }
  }

  if (pickup_date && actual_arrival) {
    if (new Date(actual_arrival) < new Date(pickup_date)) {
      return helpers.message('Actual arrival date cannot precede pickup date');
    }
  }

  return data;
};

const createShipmentSchema = Joi.object({
  region: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Region / Origin is required',
      'any.required': 'Region / Origin is required',
    }),
  category: Joi.string().trim().allow('', null).optional(),
  assigned_manager: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Assigned manager is required',
      'any.required': 'Assigned manager is required',
    }),
  invoice_no: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Invoice number is required',
      'any.required': 'Invoice number is required',
    }),
  fba_id: Joi.string().trim().allow('', null).max(100).optional(),
  container_no: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Container number is required',
      'any.required': 'Container number is required',
    }),
  number_of_boxes: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.base': 'Number of boxes must be an integer',
      'number.min': 'Number of boxes cannot be negative',
      'any.required': 'Number of boxes is required',
    }),
  total_weight_kg: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Total weight must be a valid number',
      'number.min': 'Total weight cannot be negative',
      'any.required': 'Total weight is required',
    }),
  volume_cbm: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Volume (CBM) must be a valid number',
      'number.min': 'Volume cannot be negative',
      'any.required': 'Volume (CBM) is required',
    }),
  pickup_date: Joi.string()
    .isoDate()
    .required()
    .messages({
      'string.empty': 'Pickup date is required',
      'string.isoDate': 'Pickup date must be a valid date (YYYY-MM-DD)',
      'any.required': 'Pickup date is required',
    }),
  sailing_date: Joi.string()
    .isoDate()
    .required()
    .messages({
      'string.empty': 'Sailing date is required',
      'string.isoDate': 'Sailing date must be a valid date (YYYY-MM-DD)',
      'any.required': 'Sailing date is required',
    }),
  expected_eta: Joi.string()
    .isoDate()
    .required()
    .messages({
      'string.empty': 'Expected ETA is required',
      'string.isoDate': 'Expected ETA must be a valid date (YYYY-MM-DD)',
      'any.required': 'Expected ETA is required',
    }),
  actual_arrival: Joi.string().isoDate().allow('', null).optional(),
  status: Joi.string().valid(...STATUS_OPTIONS).optional(),
})
  .custom(validateDateOrder, 'Custom Date Order Validation');

const updateShipmentSchema = Joi.object({
  region: Joi.string().trim().optional(),
  category: Joi.string().trim().allow('', null).optional(),
  assigned_manager: Joi.string().trim().min(2).max(100).optional(),
  invoice_no: Joi.string().trim().min(2).max(100).optional(),
  fba_id: Joi.string().trim().allow('', null).max(100).optional(),
  container_no: Joi.string().trim().min(2).max(100).optional(),
  number_of_boxes: Joi.number().integer().min(0).optional(),
  total_weight_kg: Joi.number().min(0).optional(),
  volume_cbm: Joi.number().min(0).optional(),
  pickup_date: Joi.string().isoDate().optional(),
  sailing_date: Joi.string().isoDate().optional(),
  expected_eta: Joi.string().isoDate().optional(),
  actual_arrival: Joi.string().isoDate().allow('', null).optional(),
  status: Joi.string().valid(...STATUS_OPTIONS).optional(),
})
  .min(1)
  .custom(validateDateOrder, 'Custom Date Order Validation');

module.exports = {
  REGION_OPTIONS,
  STATUS_OPTIONS,
  createShipmentSchema,
  updateShipmentSchema,
};
