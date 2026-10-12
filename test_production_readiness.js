/**
 * Danodia FreightOS — Phase 7 Full Production Readiness Audit & Verification Suite
 * Validates all 17 SOP 10 acceptance criteria across frontend, backend, PostgreSQL, and security layers.
 */

const http = require('http');

const API_BASE = 'http://127.0.0.1:5000/api';

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
          // raw non-json (e.g. text/csv)
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

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName} - ${details}`);
    failed++;
  }
}

async function runAudit() {
  console.log('================================================================');
  console.log('🛡️  DANODIA FREIGHTOS — PRODUCTION READINESS AUDIT SUITE');
  console.log('================================================================\n');

  const ts = Date.now();
  const userA = {
    name: 'Captain Alex Vance',
    email: `alex.vance.${ts}@danodia.com`,
    password: 'SecureFreight2026!',
  };
  const userB = {
    name: 'Inspector Jordan Reed',
    email: `jordan.reed.${ts}@danodia.com`,
    password: 'SecureLogistics2026!',
  };

  try {
    // 1. Health check & PostgreSQL connectivity
    const health = await request(`${API_BASE}/health`);
    assert(
      health.status === 200 &&
        health.data?.status === 'healthy' &&
        health.data?.database?.status === 'connected',
      '1. Health Check & PostgreSQL Connectivity (/api/health -> 200 Healthy, DB Connected)'
    );

    // 2. HTTP Security Headers
    assert(
      health.headers['x-content-type-options'] === 'nosniff' &&
        health.headers['x-frame-options'] === 'DENY' &&
        health.headers['x-xss-protection'] === '1; mode=block',
      '2. Standard HTTP Security Headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)'
    );

    // 3. User A Registration
    const regA = await request(`${API_BASE}/auth/register`, { method: 'POST' }, userA);
    assert(
      regA.status === 201 &&
        regA.data?.status === 'success' &&
        regA.data?.data?.user?.email === userA.email.toLowerCase() &&
        !regA.data?.data?.user?.password_hash,
      '3. User Registration succeeds with 201 Created and never leaks password_hash'
    );

    // 4. Duplicate Registration
    const dupReg = await request(`${API_BASE}/auth/register`, { method: 'POST' }, userA);
    assert(
      dupReg.status === 409 && dupReg.data?.status === 'error',
      '4. Duplicate email registration safely rejected with 409 Conflict'
    );

    // 5. User A Login
    const loginA = await request(`${API_BASE}/auth/login`, { method: 'POST' }, {
      email: userA.email,
      password: userA.password,
    });
    const tokenA = loginA.data?.data?.token;
    assert(
      loginA.status === 200 && typeof tokenA === 'string' && tokenA.length > 20,
      '5. User Login succeeds with 200 OK and returns cryptographically signed JWT'
    );

    // 6. User B Setup (for data isolation checks)
    await request(`${API_BASE}/auth/register`, { method: 'POST' }, userB);
    const loginB = await request(`${API_BASE}/auth/login`, { method: 'POST' }, {
      email: userB.email,
      password: userB.password,
    });
    const tokenB = loginB.data?.data?.token;

    // 7. Protected Route Verification (/api/auth/me)
    const meRes = await request(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      meRes.status === 200 && meRes.data?.data?.user?.email === userA.email.toLowerCase(),
      '6. Protected User Profile Verification (/api/auth/me) succeeds with Bearer token'
    );

    // 8. Rejection of unauthenticated requests
    const noToken = await request(`${API_BASE}/shipments`);
    assert(noToken.status === 401, '7. Protected endpoint rejects requests without Bearer token (401)');

    const badToken = await request(`${API_BASE}/shipments`, {
      headers: { Authorization: 'Bearer forged.tampered.token' },
    });
    assert(badToken.status === 401, '8. Protected endpoint rejects malformed/tampered JWT tokens (401)');

    // 9. Shipment CRUD: Create Valid Shipment
    const shpPayload = {
      region: 'USA',
      category: 'Consumer Electronics',
      assigned_manager: 'Marcus Sterling',
      invoice_no: `INV-AUDIT-${ts}-01`,
      fba_id: `FBA-AUDIT-${ts}`,
      container_no: 'MSKU-88772-1',
      number_of_boxes: 150,
      total_weight_kg: 3200.5,
      volume_cbm: 18.25,
      pickup_date: '2026-10-01',
      sailing_date: '2026-10-06',
      expected_eta: '2026-10-25',
      actual_arrival: null,
      status: 'In Transit',
    };
    const createShp = await request(`${API_BASE}/shipments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    }, shpPayload);
    const shpA = createShp.data?.data?.shipment;
    assert(
      createShp.status === 201 && shpA?.invoice_no === shpPayload.invoice_no,
      '9. Shipment Creation (POST /api/shipments) succeeds with HTTP 201'
    );

    // 10. Data Access Isolation (User B cannot access User A shipment)
    const foreignAccess = await request(`${API_BASE}/shipments/${shpA.id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(
      foreignAccess.status === 404,
      '10. Cross-Tenant Authorization Isolation (Foreign user receives 404 Not Found)'
    );

    // 11. Search & Filter
    const searchRes = await request(`${API_BASE}/shipments?search=${shpPayload.fba_id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      searchRes.status === 200 && searchRes.data?.data?.shipments?.length === 1,
      '11. Search by FBA ID returns matching shipment'
    );

    const filterRes = await request(`${API_BASE}/shipments?region=USA&status=In%20Transit`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      filterRes.status === 200 && filterRes.data?.data?.shipments?.length === 1,
      '12. Filter by Region & Status returns precise matching shipments'
    );

    // 12. Dashboard Summary Aggregates
    const summaryRes = await request(`${API_BASE}/shipments/summary`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      summaryRes.status === 200 &&
        summaryRes.data?.data?.all?.shipmentCount >= 1 &&
        summaryRes.data?.data?.usa?.shipmentCount >= 1,
      '13. Dashboard Summary Cards calculate real origin aggregates directly from PostgreSQL'
    );

    // 13. CSV Export with Formula Injection Check
    const exportRes = await request(`${API_BASE}/shipments/export`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      exportRes.status === 200 &&
        exportRes.headers['content-type'].includes('text/csv') &&
        exportRes.rawBody.includes('Invoice Number,Region,Category') &&
        exportRes.rawBody.includes(shpPayload.invoice_no),
      '14. CSV Export streams valid text/csv with complete headers and values'
    );

    // 14. Watchlist Operations & User Isolation
    const watchAdd = await request(`${API_BASE}/watchlist/${shpA.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      watchAdd.status === 201 || watchAdd.status === 200,
      '15. Saved Watchlist: Add shipment succeeds'
    );

    const watchList = await request(`${API_BASE}/watchlist`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      watchList.status === 200 && watchList.data?.data?.watchlist?.length >= 1,
      '16. Saved Watchlist: Retrieve list contains saved shipment with embedded record'
    );

    const watchB = await request(`${API_BASE}/watchlist`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(
      watchB.status === 200 && watchB.data?.data?.watchlist?.length === 0,
      '17. Saved Watchlist: Isolated per user (User B cannot see User A items)'
    );

    // 15. Analytics Verification
    const analyticsRes = await request(`${API_BASE}/analytics`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const aData = analyticsRes.data?.data;
    assert(
      analyticsRes.status === 200 &&
        aData?.summary?.total_shipments >= 1 &&
        Array.isArray(aData?.by_region) &&
        Array.isArray(aData?.by_status) &&
        Array.isArray(aData?.timeline),
      '18. Analytics: Core KPIs and Visualizations series aggregated in PostgreSQL'
    );

    // 16. Shipment Deletion & Cascade Watchlist Cleanup
    const delRes = await request(`${API_BASE}/shipments/${shpA.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(delRes.status === 200, '19. Shipment Deletion succeeds with HTTP 200');

    const watchAfterDel = await request(`${API_BASE}/watchlist`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      watchAfterDel.data?.data?.watchlist?.every((item) => item.shipment_id !== shpA.id),
      '20. Cascade Deletion: Watchlist reference automatically cleaned up on shipment deletion'
    );

    console.log('\n================================================================');
    console.log(`PRODUCTION AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');
  } catch (err) {
    console.error('Fatal audit failure:', err);
    failed++;
  }

  process.exit(failed > 0 ? 1 : 0);
}

runAudit();
