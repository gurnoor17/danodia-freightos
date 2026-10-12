const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const BASE_URL = 'http://127.0.0.1:5000/api';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runAuthTests() {
  console.log('====================================================');
  console.log('DANODIA FREIGHTOS — PHASE 2 AUTHENTICATION TEST SUITE');
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

  const testEmail = `test.user.${Date.now()}@example.com`;
  const testPassword = 'StrongPassword123!';
  const testName = 'Captain Alex';
  let authToken = null;
  let registeredUserId = null;

  try {
    // Test 1: Register a new user -> HTTP 201
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
      }),
    });
    const regData = await regRes.json();
    registeredUserId = regData?.data?.user?.id;
    assert(
      regRes.status === 201 && regData.status === 'success' && regData.data?.user?.email === testEmail.toLowerCase(),
      '1. Register a new user -> HTTP 201',
      `Status: ${regRes.status}, Body: ${JSON.stringify(regData)}`
    );
    assert(
      regData.data?.user?.password === undefined && regData.data?.user?.password_hash === undefined,
      '1b. Registration does not leak password or password_hash in response',
      JSON.stringify(regData)
    );

    // Test 2: Register the same email again -> HTTP 409
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Attempt',
        email: testEmail.toUpperCase(), // Test case-insensitivity
        password: 'AnotherPassword456!',
      }),
    });
    const dupData = await dupRes.json();
    assert(
      dupRes.status === 409 && dupData.status === 'error',
      '2. Register same email again -> HTTP 409 Conflict',
      `Status: ${dupRes.status}, Body: ${JSON.stringify(dupData)}`
    );

    // Test 3: Register with invalid data -> HTTP 400
    const invRes1 = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '',
        email: 'invalid-email',
        password: 'short',
      }),
    });
    const invData1 = await invRes1.json();
    assert(
      invRes1.status === 400 && invData1.status === 'error' && Array.isArray(invData1.errors),
      '3. Register with invalid data (short password, bad email, empty name) -> HTTP 400',
      `Status: ${invRes1.status}, Body: ${JSON.stringify(invData1)}`
    );

    // Test 4: Login with correct credentials -> HTTP 200 & access token
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const loginData = await loginRes.json();
    authToken = loginData?.data?.token;
    assert(
      loginRes.status === 200 && typeof authToken === 'string' && loginData.data?.user?.id === registeredUserId,
      '4. Login with correct credentials -> HTTP 200, valid JWT token & safe profile',
      `Status: ${loginRes.status}, Body: ${JSON.stringify(loginData)}`
    );
    assert(
      loginData.data?.user?.password_hash === undefined,
      '4b. Login response does not leak password_hash',
      JSON.stringify(loginData)
    );

    // Test 5: Login with incorrect credentials -> HTTP 401
    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword999!',
      }),
    });
    const badLoginData = await badLoginRes.json();
    assert(
      badLoginRes.status === 401 && badLoginData.message === 'Invalid email or password',
      '5. Login with incorrect credentials -> HTTP 401 (Generic error message)',
      `Status: ${badLoginRes.status}, Body: ${JSON.stringify(badLoginData)}`
    );

    // Test 6: Call /api/auth/me with valid token -> HTTP 200
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const meData = await meRes.json();
    assert(
      meRes.status === 200 && meData.data?.user?.id === registeredUserId && meData.data?.user?.email === testEmail.toLowerCase(),
      '6. Call /api/auth/me with valid Bearer token -> HTTP 200 & profile',
      `Status: ${meRes.status}, Body: ${JSON.stringify(meData)}`
    );

    // Test 7: Call /api/auth/me without a token -> HTTP 401
    const noTokenRes = await fetch(`${BASE_URL}/auth/me`);
    const noTokenData = await noTokenRes.json();
    assert(
      noTokenRes.status === 401 && noTokenData.status === 'error',
      '7. Call /api/auth/me without a token -> HTTP 401',
      `Status: ${noTokenRes.status}, Body: ${JSON.stringify(noTokenData)}`
    );

    // Test 8: Call /api/auth/me with a modified or invalid token -> HTTP 401
    const badTokenRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}tamperedSignature123` },
    });
    const badTokenData = await badTokenRes.json();
    assert(
      badTokenRes.status === 401 && badTokenData.status === 'error',
      '8. Call /api/auth/me with tampered token -> HTTP 401',
      `Status: ${badTokenRes.status}, Body: ${JSON.stringify(badTokenData)}`
    );

    // Test 9: Verify password hashes stored in PostgreSQL, never plaintext
    const dbRow = await pool.query('SELECT id, email, password_hash FROM users WHERE id = $1', [registeredUserId]);
    const storedHash = dbRow.rows[0]?.password_hash;
    const isBcrypt = storedHash && storedHash.startsWith('$2b$12$');
    assert(
      isBcrypt && storedHash !== testPassword,
      '9. Confirm password hash is stored in PostgreSQL via bcrypt work factor 12 (never plaintext)',
      `Stored Hash: ${storedHash}`
    );

    // Test 10: Confirm the health endpoint still works -> HTTP 200
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(
      healthRes.status === 200 && healthData.status === 'healthy' && healthData.database?.status === 'connected',
      '10. Confirm Phase 1 health endpoint still operational -> HTTP 200',
      `Status: ${healthRes.status}, Body: ${JSON.stringify(healthData)}`
    );

    // Test 11: Call /api/auth/logout -> HTTP 200
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const logoutData = await logoutRes.json();
    assert(
      logoutRes.status === 200 && logoutData.status === 'success',
      '11. Call /api/auth/logout -> HTTP 200 success response',
      `Status: ${logoutRes.status}, Body: ${JSON.stringify(logoutData)}`
    );

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Fatal test execution error:', err);
  } finally {
    await pool.end();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runAuthTests();
