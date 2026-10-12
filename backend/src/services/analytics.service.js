const { query } = require('../config/database');

/**
 * Calculates global shipment analytics, delivery metrics, and chart series for the authenticated user.
 */
async function getAnalytics(userId) {
  // 1. Core Summary Metrics
  const summarySql = `
    SELECT 
      COUNT(*) AS total_shipments,
      COALESCE(SUM(number_of_boxes), 0) AS total_boxes,
      COALESCE(SUM(total_weight_kg), 0) AS total_weight_kg,
      COALESCE(SUM(volume_cbm), 0) AS total_volume_cbm,
      COUNT(*) FILTER (WHERE actual_arrival IS NOT NULL) AS arrived_shipments,
      COUNT(*) FILTER (WHERE actual_arrival IS NULL AND expected_eta >= CURRENT_DATE) AS pending_shipments,
      COUNT(*) FILTER (WHERE actual_arrival IS NULL AND expected_eta < CURRENT_DATE) AS delayed_shipments
    FROM shipments
    WHERE created_by = $1;
  `;
  const summaryResult = await query(summarySql, [userId]);
  const sRow = summaryResult.rows[0];

  const totalShipments = parseInt(sRow.total_shipments, 10);
  const totalBoxes = parseInt(sRow.total_boxes, 10);
  const totalWeightKg = parseFloat(sRow.total_weight_kg);
  const totalVolumeCbm = parseFloat(sRow.total_volume_cbm);
  const arrivedShipments = parseInt(sRow.arrived_shipments, 10);
  const pendingShipments = parseInt(sRow.pending_shipments, 10);
  const delayedShipments = parseInt(sRow.delayed_shipments, 10);

  // 2. Breakdown by Region
  const regionSql = `
    SELECT 
      region,
      COUNT(*) AS count,
      COALESCE(SUM(total_weight_kg), 0) AS weight_kg,
      COALESCE(SUM(volume_cbm), 0) AS volume_cbm
    FROM shipments
    WHERE created_by = $1
    GROUP BY region
    ORDER BY count DESC;
  `;
  const regionResult = await query(regionSql, [userId]);
  const byRegion = regionResult.rows.map((r) => ({
    region: r.region,
    count: parseInt(r.count, 10),
    weight_kg: parseFloat(r.weight_kg),
    volume_cbm: parseFloat(r.volume_cbm),
    percentage: totalShipments > 0 ? Math.round((parseInt(r.count, 10) / totalShipments) * 100) : 0,
  }));

  // 3. Breakdown by Status
  const statusSql = `
    SELECT 
      status,
      COUNT(*) AS count
    FROM shipments
    WHERE created_by = $1
    GROUP BY status
    ORDER BY count DESC;
  `;
  const statusResult = await query(statusSql, [userId]);
  const byStatus = statusResult.rows.map((r) => ({
    status: r.status,
    count: parseInt(r.count, 10),
  }));

  // 4. Monthly Timeline of Shipments & Cargo Volume
  const timelineSql = `
    SELECT 
      TO_CHAR(pickup_date, 'YYYY-MM') AS month,
      COUNT(*) AS count,
      COALESCE(SUM(volume_cbm), 0) AS volume_cbm,
      COALESCE(SUM(total_weight_kg), 0) AS weight_kg
    FROM shipments
    WHERE created_by = $1
    GROUP BY month
    ORDER BY month ASC
    LIMIT 12;
  `;
  const timelineResult = await query(timelineSql, [userId]);
  const timeline = timelineResult.rows.map((r) => ({
    month: r.month,
    count: parseInt(r.count, 10),
    volume_cbm: parseFloat(r.volume_cbm),
    weight_kg: parseFloat(r.weight_kg),
  }));

  return {
    summary: {
      total_shipments: totalShipments,
      total_boxes: totalBoxes,
      total_weight_kg: totalWeightKg,
      total_volume_cbm: totalVolumeCbm,
      arrived_shipments: arrivedShipments,
      pending_shipments: pendingShipments,
      delayed_shipments: delayedShipments,
    },
    by_region: byRegion,
    by_status: byStatus,
    timeline,
  };
}

module.exports = {
  getAnalytics,
};
