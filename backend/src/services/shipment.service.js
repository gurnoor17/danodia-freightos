const { query } = require('../config/database');

/**
 * Derives consistent shipment status based on logistics dates.
 */
function deriveStatus({ status, actual_arrival, pickup_date, sailing_date }) {
  if (status && status === 'Cancelled') {
    return 'Cancelled';
  }
  if (actual_arrival) {
    return 'Delivered';
  }

  const todayStr = new Date().toISOString().split('T')[0];
  if (sailing_date && todayStr >= sailing_date) {
    return 'In Transit';
  }
  if (pickup_date && todayStr >= pickup_date) {
    return 'Pending Customs';
  }
  return status || 'Booked';
}

function formatDate(val) {
  if (!val) return null;
  if (typeof val === 'string') return val.split('T')[0];
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(val);
}

/**
 * Formats database numeric fields to JavaScript numbers.
 */
function formatShipmentRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    region: row.region,
    category: row.category || null,
    assigned_manager: row.assigned_manager,
    invoice_no: row.invoice_no,
    fba_id: row.fba_id || null,
    container_no: row.container_no,
    number_of_boxes: parseInt(row.number_of_boxes, 10),
    total_weight_kg: parseFloat(row.total_weight_kg),
    volume_cbm: parseFloat(row.volume_cbm),
    pickup_date: formatDate(row.pickup_date),
    sailing_date: formatDate(row.sailing_date),
    expected_eta: formatDate(row.expected_eta),
    actual_arrival: formatDate(row.actual_arrival),
    status: row.status,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Creates a new shipment record in PostgreSQL.
 */
async function createShipment(userId, data) {
  const calculatedStatus = deriveStatus({
    status: data.status,
    actual_arrival: data.actual_arrival,
    pickup_date: data.pickup_date,
    sailing_date: data.sailing_date,
  });

  const sql = `
    INSERT INTO shipments (
      region,
      category,
      assigned_manager,
      invoice_no,
      fba_id,
      container_no,
      number_of_boxes,
      total_weight_kg,
      volume_cbm,
      pickup_date,
      sailing_date,
      expected_eta,
      actual_arrival,
      status,
      created_by
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
    )
    RETURNING *;
  `;

  const values = [
    data.region,
    data.category || null,
    data.assigned_manager,
    data.invoice_no,
    data.fba_id || null,
    data.container_no,
    data.number_of_boxes,
    data.total_weight_kg,
    data.volume_cbm,
    data.pickup_date,
    data.sailing_date,
    data.expected_eta,
    data.actual_arrival || null,
    calculatedStatus,
    userId,
  ];

  const result = await query(sql, values);
  return formatShipmentRow(result.rows[0]);
}

/**
 * Retrieves a paginated list of shipments with search, filtering, and aggregate summary.
 */
async function getShipments(userId, options = {}) {
  const {
    search,
    region,
    status,
    page = 1,
    limit = 50,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = options;

  const validSortColumns = {
    created_at: 'created_at',
    pickup_date: 'pickup_date',
    sailing_date: 'sailing_date',
    expected_eta: 'expected_eta',
    invoice_no: 'invoice_no',
    total_weight_kg: 'total_weight_kg',
    volume_cbm: 'volume_cbm',
    number_of_boxes: 'number_of_boxes',
  };

  const safeSortColumn = validSortColumns[sortBy] || 'created_at';
  const safeSortDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const whereConditions = ['created_by = $1'];
  const queryParams = [userId];
  let paramIndex = 2;

  // Search filter (Invoice number or FBA ID)
  if (search && search.trim() !== '') {
    whereConditions.push(`(invoice_no ILIKE $${paramIndex} OR fba_id ILIKE $${paramIndex})`);
    queryParams.push(`%${search.trim()}%`);
    paramIndex++;
  }

  // Region filter
  if (region && region.trim() !== '' && region.toLowerCase() !== 'all') {
    whereConditions.push(`LOWER(region) = LOWER($${paramIndex})`);
    queryParams.push(region.trim());
    paramIndex++;
  }

  // Status filter
  if (status && status.trim() !== '' && status !== 'All Statuses') {
    whereConditions.push(`status = $${paramIndex}`);
    queryParams.push(status.trim());
    paramIndex++;
  }

  const whereClause = whereConditions.join(' AND ');

  // 1. Get filtered count and cargo aggregates
  const aggregateSql = `
    SELECT 
      COUNT(*) AS total_count,
      COALESCE(SUM(number_of_boxes), 0) AS total_boxes,
      COALESCE(SUM(total_weight_kg), 0) AS total_weight,
      COALESCE(SUM(volume_cbm), 0) AS total_volume
    FROM shipments
    WHERE ${whereClause};
  `;
  const aggResult = await query(aggregateSql, queryParams);
  const totalCount = parseInt(aggResult.rows[0].total_count, 10);
  const totalBoxes = parseInt(aggResult.rows[0].total_boxes, 10);
  const totalWeight = parseFloat(aggResult.rows[0].total_weight);
  const totalVolume = parseFloat(aggResult.rows[0].total_volume);

  // 2. Fetch paginated records
  const offset = (Math.max(1, page) - 1) * limit;
  const listSql = `
    SELECT *
    FROM shipments
    WHERE ${whereClause}
    ORDER BY ${safeSortColumn} ${safeSortDirection}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
  `;
  const listParams = [...queryParams, limit, offset];
  const listResult = await query(listSql, listParams);

  return {
    shipments: listResult.rows.map(formatShipmentRow),
    pagination: {
      total: totalCount,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
    summary: {
      count: totalCount,
      totalBoxes,
      totalWeightKg: totalWeight,
      totalVolumeCbm: totalVolume,
    },
  };
}

/**
 * Returns database aggregate summaries across all 5 origin categories for the dashboard cards.
 */
async function getShipmentSummary(userId) {
  const sql = `
    SELECT 
      COUNT(*) AS total_count,
      COALESCE(SUM(total_weight_kg), 0) AS total_weight,
      COALESCE(SUM(volume_cbm), 0) AS total_volume,

      COALESCE(SUM(CASE WHEN LOWER(region) = 'usa' THEN 1 ELSE 0 END), 0) AS usa_count,
      COALESCE(SUM(CASE WHEN LOWER(region) = 'usa' THEN total_weight_kg ELSE 0 END), 0) AS usa_weight,
      COALESCE(SUM(CASE WHEN LOWER(region) = 'usa' THEN volume_cbm ELSE 0 END), 0) AS usa_volume,

      COALESCE(SUM(CASE WHEN LOWER(region) = 'uk' THEN 1 ELSE 0 END), 0) AS uk_count,
      COALESCE(SUM(CASE WHEN LOWER(region) = 'uk' THEN total_weight_kg ELSE 0 END), 0) AS uk_weight,
      COALESCE(SUM(CASE WHEN LOWER(region) = 'uk' THEN volume_cbm ELSE 0 END), 0) AS uk_volume,

      COALESCE(SUM(CASE WHEN LOWER(region) = 'germany' THEN 1 ELSE 0 END), 0) AS germany_count,
      COALESCE(SUM(CASE WHEN LOWER(region) = 'germany' THEN total_weight_kg ELSE 0 END), 0) AS germany_weight,
      COALESCE(SUM(CASE WHEN LOWER(region) = 'germany' THEN volume_cbm ELSE 0 END), 0) AS germany_volume,

      COALESCE(SUM(CASE WHEN LOWER(region) = 'walmart us' THEN 1 ELSE 0 END), 0) AS walmart_count,
      COALESCE(SUM(CASE WHEN LOWER(region) = 'walmart us' THEN total_weight_kg ELSE 0 END), 0) AS walmart_weight,
      COALESCE(SUM(CASE WHEN LOWER(region) = 'walmart us' THEN volume_cbm ELSE 0 END), 0) AS walmart_volume
    FROM shipments
    WHERE created_by = $1;
  `;

  const result = await query(sql, [userId]);
  const row = result.rows[0];

  return {
    all: {
      id: 'all',
      title: 'All Origins',
      shipmentCount: parseInt(row.total_count, 10),
      totalWeightKg: parseFloat(row.total_weight),
      totalVolumeCbm: parseFloat(row.total_volume),
      isHighlighted: true,
    },
    usa: {
      id: 'usa',
      title: 'USA',
      shipmentCount: parseInt(row.usa_count, 10),
      totalWeightKg: parseFloat(row.usa_weight),
      totalVolumeCbm: parseFloat(row.usa_volume),
    },
    uk: {
      id: 'uk',
      title: 'UK',
      shipmentCount: parseInt(row.uk_count, 10),
      totalWeightKg: parseFloat(row.uk_weight),
      totalVolumeCbm: parseFloat(row.uk_volume),
    },
    germany: {
      id: 'germany',
      title: 'Germany',
      shipmentCount: parseInt(row.germany_count, 10),
      totalWeightKg: parseFloat(row.germany_weight),
      totalVolumeCbm: parseFloat(row.germany_volume),
    },
    walmart_us: {
      id: 'walmart_us',
      title: 'Walmart US',
      shipmentCount: parseInt(row.walmart_count, 10),
      totalWeightKg: parseFloat(row.walmart_weight),
      totalVolumeCbm: parseFloat(row.walmart_volume),
    },
  };
}

/**
 * Retrieves a single shipment by ID with access control.
 */
async function getShipmentById(userId, shipmentId) {
  const sql = `
    SELECT *
    FROM shipments
    WHERE id = $1 AND created_by = $2;
  `;
  const result = await query(sql, [shipmentId, userId]);
  if (result.rows.length === 0) {
    return null;
  }
  return formatShipmentRow(result.rows[0]);
}

/**
 * Updates an existing shipment with parameterized query and authorization check.
 */
async function updateShipment(userId, shipmentId, updateData) {
  // 1. Verify existence and ownership
  const existing = await getShipmentById(userId, shipmentId);
  if (!existing) {
    return null;
  }

  // Allowlist of updatable columns
  const allowedFields = [
    'region',
    'category',
    'assigned_manager',
    'invoice_no',
    'fba_id',
    'container_no',
    'number_of_boxes',
    'total_weight_kg',
    'volume_cbm',
    'pickup_date',
    'sailing_date',
    'expected_eta',
    'actual_arrival',
    'status',
  ];

  const setClauses = [];
  const values = [];
  let paramIdx = 1;

  // Auto-recalculate status if relevant dates were touched without an explicit status override
  const mergedDates = {
    actual_arrival: updateData.actual_arrival !== undefined ? updateData.actual_arrival : existing.actual_arrival,
    pickup_date: updateData.pickup_date !== undefined ? updateData.pickup_date : existing.pickup_date,
    sailing_date: updateData.sailing_date !== undefined ? updateData.sailing_date : existing.sailing_date,
    status: updateData.status !== undefined ? updateData.status : existing.status,
  };
  const recalculatedStatus = deriveStatus(mergedDates);

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      setClauses.push(`${field} = $${paramIdx}`);
      values.push(updateData[field] === '' ? null : updateData[field]);
      paramIdx++;
    }
  }

  // If status was not explicitly updated but dates changed, set derived status
  if (updateData.status === undefined && recalculatedStatus !== existing.status) {
    setClauses.push(`status = $${paramIdx}`);
    values.push(recalculatedStatus);
    paramIdx++;
  }

  if (setClauses.length === 0) {
    return existing;
  }

  values.push(shipmentId);
  values.push(userId);

  const sql = `
    UPDATE shipments
    SET ${setClauses.join(', ')}
    WHERE id = $${paramIdx} AND created_by = $${paramIdx + 1}
    RETURNING *;
  `;

  const result = await query(sql, values);
  return formatShipmentRow(result.rows[0]);
}

/**
 * Deletes a shipment record with authorization check.
 */
async function deleteShipment(userId, shipmentId) {
  const sql = `
    DELETE FROM shipments
    WHERE id = $1 AND created_by = $2
    RETURNING id;
  `;
  const result = await query(sql, [shipmentId, userId]);
  return result.rows.length > 0;
}

module.exports = {
  deriveStatus,
  createShipment,
  getShipments,
  getShipmentSummary,
  getShipmentById,
  updateShipment,
  deleteShipment,
};
