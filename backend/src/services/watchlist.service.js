const { query } = require('../config/database');
const { formatShipmentRow } = require('./shipment.service');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(id) {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

/**
 * Retrieves all saved watchlist shipments for an authenticated user.
 */
async function getWatchlist(userId) {
  const sql = `
    SELECT 
      w.id AS watchlist_id,
      w.user_id,
      w.shipment_id,
      w.created_at AS watchlisted_at,
      s.*
    FROM watchlist w
    JOIN shipments s ON w.shipment_id = s.id
    WHERE w.user_id = $1
    ORDER BY w.created_at DESC;
  `;

  const result = await query(sql, [userId]);
  const shipments = result.rows.map((row) => {
    const formattedShipment = formatShipmentRow(row);
    return {
      id: row.watchlist_id,
      user_id: row.user_id,
      shipment_id: row.shipment_id,
      created_at: row.watchlisted_at,
      watchlisted_at: row.watchlisted_at,
      shipment: formattedShipment,
      ...formattedShipment,
    };
  });

  return {
    watchlist: shipments,
    count: shipments.length,
  };
}

/**
 * Returns set of watchlisted shipment IDs for the user.
 */
async function getWatchlistIds(userId) {
  const sql = `
    SELECT shipment_id
    FROM watchlist
    WHERE user_id = $1;
  `;
  const result = await query(sql, [userId]);
  return result.rows.map((r) => r.shipment_id);
}

/**
 * Adds a shipment to the user's saved watchlist.
 */
async function addToWatchlist(userId, shipmentId) {
  if (!isValidUuid(shipmentId)) {
    const err = new Error('Invalid shipment identifier.');
    err.statusCode = 404;
    throw err;
  }

  // Verify the shipment exists and is authorized for this user
  const checkSql = `
    SELECT id
    FROM shipments
    WHERE id = $1 AND created_by = $2;
  `;
  const checkResult = await query(checkSql, [shipmentId, userId]);
  if (checkResult.rows.length === 0) {
    const err = new Error('Shipment not found or unauthorized.');
    err.statusCode = 404;
    throw err;
  }

  // Gracefully handle duplicate saves with ON CONFLICT DO NOTHING
  const insertSql = `
    INSERT INTO watchlist (user_id, shipment_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, shipment_id) DO NOTHING
    RETURNING id;
  `;
  await query(insertSql, [userId, shipmentId]);

  return { success: true, message: 'Shipment saved to watchlist.' };
}

/**
 * Removes a shipment from the user's saved watchlist.
 */
async function removeFromWatchlist(userId, shipmentId) {
  if (!isValidUuid(shipmentId)) {
    const err = new Error('Invalid shipment identifier.');
    err.statusCode = 404;
    throw err;
  }

  const deleteSql = `
    DELETE FROM watchlist
    WHERE user_id = $1 AND shipment_id = $2
    RETURNING id;
  `;
  const result = await query(deleteSql, [userId, shipmentId]);
  if (result.rows.length === 0) {
    const err = new Error('Shipment not found in your watchlist.');
    err.statusCode = 404;
    throw err;
  }

  return { success: true, message: 'Shipment removed from watchlist.' };
}

module.exports = {
  isValidUuid,
  getWatchlist,
  getWatchlistIds,
  addToWatchlist,
  removeFromWatchlist,
};
