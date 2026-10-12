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
node test_phase3.js

# Frontend Test Suite (Phase 4 Dashboard UI & Specifications):
cd frontend
node test_phase4.js
```

---

## 7. Phase 4: Shipment Manager — Dashboard UI Implementation

### 7.1 Architecture & Component Hierarchy
* `Sidebar.tsx`: Fixed-width dark navy (`#0B1020`) sidebar with Danodia FreightOS branding, "Danodia Global Exports" workspace, primary purple `+ Create Shipment` button, `Dashboard` (active), `Analytics`, `Saved Watchlist`, and authenticated user profile section with sign-out.
* `DashboardHeader.tsx`: "Global Shipments" heading, subtitle, mobile drawer toggle button, and right-aligned "Export CSV" button.
* `SummaryCard.tsx`: Five distinct origin summary cards (`All Origins` with `#503BFF` highlighted border, `USA`, `UK`, `Germany`, `Walmart US`), each rendering shipment count, total weight in kg, and total volume in CBM.
* `ShipmentFilters.tsx`: Search input with exact placeholder (`Search by Invoice No. or FBA ID...`), status dropdown (`All Statuses` default), and mock state toggle.
* `ShipmentResults.tsx`: Bordered results panel with total metrics bar (boxes, weight, volume), empty state view (package icon, "No shipments found", supporting copy, `+ Add Shipment` button), and horizontally scrollable table placeholder.
* `ShipmentModal.tsx`: Modal shell with title, close icon, Cancel button, and disabled `Save Record (Phase 5)` button ensuring no premature CRUD or fake records are inserted.
* `mock-data.ts`: Isolated mock dataset defining `INITIAL_ORIGIN_SUMMARIES`, `SAMPLE_SHIPMENTS`, and `STATUS_OPTIONS`.

### 7.2 Phase 4 Acceptance Test Results:
```text
====================================================
DANODIA FREIGHTOS — PHASE 4 ACCEPTANCE TEST SUITE
====================================================

[PASS] 1.1 Mock data module exists (lib/dashboard/mock-data.ts)
[PASS] 1.2 Mock data module defines the 5 origin cards, sample shipments, and status options
[PASS] 1.3 Dashboard component exists: components/dashboard/Sidebar.tsx
[PASS] 1.3 Dashboard component exists: components/dashboard/DashboardHeader.tsx
[PASS] 1.3 Dashboard component exists: components/dashboard/SummaryCard.tsx
[PASS] 1.3 Dashboard component exists: components/dashboard/ShipmentFilters.tsx
[PASS] 1.3 Dashboard component exists: components/dashboard/ShipmentResults.tsx
[PASS] 1.3 Dashboard component exists: components/dashboard/ShipmentModal.tsx
[PASS] 2. Sidebar implements dark navy theme (#0B1020), FreightOS branding, workspace, + Create Shipment button, nav items, and profile section
[PASS] 3. DashboardHeader displays Global Shipments heading, subtitle, and right-aligned Export CSV button
[PASS] 4. SummaryCard renders shipment count, weight in kg, volume in CBM, and purple accent border (#503BFF)
[PASS] 5. ShipmentFilters includes search input with exact placeholder and status dropdown with All Statuses default
[PASS] 6. ShipmentResults features metric aggregate bar, empty state with package icon and + Add Shipment, and table layout
[PASS] 7. ShipmentModal implements shell, close controls, Cancel, and safely disabled Save Record button
[PASS] 8. page.tsx connects both Create Shipment (sidebar) and Add Shipment (empty state) to open the modal, with useAuth protection
[PASS] 9. Live /dashboard route responds with HTTP 200 containing FreightOS branding and dashboard layout
[PASS] 10. Backend API (/api/health) and PostgreSQL database connection remain 100% operational
[PASS] 11. No premature shipment CRUD or database endpoints exist in backend (Phase 5 boundary preserved)

====================================================
PHASE 4 TEST SUMMARY: 18 PASSED, 0 FAILED
====================================================
```

---

## 8. Phase 5: Shipment Manager — Complete Shipment CRUD & Persistence

### 8.1 Database Migration & Schema
* **Migration File**: [`database/migrations/002_create_shipments_table.sql`](file:///Users/gurnoorsingh/Downloads/ayush/database/migrations/002_create_shipments_table.sql)
* **Table**: `shipments`
  * `id`: UUID Primary Key (`gen_random_uuid()`)
  * `region`: VARCHAR(100) (USA, UK, Germany, Walmart US)
  * `category`: VARCHAR(100)
  * `assigned_manager`: VARCHAR(100)
  * `invoice_no`: VARCHAR(100)
  * `fba_id`: VARCHAR(100)
  * `container_no`: VARCHAR(100)
  * `number_of_boxes`: INTEGER (`CHECK (number_of_boxes >= 0)`)
  * `total_weight_kg`: NUMERIC(12, 2) (`CHECK (total_weight_kg >= 0)`)
  * `volume_cbm`: NUMERIC(12, 2) (`CHECK (volume_cbm >= 0)`)
  * `pickup_date`: DATE
  * `sailing_date`: DATE
  * `expected_eta`: DATE
  * `actual_arrival`: DATE (nullable)
  * `status`: VARCHAR(50) (Auto-derived: Delivered, In Transit, Pending Customs, Booked, or Cancelled)
  * `created_by`: UUID foreign key to `users(id) ON DELETE CASCADE`
  * `created_at`, `updated_at`: TIMESTAMPTZ with automatic trigger
* **Indexes**:
  * `idx_shipments_invoice_no`
  * `idx_shipments_fba_id`
  * `idx_shipments_region`
  * `idx_shipments_status`
  * `idx_shipments_created_by`
  * `idx_shipments_dates` (`pickup_date`, `sailing_date`, `expected_eta`)

### 8.2 Backend REST API Endpoints (`/api/shipments`)
All endpoints enforce JWT authentication and user data isolation (`created_by = req.user.id`).
* `GET /api/shipments/summary`: Single-query database aggregate calculating counts, total weight, and total volume for all origins and each regional card.
* `GET /api/shipments`: Filter by search term (`invoice_no` / `fba_id`), region, and status with pagination metadata and result-set metric totals.
* `POST /api/shipments`: Validates body with Joi (checks cargo metrics and date order: `sailing_date >= pickup_date` and `expected_eta >= sailing_date`), inserts parameterized SQL, returns HTTP 201.
* `GET /api/shipments/:id`: Retrieves shipment by ID with access control (HTTP 404 for missing or unauthorized records).
* `PATCH /api/shipments/:id`: Partially updates permitted fields with auto-status recalculation, parameterized SQL.
* `DELETE /api/shipments/:id`: Deletes record with ownership check.

### 8.3 Frontend Modal & Dashboard Features
* **Modal**: Matches the reference screenshot with 3 distinct numbered sections:
  * Section 1: Consignment Details (Region dropdown, Assigned Manager, Invoice No., FBA ID, Container No.)
  * Section 2: Cargo Metrics (Boxes, Total Weight in kg, Volume in CBM)
  * Section 3: Logistics (Pickup Date, Sailing Date, Expected ETA, Actual Arrival)
* **Inline Validation**: Field-level error messages and date sequencing checks.
* **Full CRUD**: Supports creating new shipments, editing existing records, and deleting with confirmation modal.
* **Real Aggregates**: Removed mock data from production paths; summary cards and results bar calculate directly from PostgreSQL database queries.

### 8.4 Test Suite Verification Results

#### Backend Test Suite (`npm test` in `backend/`):
```text
====================================================
DANODIA FREIGHTOS — PHASE 2 AUTHENTICATION TEST SUITE
====================================================
[PASS] 13/13 Authentication & Security Tests Passed

====================================================
DANODIA FREIGHTOS — PHASE 5 SHIPMENT CRUD TEST SUITE
====================================================
[PASS] 0. Test users registered and logged in with valid JWT tokens
[PASS] 1. Create shipment with valid data -> HTTP 201 with parsed cargo metrics
[PASS] 2. Reject missing required fields -> HTTP 400
[PASS] 3. Reject negative number of boxes -> HTTP 400
[PASS] 4. Reject invalid date sequence (sailing date precedes pickup date) -> HTTP 400
[PASS] 5. Retrieve created shipment by ID -> HTTP 200
[PASS] 6. Update shipment fields -> HTTP 200 with updated record
[PASS] 7. Search by invoice number matches correctly
[PASS] 8. Search by FBA ID matches correctly
[PASS] 9. Filter by region returns matching regional shipments
[PASS] 10. Dashboard database summary calculates correct origin counts, weight, and volume
[PASS] 11. Access control: Foreign user cannot access owner shipment (HTTP 404)
[PASS] 12. Access control: Foreign user cannot update owner shipment (HTTP 404)
[PASS] 13. Delete shipment with owner authorization -> HTTP 200
[PASS] 14. Deleted shipment returns HTTP 404 on subsequent lookup

TOTAL BACKEND TESTS: 28 PASSED, 0 FAILED
```

#### Frontend Integration Test Suite (`node test_phase5.js` in `frontend/`):
```text
====================================================
DANODIA FREIGHTOS — PHASE 5 COMPLETE CRUD TEST SUITE
====================================================
[PASS] 1. Backend API health check (/api/health) is operational
[PASS] 2. Registration of new test user succeeds
[PASS] 3. Login returns valid JWT token
[PASS] 4. Initial shipment list is clean (0 shipments for fresh user)
[PASS] 5. Initial database summary cards show 0 shipments
[PASS] 6. Create Shipment 1 (USA) via POST /api/shipments -> HTTP 201
[PASS] 7. Create Shipment 2 (UK) via POST /api/shipments -> HTTP 201
[PASS] 8. Database summary cards calculate real origin totals from PostgreSQL
[PASS] 9. Search by invoice number returns matching shipment
[PASS] 10. Search by FBA ID returns matching shipment
[PASS] 11. Filter by region returns only UK shipments
[PASS] 12. Retrieve shipment by ID (GET /api/shipments/:id) returns exact record
[PASS] 13. Update shipment (PATCH /api/shipments/:id) modifies boxes and auto-derives Delivered status
[PASS] 14. Delete shipment (DELETE /api/shipments/:id) -> HTTP 200
[PASS] 15. List count decreased to 1 and deleted record is no longer returned
[PASS] 16. Live /dashboard route responds with HTTP 200 and FreightOS layout

TOTAL E2E TESTS: 16 PASSED, 0 FAILED
```


