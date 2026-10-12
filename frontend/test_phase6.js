const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://127.0.0.1:5000/api';

async function runPhase6FrontendTests() {
  console.log('====================================================');
  console.log('DANODIA FREIGHTOS — PHASE 6 FRONTEND ACCEPTANCE TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  };

  try {
    // 1. /dashboard loads and contains Export CSV button
    const dashRes = await fetch(`${FRONTEND_URL}/dashboard`);
    const dashHtml = await dashRes.text();
    assert(
      dashRes.status === 200 &&
        dashHtml.includes('Global Shipments') &&
        dashHtml.includes('Export CSV'),
      '1. /dashboard renders Global Shipments and Export CSV button'
    );

    // 2. /watchlist route loads successfully with Saved Watchlist heading
    const watchlistRes = await fetch(`${FRONTEND_URL}/watchlist`);
    const watchlistHtml = await watchlistRes.text();
    assert(
      watchlistRes.status === 200 &&
        watchlistHtml.includes('Saved Watchlist') &&
        watchlistHtml.includes('Danodia FreightOS'),
      '2. /watchlist route renders Saved Watchlist heading and FreightOS layout'
    );

    // 3. /analytics route loads successfully with Logistics Analytics heading
    const analyticsRes = await fetch(`${FRONTEND_URL}/analytics`);
    const analyticsHtml = await analyticsRes.text();
    assert(
      analyticsRes.status === 200 &&
        analyticsHtml.includes('Logistics Analytics') &&
        analyticsHtml.includes('Total Shipments') &&
        analyticsHtml.includes('Cargo Weight'),
      '3. /analytics route renders Logistics Analytics heading and KPI metrics'
    );

    // 4. Verify Sidebar includes links to Dashboard, Analytics, and Saved Watchlist
    assert(
      dashHtml.includes('/dashboard') &&
        dashHtml.includes('/analytics') &&
        dashHtml.includes('/watchlist'),
      '4. Sidebar navigation includes valid links to /dashboard, /analytics, and /watchlist'
    );

    console.log('\n====================================================');
    console.log(`PHASE 6 FRONTEND TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Fatal Phase 6 frontend test error:', err);
    failed++;
  }

  process.exit(failed > 0 ? 1 : 0);
}

runPhase6FrontendTests();
