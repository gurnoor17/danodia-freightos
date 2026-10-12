# Shipment Manager (Danodia FreightOS)

> **Phase 3: Login & Registration UI (Authentication Client)**  
> Enterprise Global Logistics & Shipment Management Platform

---

## 1. Project Overview

**Shipment Manager (Danodia FreightOS)** is an enterprise web application designed to manage global shipments, cargo metrics, logistics dates, and shipment tracking across international supply chains.

* **Phase 1**: Established foundational full-stack architecture, Next.js frontend, Express backend, PostgreSQL connection pool, and health-check endpoint.
* **Phase 2**: Implemented backend authentication system with bcrypt password hashing (12 salt rounds), stateless JWT access tokens, Joi validation, rate limiting, and users database migration.
* **Phase 3**: Built polished, accessible, and responsive **Login and Registration Pages** (`/login`, `/register`), route protection for `/dashboard`, centralized API client with fallback resiliency, and React AuthContext state management.

---

## 2. Directory Structure

```text
shipment-manager/
├── frontend/
│   ├── public/
│   │   └── .gitkeep
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx        (protected placeholder dashboard)
│   │   │   ├── login/
│   │   │   │   └── page.tsx        (login page with validation)
│   │   │   ├── register/
│   │   │   │   └── page.tsx        (registration page with validation)
│   │   │   ├── favicon.ico
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx          (AuthProvider wrapper & SaaS styling)
│   │   │   └── page.tsx            (root auth-aware redirect)
│   │   ├── components/
│   │   │   ├── Alert.tsx           (accessible error/success banner)
│   │   │   ├── AuthLayout.tsx      (Danodia FreightOS branding layout)
│   │   │   ├── FormInput.tsx       (accessible form input with error state)
│   │   │   ├── PasswordToggle.tsx  (show/hide password toggle)
│   │   │   └── SubmitButton.tsx    (primary button with loading spinner)
│   │   ├── context/
│   │   │   └── AuthContext.tsx     (React Context auth state manager)
│   │   └── lib/
│   │       └── api.ts              (centralized API client & security docs)
│   ├── .env.local.example
│   ├── .env.local                  (local secrets — gitignored)
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── test_phase3.js              (Phase 3 automated test suite)
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   └── auth.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   └── health.js
│   │   ├── services/
│   │   │   └── auth.service.js
│   │   ├── utils/
│   │   │   └── jwt.js
│   │   ├── validators/
│   │   │   └── auth.validator.js
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   ├── .env                        (local secrets — gitignored)
│   ├── test_auth.js                (Phase 2 automated test suite)
│   └── package.json
├── database/
│   ├── migrations/
│   │   └── 001_create_users_table.sql
│   └── schema.sql
├── postman_collection.json         (Postman collection)
├── .gitignore
└── README.md
```

---

## 3. Technology Stack

| Layer | Technologies & Tools |
| :--- | :--- |
| **Frontend UI** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS |
| **State & API** | React Context (`AuthContext`), Centralized API Client (`lib/api.ts`) |
| **Backend API** | Node.js, Express.js (JavaScript CommonJS only — no TypeScript) |
| **Security & Tokens** | `jsonwebtoken` (HS256 access tokens), `bcrypt` (12 rounds) |
| **Validation** | Joi (backend schema validation), client-side accessible validation |
| **Database** | PostgreSQL 14+, Native `pg` Connection Pool (parameterized queries) |

---

## 4. Frontend Routes & Components

### 4.1 Routes
* **`/login`**:
  * Fields: Email address, Password.
  * Show/hide password control.
  * Inline validation errors for missing or malformed inputs.
  * Displays success notification when redirected from `/register?registered=true`.
  * Redirects authenticated users to `/dashboard`.
  * Links to `/register`.
* **`/register`**:
  * Fields: Full name, Email address, Password, Confirm password.
  * Password visibility controls for both password fields.
  * Validates: name (2-100 chars), email format, password (min 8 chars), confirm password match.
  * Handles duplicate registration (HTTP 409) with a clear notification.
  * On success, navigates to `/login?registered=true`.
  * Links to `/login`.
* **`/dashboard`**:
  * Protected route. Unauthenticated visitors are redirected to `/login`.
  * Displays verified session details (User Name, Email, UUID) verified via `GET /api/auth/me`.
  * Contains **Sign Out** button that clears client state and returns to `/login`.
  * Notifies user that Phase 4 will implement shipment metrics, tracking, and management.
* **`/`**:
  * Root redirect: redirects authenticated users to `/dashboard` and guests to `/login`.

### 4.2 Reusable Components
* **`AuthLayout`**: Logistics branding header with container ship geometry icon, FreightOS title, light surface card, and footer navigation.
* **`FormInput`**: Accessible input with `<label>`, focus rings (`ring-indigo-500`), assistive helper text, and `aria-invalid` / `aria-describedby` error states.
* **`PasswordToggle`**: Eye / Eye-slash SVG button with accessible `aria-label`.
* **`SubmitButton`**: Purple/indigo primary button (`bg-indigo-600 hover:bg-indigo-700`) with loading spinner and disabled state to prevent duplicate submissions.
* **`Alert`**: Accessible inline notification banners for API error messages and registration success.

---

## 5. Security Architecture & Token Handling

In this phase, the application maintains a consistent stateless access token strategy:
1. **API Client Communication**: All requests flow through `frontend/src/lib/api.ts`.
2. **Bearer Authentication**: Protected endpoints receive the token via `Authorization: Bearer <token>`.
3. **Session Verification**: `AuthContext` verifies stored tokens with `GET /api/auth/me` on startup. If a token is expired or altered, the state is cleared and the user is redirected to `/login`.
4. **Security Trade-Off Documentation**:
   * *Trade-off*: Storing access tokens in client-side memory / session storage makes them accessible to JavaScript. In production, HttpOnly cookies prevent script access, mitigating XSS token extraction.
   * *Mitigation*: Tokens are short-lived (15-minute expiration) to minimize exposure windows.
   * *CSRF Defense*: Custom `Authorization: Bearer <token>` headers protect against Cross-Site Request Forgery (CSRF).

---

## 6. How to Run & Test

### 6.1 Running the Servers
```bash
# Terminal 1 — Backend:
cd backend
npm run dev    # Listening on http://127.0.0.1:5000

# Terminal 2 — Frontend:
cd frontend
npm run dev    # Listening on http://localhost:3000
```

### 6.2 Running Automated Tests
```bash
# Backend Test Suite (Phase 2 Auth & Database):
cd backend
npm test

# Frontend Test Suite (Phase 3 Integration & Routes):
cd frontend
npm test
```

### Phase 3 Test Results:
```text
====================================================
DANODIA FREIGHTOS — PHASE 3 ACCEPTANCE TEST SUITE
====================================================

[PASS] 1. /login loads successfully with FreightOS branding and sign-in header
[PASS] 2. /register loads successfully with FreightOS branding and registration header
[PASS] 3. User registration through backend succeeds with HTTP 201 and normalized email
[PASS] 4. Duplicate email produces clear HTTP 409 error
[PASS] 5. Valid login establishes authenticated session and returns JWT token & user profile
[PASS] 6. Invalid login produces generic HTTP 401 error message without revealing internals
[PASS] 7. Protected profile verification (/api/auth/me) succeeds with Bearer token
[PASS] 8. /dashboard route exists and includes FreightOS shell layout
[PASS] 9. Invalid or tampered token is rejected with HTTP 401
[PASS] 10. Logout endpoint responds with HTTP 200 success
[PASS] 11. Root / route is operational and manages authentication redirection
[PASS] 12. Phase 1 health check endpoint (/api/health) remains 100% operational

====================================================
PHASE 3 TEST SUMMARY: 12 PASSED, 0 FAILED
====================================================
```

Ready for **Phase 4: Shipment Manager Dashboard**!
