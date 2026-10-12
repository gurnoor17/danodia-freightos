/**
 * Comprehensive Automated Acceptance Test Suite for Phase 6
 * Tests:
 * 1. CSV Export (Filtered, Formula injection protection, CSV escaping, Headers)
 * 2. Saved Watchlist (Save, Idempotent duplicate, Isolation, Cascade on delete, Remove)
 * 3. Analytics (Real PostgreSQL aggregations, Arrived/Pending/Delayed rules, Zero-record handling)
 * 4. Regression testing (Auth, Shipment CRUD)
 */

const http = require('http');

const BASE_URL = 'http://127.0.0.1:5000/api';

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqOptions = {
      hostname: u.hostname,
      port: u.port || 5000,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          // Non-JSON response (e.g. text/csv)
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
          rawBody: data,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      if (typeof body === 'object') {
        req.setHeader('Content-Type', 'application/json');
        req.write(JSON.stringify(body));
      } else {
        req.write(body);
      }
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  } else {
    console.log(`  ✓ ${message}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('🚀 RUNNING PHASE 6 ACCEPTANCE & INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  const timestamp = Date.now();
  const userAEmail = `phase6_user_a_${timestamp}@example.com`;
  const userBEmail = `phase6_user_b_${timestamp}@example.com`;
  const password = 'SecurePassword2026!';

  // --- Step 1: Authentication & User Setup ---
  console.log('📌 1. User Setup & Auth Isolation');
  const regARes = await request(`${BASE_URL}/auth/register`, { method: 'POST' }, {
    name: 'User A',
    email: userAEmail,
    password,
  });
  assert(regARes.status === 201, 'User A registered successfully');

  const loginARes = await request(`${BASE_URL}/auth/login`, { method: 'POST' }, {
    email: userAEmail,
    password,
  });
  assert(loginARes.status === 200, 'User A logged in');
  const tokenA = loginARes.data.data.token;

  const regBRes = await request(`${BASE_URL}/auth/register`, { method: 'POST' }, {
    name: 'User B',
    email: userBEmail,
    password,
  });
  assert(regBRes.status === 201, 'User B registered successfully');

  const loginBRes = await request(`${BASE_URL}/auth/login`, { method: 'POST' }, {
    email: userBEmail,
    password,
  });
  assert(loginBRes.status === 200, 'User B logged in');
  const tokenB = loginBRes.data.data.token;

  // --- Step 2: Seed Shipments for User A ---
  console.log('\n📌 2. Seeding Test Shipments (Formula injection, Comma escaping, Dates)');
  // Shipment 1: USA, In Transit, pending delivery (ETA in future)
  const shp1Res = await request(`${BASE_URL}/shipments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
  }, {
    region: 'USA',
    category: 'Electronics',
    assigned_manager: 'Marcus Sterling',
    invoice_no: `INV-USA-${timestamp}`,
    fba_id: 'FBA-USA-01',
    container_no: 'MSKU-10001-A',
    number_of_boxes: 50,
    total_weight_kg: 1000.5,
    volume_cbm: 10.2,
    pickup_date: '2026-10-01',
    sailing_date: '2026-10-05',
    expected_eta: '2026-11-20', // future -> pending
    status: 'In Transit',
  });
  assert(shp1Res.status === 201, 'Created Shipment 1 (USA, Pending)');
  const shp1 = shp1Res.data.data.shipment;

  // Shipment 2: UK, Delivered, arrived (actual_arrival recorded)
  const shp2Res = await request(`${BASE_URL}/shipments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
  }, {
    region: 'UK',
    category: 'Apparel, Footwear', // comma in text
    assigned_manager: '=DANGEROUS_FORMULA()', // formula injection test in text field!
    invoice_no: `INV-UK-${timestamp}`,
    fba_id: '@FBA_FORMULA_ID', // starts with @ formula character
    container_no: 'CMAU-20002-B',
    number_of_boxes: 30,
    total_weight_kg: 600.0,
    volume_cbm: 6.5,
    pickup_date: '2026-09-15',
    sailing_date: '2026-09-20',
    expected_eta: '2026-10-05',
    actual_arrival: '2026-10-04', // arrived!
    status: 'Delivered',
  });
  assert(shp2Res.status === 201, 'Created Shipment 2 (UK, Arrived, Formula Characters)');
  const shp2 = shp2Res.data.data.shipment;

  // Shipment 3: Germany, Delayed (expected_eta in past, actual_arrival NULL)
  const shp3Res = await request(`${BASE_URL}/shipments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
  }, {
    region: 'Germany',
    category: 'Industrial',
    assigned_manager: 'Hans Weber',
    invoice_no: `INV-DE-${timestamp}`,
    fba_id: 'FBA-DE-03',
    container_no: 'HLCU-30003-C',
    number_of_boxes: 20,
    total_weight_kg: 400.0,
    volume_cbm: 4.3,
    pickup_date: '2026-08-01',
    sailing_date: '2026-08-10',
    expected_eta: '2026-09-01', // past (< CURRENT_DATE) -> delayed!
    actual_arrival: null,
    status: 'Cancelled',
  });
  assert(shp3Res.status === 201, 'Created Shipment 3 (Germany, Delayed, Cancelled)');
  const shp3 = shp3Res.data.data.shipment;

  // --- Step 3: CSV Export Tests ---
  console.log('\n📌 3. Testing CSV Export Endpoint');
  
  // 3.1 Unauthorized check
  const noAuthCsv = await request(`${BASE_URL}/shipments/export`);
  assert(noAuthCsv.status === 401, 'Export CSV without token returns 401 Unauthorized');

  // 3.2 Export all permitted shipments for User A
  const exportAllRes = await request(`${BASE_URL}/shipments/export`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(exportAllRes.status === 200, 'Export all returned 200 OK');
  assert(exportAllRes.headers['content-type'].includes('text/csv'), 'Content-Type is text/csv');
  assert(exportAllRes.headers['content-disposition'].includes('filename="Danodia_Shipments_'), 'Content-Disposition has valid filename');
  
  const csvContent = exportAllRes.rawBody;
  assert(csvContent.includes('Invoice Number,Region,Category,Assigned Manager,FBA ID,Container Number'), 'CSV includes standard headers');
  assert(csvContent.includes(shp1.invoice_no), 'CSV contains Shipment 1 invoice');
  assert(csvContent.includes(shp2.invoice_no), 'CSV contains Shipment 2 invoice');
  assert(csvContent.includes(shp3.invoice_no), 'CSV contains Shipment 3 invoice');

  // 3.3 Verify Formula Injection Protection
  // Note: in shp2, assigned_manager was '=DANGEROUS_FORMULA()' and fba_id was '@FBA_FORMULA_ID'
  // Both must be prefixed with single quote in CSV output
  assert(csvContent.includes("''=DANGEROUS_FORMULA()\"") || csvContent.includes("'=DANGEROUS_FORMULA()"), 'Formula starting with = is sanitized with single quote');
  assert(csvContent.includes("''@FBA_FORMULA_ID\"") || csvContent.includes("'@FBA_FORMULA_ID"), 'Formula starting with @ is sanitized with single quote');

  // 3.4 Verify numbers are NOT corrupted by formula sanitization
  assert(csvContent.includes(',50,1000.5,10.2,'), 'Legitimate numeric columns are preserved without single quote prefix');

  // 3.5 Export with Filters (Region = USA)
  const exportFilteredRes = await request(`${BASE_URL}/shipments/export?region=USA`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(exportFilteredRes.status === 200, 'Filtered export returned 200 OK');
  assert(exportFilteredRes.rawBody.includes(shp1.invoice_no), 'Filtered export contains USA shipment');
  assert(!exportFilteredRes.rawBody.includes(shp2.invoice_no), 'Filtered export excludes UK shipment');
  assert(!exportFilteredRes.rawBody.includes(shp3.invoice_no), 'Filtered export excludes Germany shipment');

  // 3.6 Export with No Results (Region = Walmart US)
  const exportEmptyRes = await request(`${BASE_URL}/shipments/export?region=Walmart US`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(exportEmptyRes.status === 200, 'Empty filter export returned 200 OK');
  assert(exportEmptyRes.rawBody.includes('Invoice Number,Region,Category'), 'Empty filter export contains header row');
  const lines = exportEmptyRes.rawBody.trim().split('\n');
  assert(lines.length === 1, 'Empty filter export contains exactly 1 row (header only)');

  // --- Step 4: Saved Watchlist Tests ---
  console.log('\n📌 4. Testing Saved Watchlist');

  // 4.1 Unauthorized check
  const noAuthWatchlist = await request(`${BASE_URL}/watchlist`);
  assert(noAuthWatchlist.status === 401, 'Watchlist without token returns 401 Unauthorized');

  // 4.2 Save Shipment 1 to Watchlist
  const save1Res = await request(`${BASE_URL}/watchlist/${shp1.id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(save1Res.status === 201, 'Saved Shipment 1 to watchlist (201 Created)');

  // 4.3 Idempotent Duplicate Save
  const save1DupRes = await request(`${BASE_URL}/watchlist/${shp1.id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(save1DupRes.status === 200 || save1DupRes.status === 201, 'Duplicate save handled gracefully (idempotent)');

  // 4.4 Save Shipment 2 to Watchlist
  const save2Res = await request(`${BASE_URL}/watchlist/${shp2.id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(save2Res.status === 201, 'Saved Shipment 2 to watchlist');

  // 4.5 Retrieve Watchlist Items
  const listWatchlistRes = await request(`${BASE_URL}/watchlist`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(listWatchlistRes.status === 200, 'Retrieved watchlist items');
  const items = listWatchlistRes.data.data.watchlist;
  assert(items.length === 2, 'Watchlist contains 2 saved items');
  assert(items[0].shipment && items[0].shipment.invoice_no, 'Watchlist item includes embedded shipment record');

  // 4.6 Retrieve Watchlist IDs
  const listIdsRes = await request(`${BASE_URL}/watchlist/ids`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(listIdsRes.status === 200, 'Retrieved watchlist IDs');
  const ids = listIdsRes.data.data.shipmentIds;
  assert(ids.includes(shp1.id) && ids.includes(shp2.id), 'Watchlist IDs contains both shp1 and shp2');

  // 4.7 User Isolation
  const userBWatchlist = await request(`${BASE_URL}/watchlist`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(userBWatchlist.status === 200, 'User B watchlist request succeeds');
  assert(userBWatchlist.data.data.watchlist.length === 0, 'User B watchlist is completely empty (isolated)');

  // 4.8 User B attempts to save User A shipment
  const userBSaveUnauthorized = await request(`${BASE_URL}/watchlist/${shp1.id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(userBSaveUnauthorized.status === 404, 'User B cannot save User A shipment (returns 404 Not Found)');

  // 4.9 Remove Shipment 1 from Watchlist
  const remove1Res = await request(`${BASE_URL}/watchlist/${shp1.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(remove1Res.status === 200, 'Removed Shipment 1 from watchlist');

  // Verify removed
  const listIdsAfterRemove = await request(`${BASE_URL}/watchlist/ids`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(!listIdsAfterRemove.data.data.shipmentIds.includes(shp1.id), 'Shipment 1 is no longer in watchlist IDs');
  assert(listIdsAfterRemove.data.data.shipmentIds.includes(shp2.id), 'Shipment 2 remains in watchlist');

  // 4.10 Cascade Deletion on Shipment Delete
  // Delete Shipment 2 from shipments table
  const deleteShp2Res = await request(`${BASE_URL}/shipments/${shp2.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(deleteShp2Res.status === 200, 'Deleted Shipment 2 from shipments');

  // Check watchlist
  const watchlistAfterShpDelete = await request(`${BASE_URL}/watchlist`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(
    watchlistAfterShpDelete.data.data.watchlist.length === 0,
    'Watchlist entry was automatically cascade deleted when shipment was deleted'
  );

  // --- Step 5: Analytics Tests ---
  console.log('\n📌 5. Testing Analytics Aggregation');

  // 5.1 Unauthorized check
  const noAuthAnalytics = await request(`${BASE_URL}/analytics`);
  assert(noAuthAnalytics.status === 401, 'Analytics without token returns 401 Unauthorized');

  // 5.2 User A Analytics
  // Currently User A has:
  // - shp1: 50 boxes, 1000.5 kg, 10.2 CBM, In Transit, ETA future -> Pending
  // - shp3: 20 boxes, 400.0 kg, 4.3 CBM, Pending Customs, ETA past -> Delayed
  // Total: 2 shipments, 70 boxes, 1400.5 kg, 14.5 CBM, 0 Arrived, 1 Pending, 1 Delayed
  const analyticsARes = await request(`${BASE_URL}/analytics`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(analyticsARes.status === 200, 'Retrieved User A Analytics');
  const aSummary = analyticsARes.data.data.summary;
  assert(aSummary.total_shipments === 2, `Total shipments is 2 (got ${aSummary.total_shipments})`);
  assert(aSummary.total_boxes === 70, `Total boxes is 70 (got ${aSummary.total_boxes})`);
  assert(Math.abs(aSummary.total_weight_kg - 1400.5) < 0.01, `Total weight is 1400.5 kg (got ${aSummary.total_weight_kg})`);
  assert(Math.abs(aSummary.total_volume_cbm - 14.5) < 0.01, `Total volume is 14.5 CBM (got ${aSummary.total_volume_cbm})`);
  assert(aSummary.arrived_shipments === 0, `Arrived shipments is 0 (got ${aSummary.arrived_shipments})`);
  assert(aSummary.pending_shipments === 1, `Pending shipments is 1 (got ${aSummary.pending_shipments})`);
  assert(aSummary.delayed_shipments === 1, `Delayed shipments is 1 (got ${aSummary.delayed_shipments})`);

  // Verify regional breakdown
  const byRegion = analyticsARes.data.data.by_region;
  assert(Array.isArray(byRegion) && byRegion.length === 2, 'by_region contains 2 regions (USA & Germany)');
  const usaRegion = byRegion.find((r) => r.region === 'USA');
  assert(usaRegion && usaRegion.count === 1, 'USA region count is 1');

  // Verify status breakdown
  const byStatus = analyticsARes.data.data.by_status;
  assert(Array.isArray(byStatus) && byStatus.length === 2, 'by_status contains 2 statuses');

  // Verify timeline
  const timeline = analyticsARes.data.data.timeline;
  assert(Array.isArray(timeline) && timeline.length > 0, 'timeline contains monthly series data');

  // 5.3 User B Analytics (Zero records)
  const analyticsBRes = await request(`${BASE_URL}/analytics`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(analyticsBRes.status === 200, 'User B Analytics returns 200 OK with zero shipments');
  const bSummary = analyticsBRes.data.data.summary;
  assert(bSummary.total_shipments === 0, 'User B total_shipments is 0');
  assert(bSummary.total_boxes === 0, 'User B total_boxes is 0');
  assert(bSummary.total_weight_kg === 0, 'User B total_weight_kg is 0');
  assert(bSummary.total_volume_cbm === 0, 'User B total_volume_cbm is 0');
  assert(bSummary.arrived_shipments === 0, 'User B arrived_shipments is 0');
  assert(bSummary.pending_shipments === 0, 'User B pending_shipments is 0');
  assert(bSummary.delayed_shipments === 0, 'User B delayed_shipments is 0');
  assert(analyticsBRes.data.data.by_region.length === 0, 'User B by_region is empty array');
  assert(analyticsBRes.data.data.by_status.length === 0, 'User B by_status is empty array');
  assert(analyticsBRes.data.data.timeline.length === 0, 'User B timeline is empty array');

  console.log('\n================================================================');
  console.log('🎉 ALL PHASE 6 ACCEPTANCE TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
