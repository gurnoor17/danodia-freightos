# Shipment Manager (Danodia FreightOS)

> **Phase 2: Backend Authentication System**  
> Enterprise Global Logistics & Shipment Management Platform

---

## 1. Project Overview

**Shipment Manager (Danodia FreightOS)** is an enterprise web application designed to manage global shipments, cargo metrics, logistics dates, and shipment tracking across international supply chains.

* **Phase 1**: Established foundational full-stack architecture, Next.js frontend, Express backend, PostgreSQL connection pool, and health check endpoint.
* **Phase 2**: Implemented a robust, secure **Backend Authentication System** featuring password hashing (bcrypt, salt rounds 12), stateless JWT access tokens, Joi input validation, rate limiting, and user profile management in PostgreSQL.

---

## 2. Directory Structure

```text
shipment-manager/
├── frontend/
│   ├── public/
│   │   └── .gitkeep
│   ├── src/
│   │   └── app/
│   │       ├── favicon.ico
│   │       ├── globals.css
│   │       ├── layout.tsx
│   │       └── page.tsx
│   ├── .env.local.example
│   ├── .env.local             (local secrets — gitignored)
│   ├── next.config.ts
│   ├── tsconfig.json
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
│   │   │   └── errorHandler.js (backward compat export)
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
│   ├── .env                   (local secrets — gitignored)
│   ├── test_auth.js           (automated Phase 2 test suite)
│   └── package.json
├── database/
│   ├── migrations/
│   │   └── 001_create_users_table.sql
│   └── schema.sql
├── postman_collection.json    (Postman Phase 2 collection)
├── .gitignore
└── README.md
```

---

## 3. Technology Stack

| Layer | Technologies & Tools |
| :--- | :--- |
| **Backend Framework** | Node.js, Express.js (JavaScript CommonJS only — no TypeScript) |
| **Authentication & Tokens** | `jsonwebtoken` (HS256, explicit issuer/audience/expiry claims) |
| **Password Security** | `bcrypt` (12 salt rounds, never plaintext) |
| **Validation & Safety** | `joi` schema validation, `express-rate-limit` (brute-force defense) |
| **Database** | PostgreSQL 14+, Native `pg` Connection Pool (parameterized queries, no ORM) |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS |
| **Environment** | macOS, Git, Visual Studio Code |

---

## 4. Getting Started & Setup Guide

### 4.1 Prerequisites
Ensure the following tools are installed on your machine:
* **Node.js** (v18+ or v20+)
* **npm** (v9+)
* **PostgreSQL** (running locally on port 5432)
* **Git**

### 4.2 Database Setup & Migrations
1. Create database:
   ```bash
   createdb shipment_manager
   ```
2. Run initial Phase 1 foundation:
   ```bash
   psql -d shipment_manager -f database/schema.sql
   ```
3. Run Phase 2 Users migration:
   ```bash
   psql -d shipment_manager -f database/migrations/001_create_users_table.sql
   ```

### 4.3 Backend Configuration
1. Navigate to `backend/` and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create `.env` from template:
   ```bash
   cp .env.example .env
   ```

3. Configure environment variables in `backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/shipment_manager
   FRONTEND_URL=http://localhost:3000
   JWT_SECRET=your_long_random_64_char_secret_key_here
   JWT_EXPIRES_IN=15m
   ```

---

## 5. Running the Application

### 5.1 Starting Backend Server
```bash
cd backend
npm run dev   # Development watcher mode with nodemon
npm start     # Standard production mode
```
Server runs on `http://127.0.0.1:5000` (or `http://localhost:5000`).

> **macOS AirPlay Note**:  
> macOS AirPlay Receiver occupies port 5000 wildcard by default. The server automatically falls back to binding `127.0.0.1:5000`. You can also disable AirPlay Receiver in **System Settings > General > AirDrop & Handoff > AirPlay Receiver (OFF)** to free `localhost:5000`.

### 5.2 Starting Frontend Server
```bash
cd frontend
npm run dev   # Runs on http://localhost:3000
```

---

## 6. Authentication API Specification

### 6.1 `POST /api/auth/register`
Creates a new user profile with password hashed via bcrypt (work factor 12).
* **Request Body**:
  ```json
  {
    "name": "Jane Danodia",
    "email": "jane@danodia.com",
    "password": "StrongPassword123!"
  }
  ```
* **Success (`201 Created`)**:
  ```json
  {
    "status": "success",
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": "e6a143d2-36a8-4bb8-9588-4e89bb0dfb2c",
        "name": "Jane Danodia",
        "email": "jane@danodia.com",
        "created_at": "2026-10-12T12:35:00.000Z",
        "updated_at": "2026-10-12T12:35:00.000Z"
      }
    }
  }
  ```
* **Conflict (`409 Conflict`)**: Returned when email already exists.
* **Validation Failure (`400 Bad Request`)**: Returned when Joi validation fails.

### 6.2 `POST /api/auth/login`
Authenticates credentials and returns a short-lived signed JWT access token.
* **Request Body**:
  ```json
  {
    "email": "jane@danodia.com",
    "password": "StrongPassword123!"
  }
  ```
* **Success (`200 OK`)**:
  ```json
  {
    "status": "success",
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "e6a143d2-36a8-4bb8-9588-4e89bb0dfb2c",
        "name": "Jane Danodia",
        "email": "jane@danodia.com",
        "created_at": "2026-10-12T12:35:00.000Z",
        "updated_at": "2026-10-12T12:35:00.000Z"
      }
    }
  }
  ```
* **Failure (`401 Unauthorized`)**: Generic `"Invalid email or password"` for incorrect credentials.

### 6.3 `GET /api/auth/me`
Retrieves authenticated user profile.
* **Headers**: `Authorization: Bearer <token>`
* **Success (`200 OK`)**:
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "e6a143d2-36a8-4bb8-9588-4e89bb0dfb2c",
        "name": "Jane Danodia",
        "email": "jane@danodia.com",
        "created_at": "2026-10-12T12:35:00.000Z",
        "updated_at": "2026-10-12T12:35:00.000Z"
      }
    }
  }
  ```
* **Failure (`401 Unauthorized`)**: Returned when token is missing, invalid, or expired.

### 6.4 `POST /api/auth/logout`
Stateless token logout confirmation.
* **Success (`200 OK`)**:
  ```json
  {
    "status": "success",
    "message": "Logged out successfully. Please discard the client access token."
  }
  ```

---

## 7. Testing & Verification

### 7.1 Automated Backend Test Suite
Run the Phase 2 test suite directly:
```bash
cd backend
npm test
```
Executes all 10 verification scenarios:
* Register new user → HTTP 201
* Register duplicate email → HTTP 409
* Register invalid payload → HTTP 400
* Login valid credentials → HTTP 200 + JWT
* Login invalid credentials → HTTP 401
* Authenticated profile `/api/auth/me` → HTTP 200
* Missing token `/api/auth/me` → HTTP 401
* Tampered token `/api/auth/me` → HTTP 401
* Database verification: bcrypt hash stored, never plaintext
* Health check `/api/health` → HTTP 200

### 7.2 Postman Testing
Import [postman_collection.json](file:///Users/gurnoorsingh/Downloads/ayush/postman_collection.json) directly into Postman.  
The collection pre-configures:
* Automatic JWT extraction into collection variable `{{token}}` on login.
* Ready-to-run test cases for 201, 409, 400, 200, 401, and `/api/auth/me`.
