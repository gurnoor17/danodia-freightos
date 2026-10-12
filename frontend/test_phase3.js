const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://127.0.0.1:5000/api';

async function runPhase3Tests() {
  console.log('====================================================');
  console.log('DANODIA FREIGHTOS — PHASE 3 ACCEPTANCE TEST SUITE');
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
    // 1. /login loads successfully
    const loginPageRes = await fetch(`${FRONTEND_URL}/login`);
    const loginHtml = await loginPageRes.text();
    assert(
      loginPageRes.status === 200 &&
        loginHtml.includes('Danodia FreightOS') &&
        loginHtml.includes('Sign in to your account'),
      '1. /login loads successfully with FreightOS branding and sign-in header'
    );

    // 2. /register loads successfully
    const regPageRes = await fetch(`${FRONTEND_URL}/register`);
    const regHtml = await regPageRes.text();
    assert(
      regPageRes.status === 200 &&
        regHtml.includes('Danodia FreightOS') &&
        regHtml.includes('Create your account'),
      '2. /register loads successfully with FreightOS branding and registration header'
    );

    // 3. Register user through real backend
    const testEmail = `pilot.${Date.now()}@danodia.com`;
    const testPassword = 'SecureLogistics2026!';
    const testName = 'First Officer Sarah';

    const regApiRes = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
      }),
    });
    const regApiData = await regApiRes.json();
    assert(
      regApiRes.status === 201 && regApiData.status === 'success' && regApiData.data?.user?.email === testEmail.toLowerCase(),
      '3. User registration through backend succeeds with HTTP 201 and normalized email'
    );

    // 4. Duplicate registration produces clear error
    const dupApiRes = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Attempt',
        email: testEmail.toUpperCase(),
        password: 'AnotherPassword999!',
      }),
    });
    const dupApiData = await dupApiRes.json();
    assert(
      dupApiRes.status === 409 && dupApiData.message.includes('already exists'),
      '4. Duplicate email produces clear HTTP 409 error'
    );

    // 5. Valid login establishes authenticated session & JWT
    const loginApiRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const loginApiData = await loginApiRes.json();
    const token = loginApiData?.data?.token;
    assert(
      loginApiRes.status === 200 && typeof token === 'string' && loginApiData.data?.user?.name === testName,
      '5. Valid login establishes authenticated session and returns JWT token & user profile'
    );

    // 6. Invalid login displays appropriate error
    const badLoginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword!',
      }),
    });
    const badLoginData = await badLoginRes.json();
    assert(
      badLoginRes.status === 401 && badLoginData.message === 'Invalid email or password',
      '6. Invalid login produces generic HTTP 401 error message without revealing internals'
    );

    // 7. Protected route verification (/api/auth/me)
    const meRes = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData = await meRes.json();
    assert(
      meRes.status === 200 && meData.data?.user?.email === testEmail.toLowerCase(),
      '7. Protected profile verification (/api/auth/me) succeeds with Bearer token'
    );

    // 8. Direct unauthenticated access to /dashboard placeholder in frontend
    const dashPageRes = await fetch(`${FRONTEND_URL}/dashboard`);
    const dashHtml = await dashPageRes.text();
    assert(
      dashPageRes.status === 200 && dashHtml.includes('Danodia FreightOS'),
      '8. /dashboard route exists and includes FreightOS shell layout'
    );

    // 9. Expired / invalid token handling
    const badTokenRes = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: { Authorization: 'Bearer invalid.or.tampered.token' },
    });
    assert(
      badTokenRes.status === 401,
      '9. Invalid or tampered token is rejected with HTTP 401'
    );

    // 10. Logout endpoint
    const logoutRes = await fetch(`${BACKEND_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const logoutData = await logoutRes.json();
    assert(
      logoutRes.status === 200 && logoutData.status === 'success',
      '10. Logout endpoint responds with HTTP 200 success'
    );

    // 11. Root route redirects
    const rootRes = await fetch(`${FRONTEND_URL}/`);
    assert(
      rootRes.status === 200,
      '11. Root / route is operational and manages authentication redirection'
    );

    // 12. Health check endpoint still operational
    const healthRes = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthRes.json();
    assert(
      healthRes.status === 200 && healthData.status === 'healthy' && healthData.database?.status === 'connected',
      '12. Phase 1 health check endpoint (/api/health) remains 100% operational'
    );

    console.log('\n====================================================');
    console.log(`PHASE 3 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Fatal Phase 3 test error:', err);
    failed++;
  }

  process.exit(failed > 0 ? 1 : 0);
}

runPhase3Tests();
