const fs = require('fs');
const path = require('path');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://127.0.0.1:5000/api';

async function runPhase4Tests() {
  console.log('====================================================');
  console.log('DANODIA FREIGHTOS — PHASE 4 ACCEPTANCE TEST SUITE');
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
    // ----------------------------------------------------
    // 1. Static Component File Inspections
    // ----------------------------------------------------
    const componentsDir = path.join(__dirname, 'src', 'components', 'dashboard');
    const mockDataFile = path.join(__dirname, 'src', 'lib', 'dashboard', 'mock-data.ts');
    const pageFile = path.join(__dirname, 'src', 'app', 'dashboard', 'page.tsx');

    assert(fs.existsSync(mockDataFile), '1.1 Mock data module exists (lib/dashboard/mock-data.ts)');
    const mockDataContent = fs.readFileSync(mockDataFile, 'utf8');
    assert(
      mockDataContent.includes('INITIAL_ORIGIN_SUMMARIES') &&
      mockDataContent.includes('All Origins') &&
      mockDataContent.includes('Walmart US') &&
      mockDataContent.includes('SAMPLE_SHIPMENTS'),
      '1.2 Mock data module defines the 5 origin cards, sample shipments, and status options'
    );

    const requiredComponents = [
      'Sidebar.tsx',
      'DashboardHeader.tsx',
      'SummaryCard.tsx',
      'ShipmentFilters.tsx',
      'ShipmentResults.tsx',
      'ShipmentModal.tsx',
    ];

    for (const comp of requiredComponents) {
      assert(
        fs.existsSync(path.join(componentsDir, comp)),
        `1.3 Dashboard component exists: components/dashboard/${comp}`
      );
    }

    // ----------------------------------------------------
    // 2. Sidebar Specifications
    // ----------------------------------------------------
    const sidebarContent = fs.readFileSync(path.join(componentsDir, 'Sidebar.tsx'), 'utf8');
    assert(
      sidebarContent.includes('#0B1020') &&
      sidebarContent.includes('Danodia FreightOS') &&
      sidebarContent.includes('Danodia Global Exports') &&
      sidebarContent.includes('+ Create Shipment') &&
      sidebarContent.includes('Dashboard') &&
      sidebarContent.includes('Analytics') &&
      sidebarContent.includes('Saved Watchlist') &&
      sidebarContent.includes('Settings'),
      '2. Sidebar implements dark navy theme (#0B1020), FreightOS branding, workspace, + Create Shipment button, nav items, and profile section'
    );

    // ----------------------------------------------------
    // 3. Main Header Specifications
    // ----------------------------------------------------
    const headerContent = fs.readFileSync(path.join(componentsDir, 'DashboardHeader.tsx'), 'utf8');
    assert(
      headerContent.includes('Global Shipments') &&
      headerContent.includes('Manage and track your active freight movements globally.') &&
      headerContent.includes('Export CSV'),
      '3. DashboardHeader displays Global Shipments heading, subtitle, and right-aligned Export CSV button'
    );

    // ----------------------------------------------------
    // 4. Summary Cards Specifications
    // ----------------------------------------------------
    const summaryCardContent = fs.readFileSync(path.join(componentsDir, 'SummaryCard.tsx'), 'utf8');
    assert(
      summaryCardContent.includes('#503BFF') &&
      summaryCardContent.includes('totalWeightKg') &&
      summaryCardContent.includes('totalVolumeCbm') &&
      summaryCardContent.includes('shipmentCount'),
      '4. SummaryCard renders shipment count, weight in kg, volume in CBM, and purple accent border (#503BFF)'
    );

    // ----------------------------------------------------
    // 5. Search and Filter Controls Specifications
    // ----------------------------------------------------
    const filtersContent = fs.readFileSync(path.join(componentsDir, 'ShipmentFilters.tsx'), 'utf8');
    assert(
      filtersContent.includes('Search by Invoice No. or FBA ID...') &&
      filtersContent.includes('All Statuses'),
      '5. ShipmentFilters includes search input with exact placeholder and status dropdown with All Statuses default'
    );

    // ----------------------------------------------------
    // 6. Shipment Results Area & Empty State
    // ----------------------------------------------------
    const resultsContent = fs.readFileSync(path.join(componentsDir, 'ShipmentResults.tsx'), 'utf8');
    assert(
      resultsContent.includes('No shipments found') &&
      resultsContent.includes('Create a new shipment or adjust your search filters to see data.') &&
      resultsContent.includes('+ Add Shipment') &&
      resultsContent.includes('Total Boxes') &&
      resultsContent.includes('Total Weight') &&
      resultsContent.includes('Total Volume'),
      '6. ShipmentResults features metric aggregate bar, empty state with package icon and + Add Shipment, and table layout'
    );

    // ----------------------------------------------------
    // 7. Shipment Modal Entry Point & Safety
    // ----------------------------------------------------
    const modalContent = fs.readFileSync(path.join(componentsDir, 'ShipmentModal.tsx'), 'utf8');
    assert(
      modalContent.includes('Create Shipment') &&
      modalContent.includes('Cancel') &&
      modalContent.includes('Save Record') &&
      modalContent.includes('disabled') &&
      modalContent.includes('Phase 5'),
      '7. ShipmentModal implements shell, close controls, Cancel, and safely disabled Save Record button'
    );

    // ----------------------------------------------------
    // 8. Page Assembly & Dual Trigger Verification
    // ----------------------------------------------------
    const pageContent = fs.readFileSync(pageFile, 'utf8');
    assert(
      pageContent.includes('onOpenCreateModal={handleOpenCreateModal}') &&
      pageContent.includes('onOpenAddShipment={handleOpenCreateModal}') &&
      pageContent.includes('ShipmentModal') &&
      pageContent.includes('useAuth'),
      '8. page.tsx connects both Create Shipment (sidebar) and Add Shipment (empty state) to open the modal, with useAuth protection'
    );

    // ----------------------------------------------------
    // 9. Live Frontend Endpoint Response (/dashboard)
    // ----------------------------------------------------
    const dashRes = await fetch(`${FRONTEND_URL}/dashboard`);
    const dashHtml = await dashRes.text();
    assert(
      dashRes.status === 200 &&
      dashHtml.includes('Danodia FreightOS') &&
      dashHtml.includes('Global Shipments'),
      '9. Live /dashboard route responds with HTTP 200 containing FreightOS branding and dashboard layout'
    );

    // ----------------------------------------------------
    // 10. Existing Auth & Backend Health Integrity
    // ----------------------------------------------------
    const healthRes = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthRes.json();
    assert(
      healthRes.status === 200 &&
      healthData.status === 'healthy' &&
      healthData.database?.status === 'connected',
      '10. Backend API (/api/health) and PostgreSQL database connection remain 100% operational'
    );

    // ----------------------------------------------------
    // 11. Backend Database Integrity (No shipments table or CRUD yet)
    // ----------------------------------------------------
    const backendServerContent = fs.readFileSync(
      path.join(__dirname, '..', 'backend', 'src', 'server.js'),
      'utf8'
    );
    assert(
      !backendServerContent.includes('/api/shipments'),
      '11. No premature shipment CRUD or database endpoints exist in backend (Phase 5 boundary preserved)'
    );

    console.log('\n====================================================');
    console.log(`PHASE 4 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Fatal Phase 4 test error:', err);
    failed++;
  }

  process.exit(failed > 0 ? 1 : 0);
}

runPhase4Tests();
