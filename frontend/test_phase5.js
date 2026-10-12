const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://127.0.0.1:5000/api';

async function runPhase5Tests() {
  console.log('====================================================');
  console.log('DANODIA FREIGHTOS — PHASE 5 COMPLETE CRUD TEST SUITE');
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
    // 1. Health check still healthy
    const healthRes = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthRes.json();
    assert(
      healthRes.status === 200 && healthData.status === 'healthy',
      '1. Backend API health check (/api/health) is operational'
    );

    // 2. Register & Login test user
    const email = `phase5.user.${Date.now()}@danodia.com`;
    const password = 'SecureLogistics2026!';
    const name = 'Logistics Director Elena';

    const regRes = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, '2. Registration of new test user succeeds');

    const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const loginData = await loginRes.json();
    const token = loginData?.data?.token;
    assert(loginRes.status === 200 && typeof token === 'string', '3. Login returns valid JWT token');

    // 4. Initial state: 0 shipments
    const initialListRes = await fetch(`${BACKEND_URL}/shipments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const initialListData = await initialListRes.json();
    assert(
      initialListRes.status === 200 &&
      initialListData.data?.shipments?.length === 0 &&
      initialListData.data?.summary?.count === 0,
      '4. Initial shipment list is clean (0 shipments for fresh user)'
    );

    // 5. Initial summary aggregates
    const initialSumRes = await fetch(`${BACKEND_URL}/shipments/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const initialSumData = await initialSumRes.json();
    assert(
      initialSumRes.status === 200 && initialSumData.data?.all?.shipmentCount === 0,
      '5. Initial database summary cards show 0 shipments'
    );

    // 6. Create shipment 1 (USA) with complete fields matching screenshot
    const shipment1Payload = {
      region: 'USA',
      assigned_manager: 'Marcus Sterling',
      invoice_no: 'INV-2026-USA-101',
      fba_id: 'FBA18ZK99',
      container_no: 'MSKU-481920-1',
      number_of_boxes: 120,
      total_weight_kg: 2850.5,
      volume_cbm: 14.8,
      pickup_date: '2026-10-01',
      sailing_date: '2026-10-06',
      expected_eta: '2026-10-24',
      actual_arrival: null,
    };

    const create1Res = await fetch(`${BACKEND_URL}/shipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(shipment1Payload),
    });
    const create1Data = await create1Res.json();
    const ship1 = create1Data.data?.shipment;
    assert(
      create1Res.status === 201 &&
      ship1?.id &&
      ship1?.invoice_no === 'INV-2026-USA-101' &&
      ship1?.number_of_boxes === 120 &&
      ship1?.total_weight_kg === 2850.5,
      '6. Create Shipment 1 (USA) via POST /api/shipments -> HTTP 201'
    );

    // 7. Create shipment 2 (UK)
    const shipment2Payload = {
      region: 'UK',
      assigned_manager: 'Sarah Jenkins',
      invoice_no: 'INV-2026-UK-202',
      fba_id: 'FBA17XY41',
      container_no: 'CMA-77412-9',
      number_of_boxes: 80,
      total_weight_kg: 1400.0,
      volume_cbm: 7.25,
      pickup_date: '2026-10-02',
      sailing_date: '2026-10-08',
      expected_eta: '2026-10-22',
      actual_arrival: null,
    };

    const create2Res = await fetch(`${BACKEND_URL}/shipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(shipment2Payload),
    });
    const create2Data = await create2Res.json();
    const ship2 = create2Data.data?.shipment;
    assert(
      create2Res.status === 201 && ship2?.id && ship2?.invoice_no === 'INV-2026-UK-202',
      '7. Create Shipment 2 (UK) via POST /api/shipments -> HTTP 201'
    );

    // 8. Verify database summary reflects both shipments
    const sumRes = await fetch(`${BACKEND_URL}/shipments/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const sumData = await sumRes.json();
    const s = sumData.data;
    assert(
      s?.all?.shipmentCount === 2 &&
      s?.all?.totalWeightKg === (2850.5 + 1400.0) &&
      s?.usa?.shipmentCount === 1 &&
      s?.uk?.shipmentCount === 1 &&
      s?.germany?.shipmentCount === 0,
      '8. Database summary cards calculate real origin totals from PostgreSQL'
    );

    // 9. Search by invoice number
    const searchInvRes = await fetch(`${BACKEND_URL}/shipments?search=USA-101`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const searchInvData = await searchInvRes.json();
    assert(
      searchInvData.data?.shipments?.length === 1 &&
      searchInvData.data?.shipments[0]?.invoice_no === 'INV-2026-USA-101',
      '9. Search by invoice number returns matching shipment'
    );

    // 10. Search by FBA ID
    const searchFbaRes = await fetch(`${BACKEND_URL}/shipments?search=XY41`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const searchFbaData = await searchFbaRes.json();
    assert(
      searchFbaData.data?.shipments?.length === 1 &&
      searchFbaData.data?.shipments[0]?.fba_id === 'FBA17XY41',
      '10. Search by FBA ID returns matching shipment'
    );

    // 11. Filter by Region
    const filterRegionRes = await fetch(`${BACKEND_URL}/shipments?region=UK`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const filterRegionData = await filterRegionRes.json();
    assert(
      filterRegionData.data?.shipments?.length === 1 &&
      filterRegionData.data?.shipments[0]?.region === 'UK',
      '11. Filter by region returns only UK shipments'
    );

    // 12. Retrieve shipment by ID
    const getByIdRes = await fetch(`${BACKEND_URL}/shipments/${ship1.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const getByIdData = await getByIdRes.json();
    assert(
      getByIdRes.status === 200 && getByIdData.data?.shipment?.id === ship1.id,
      '12. Retrieve shipment by ID (GET /api/shipments/:id) returns exact record'
    );

    // 13. Update shipment & deliver
    const updateRes = await fetch(`${BACKEND_URL}/shipments/${ship1.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        number_of_boxes: 130,
        actual_arrival: '2026-10-23',
      }),
    });
    const updateData = await updateRes.json();
    assert(
      updateRes.status === 200 &&
      updateData.data?.shipment?.number_of_boxes === 130 &&
      updateData.data?.shipment?.actual_arrival === '2026-10-23' &&
      updateData.data?.shipment?.status === 'Delivered',
      '13. Update shipment (PATCH /api/shipments/:id) modifies boxes and auto-derives Delivered status',
      `Status: ${updateRes.status}, Body: ${JSON.stringify(updateData)}`
    );

    // 14. Delete shipment 1
    const delRes = await fetch(`${BACKEND_URL}/shipments/${ship1.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(delRes.status === 200, '14. Delete shipment (DELETE /api/shipments/:id) -> HTTP 200');

    // 15. Verify count after deletion
    const postDelListRes = await fetch(`${BACKEND_URL}/shipments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const postDelListData = await postDelListRes.json();
    assert(
      postDelListData.data?.shipments?.length === 1 &&
      postDelListData.data?.shipments[0]?.id === ship2.id,
      '15. List count decreased to 1 and deleted record is no longer returned'
    );

    // 16. Verify /dashboard HTML serves FreightOS branding and dashboard layout
    const dashPageRes = await fetch(`${FRONTEND_URL}/dashboard`);
    const dashHtml = await dashPageRes.text();
    assert(
      dashPageRes.status === 200 &&
      dashHtml.includes('Danodia FreightOS') &&
      dashHtml.includes('Global Shipments'),
      '16. Live /dashboard route responds with HTTP 200 and FreightOS layout'
    );

    console.log('\n====================================================');
    console.log(`PHASE 5 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Fatal Phase 5 test error:', err);
    failed++;
  }

  process.exit(failed > 0 ? 1 : 0);
}

runPhase5Tests();
