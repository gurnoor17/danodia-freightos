require('dotenv').config({ path: './.env' });

const BASE_URL = 'http://127.0.0.1:5000/api';

async function runShipmentTests() {
  console.log('====================================================');
  console.log('DANODIA FREIGHTOS — PHASE 5 SHIPMENT CRUD TEST SUITE');
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
    // 0. Setup: Register and Login two test users (Owner and Foreign User)
    const ownerEmail = `captain.${Date.now()}@danodia.com`;
    const foreignEmail = `other.${Date.now()}@danodia.com`;
    const password = 'StrongPassword123!';

    await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Captain Morgan', email: ownerEmail, password }),
    });
    const ownerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ownerEmail, password }),
    });
    const ownerLoginData = await ownerLoginRes.json();
    const ownerToken = ownerLoginData?.data?.token;

    await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'First Mate Jack', email: foreignEmail, password }),
    });
    const foreignLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: foreignEmail, password }),
    });
    const foreignLoginData = await foreignLoginRes.json();
    const foreignToken = foreignLoginData?.data?.token;

    assert(ownerToken && foreignToken, '0. Test users registered and logged in with valid JWT tokens');

    // 1. Create shipment with valid data -> HTTP 201
    const shipmentPayload = {
      region: 'USA',
      category: 'Electronics',
      assigned_manager: 'Marcus Sterling',
      invoice_no: 'INV-2026-9001',
      fba_id: 'FBA18ZK99',
      container_no: 'MSKU-781920-4',
      number_of_boxes: 120,
      total_weight_kg: 2450.5,
      volume_cbm: 14.25,
      pickup_date: '2026-10-01',
      sailing_date: '2026-10-05',
      expected_eta: '2026-10-25',
      actual_arrival: null,
    };

    const createRes = await fetch(`${BASE_URL}/shipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify(shipmentPayload),
    });
    const createData = await createRes.json();
    const createdShipment = createData?.data?.shipment;

    assert(
      createRes.status === 201 &&
      createData.status === 'success' &&
      createdShipment?.id &&
      createdShipment?.invoice_no === 'INV-2026-9001' &&
      createdShipment?.number_of_boxes === 120 &&
      createdShipment?.total_weight_kg === 2450.5 &&
      createdShipment?.volume_cbm === 14.25,
      '1. Create shipment with valid data -> HTTP 201 with parsed cargo metrics'
    );

    // 2. Reject missing required fields -> HTTP 400
    const missingRes = await fetch(`${BASE_URL}/shipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        region: 'USA',
        // missing assigned_manager, invoice_no, container_no, etc.
      }),
    });
    const missingData = await missingRes.json();
    assert(
      missingRes.status === 400 && missingData.status === 'error',
      '2. Reject missing required fields -> HTTP 400'
    );

    // 3. Reject negative numeric values -> HTTP 400
    const badNumRes = await fetch(`${BASE_URL}/shipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        ...shipmentPayload,
        invoice_no: 'INV-NEG-001',
        number_of_boxes: -5,
      }),
    });
    assert(
      badNumRes.status === 400,
      '3. Reject negative number of boxes -> HTTP 400'
    );

    // 4. Reject invalid date sequence (sailing date before pickup date) -> HTTP 400
    const badDateRes = await fetch(`${BASE_URL}/shipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        ...shipmentPayload,
        invoice_no: 'INV-DATES-001',
        pickup_date: '2026-10-15',
        sailing_date: '2026-10-10', // Before pickup!
      }),
    });
    const badDateData = await badDateRes.json();
    assert(
      badDateRes.status === 400 && JSON.stringify(badDateData).includes('Sailing date cannot precede pickup date'),
      '4. Reject invalid date sequence (sailing date precedes pickup date) -> HTTP 400'
    );

    // 5. Retrieve created shipment by ID -> HTTP 200
    const getRes = await fetch(`${BASE_URL}/shipments/${createdShipment.id}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const getData = await getRes.json();
    assert(
      getRes.status === 200 && getData.data?.shipment?.id === createdShipment.id,
      '5. Retrieve created shipment by ID -> HTTP 200'
    );

    // 6. Update shipment -> HTTP 200
    const updateRes = await fetch(`${BASE_URL}/shipments/${createdShipment.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        number_of_boxes: 150,
        total_weight_kg: 2900.0,
        assigned_manager: 'Marcus Sterling Updated',
      }),
    });
    const updateData = await updateRes.json();
    assert(
      updateRes.status === 200 &&
      updateData.data?.shipment?.number_of_boxes === 150 &&
      updateData.data?.shipment?.total_weight_kg === 2900.0 &&
      updateData.data?.shipment?.assigned_manager === 'Marcus Sterling Updated',
      '6. Update shipment fields -> HTTP 200 with updated record'
    );

    // Create a few more shipments across regions to test search, filters, and summary
    const ukShipment = await (await fetch(`${BASE_URL}/shipments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        region: 'UK',
        assigned_manager: 'Emma Watson',
        invoice_no: 'INV-2026-UK-100',
        fba_id: 'FBA-UK-887',
        container_no: 'CMA-99120-1',
        number_of_boxes: 80,
        total_weight_kg: 1200.0,
        volume_cbm: 6.5,
        pickup_date: '2026-10-02',
        sailing_date: '2026-10-06',
        expected_eta: '2026-10-20',
      }),
    })).json();

    const deShipment = await (await fetch(`${BASE_URL}/shipments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        region: 'Germany',
        assigned_manager: 'Hans Gruber',
        invoice_no: 'INV-2026-DE-200',
        fba_id: 'FBA-DE-441',
        container_no: 'HPL-33120-9',
        number_of_boxes: 200,
        total_weight_kg: 3500.0,
        volume_cbm: 18.0,
        pickup_date: '2026-10-01',
        sailing_date: '2026-10-04',
        expected_eta: '2026-10-18',
      }),
    })).json();

    // 7. Search by invoice number
    const searchInvRes = await fetch(`${BASE_URL}/shipments?search=UK-100`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const searchInvData = await searchInvRes.json();
    assert(
      searchInvRes.status === 200 &&
      searchInvData.data?.shipments?.length === 1 &&
      searchInvData.data?.shipments[0]?.invoice_no === 'INV-2026-UK-100',
      '7. Search by invoice number matches correctly'
    );

    // 8. Search by FBA ID
    const searchFbaRes = await fetch(`${BASE_URL}/shipments?search=DE-441`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const searchFbaData = await searchFbaRes.json();
    assert(
      searchFbaRes.status === 200 &&
      searchFbaData.data?.shipments?.length === 1 &&
      searchFbaData.data?.shipments[0]?.fba_id === 'FBA-DE-441',
      '8. Search by FBA ID matches correctly'
    );

    // 9. Filter by region
    const filterRegionRes = await fetch(`${BASE_URL}/shipments?region=Germany`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const filterRegionData = await filterRegionRes.json();
    assert(
      filterRegionRes.status === 200 &&
      filterRegionData.data?.shipments?.length === 1 &&
      filterRegionData.data?.shipments[0]?.region === 'Germany',
      '9. Filter by region returns matching regional shipments'
    );

    // 10. Verify dashboard database summary aggregates
    const summaryRes = await fetch(`${BASE_URL}/shipments/summary`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const summaryData = await summaryRes.json();
    const sum = summaryData.data;
    assert(
      summaryRes.status === 200 &&
      sum?.all?.shipmentCount === 3 &&
      sum?.all?.totalWeightKg === (2900 + 1200 + 3500) &&
      sum?.usa?.shipmentCount === 1 &&
      sum?.uk?.shipmentCount === 1 &&
      sum?.germany?.shipmentCount === 1,
      '10. Dashboard database summary calculates correct origin counts, weight, and volume'
    );

    // 11. Access control: Foreign user cannot access or modify owner shipment -> HTTP 404
    const foreignGetRes = await fetch(`${BASE_URL}/shipments/${createdShipment.id}`, {
      headers: { Authorization: `Bearer ${foreignToken}` },
    });
    assert(
      foreignGetRes.status === 404,
      '11. Access control: Foreign user cannot access owner shipment (HTTP 404)'
    );

    const foreignPatchRes = await fetch(`${BASE_URL}/shipments/${createdShipment.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${foreignToken}`,
      },
      body: JSON.stringify({ number_of_boxes: 999 }),
    });
    assert(
      foreignPatchRes.status === 404,
      '12. Access control: Foreign user cannot update owner shipment (HTTP 404)'
    );

    // 12. Delete shipment with owner authorization
    const delRes = await fetch(`${BASE_URL}/shipments/${createdShipment.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const delData = await delRes.json();
    assert(
      delRes.status === 200 && delData.status === 'success',
      '13. Delete shipment with owner authorization -> HTTP 200'
    );

    // Verify it is gone
    const getDeletedRes = await fetch(`${BASE_URL}/shipments/${createdShipment.id}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(
      getDeletedRes.status === 404,
      '14. Deleted shipment returns HTTP 404 on subsequent lookup'
    );

    console.log('\n====================================================');
    console.log(`PHASE 5 BACKEND TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  }

  process.exit(failed > 0 ? 1 : 0);
}

runShipmentTests();
