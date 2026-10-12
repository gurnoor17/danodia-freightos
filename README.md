# Shipment Manager (Danodia FreightOS)

> **Phase 1: Project Initialization & Foundational Architecture**  
> Enterprise Global Logistics & Shipment Management Platform

---

## 1. Project Overview

**Shipment Manager (Danodia FreightOS)** is an enterprise web application designed to manage global shipments, cargo metrics, logistics dates, and shipment tracking across international supply chains.

Phase 1 establishes the foundational full-stack architecture:
* Modern Next.js frontend with App Router, TypeScript, and Tailwind CSS.
* Lightweight, performant Node.js/Express.js backend written in clean JavaScript.
* Direct PostgreSQL database integration using the native `pg` connection pool (no ORM overhead).
* Health check endpoint verifying both API runtime and live database connectivity.
* Environment configuration management and security practices.

---

## 2. Directory Structure

```text
shipment-manager/
├── frontend/
│   ├── public/
│   │   └── .gitkeep
│   ├── src/
│   │   └── app/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       └── globals.css
│   ├── .env.local.example
│   ├── .env.local             (gitignored)
│   ├── next.config.ts
│   ├── tsconfig.json
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   └── .gitkeep
│   │   ├── routes/
│   │   │   ├── health.js
│   │   │   └── .gitkeep
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   ├── services/
│   │   │   └── .gitkeep
│   │   ├── utils/
│   │   │   └── .gitkeep
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   ├── .env                   (gitignored)
│   └── package.json
├── database/
│   └── schema.sql
├── .gitignore
└── README.md
```

---

## 3. Technology Stack

| Layer | Technologies & Tools |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, npm |
| **Backend** | Node.js, Express.js (JavaScript), CORS, Dotenv, Nodemon |
| **Database** | PostgreSQL 14+, Native `pg` Connection Pool (no ORM) |
| **Environment** | macOS, Git, Visual Studio Code |

---

## 4. Getting Started & Setup Guide

### 4.1 Prerequisites
Ensure the following tools are installed on your machine:
* **Node.js** (v18+ or v20+)
* **npm** (v9+)
* **PostgreSQL** (running locally on port 5432)
* **Git**

### 4.2 Database Setup
1. Create the database:
   ```bash
   createdb shipment_manager
   ```
   *(or in `psql`: `CREATE DATABASE shipment_manager;`)*

2. Run the Phase 1 initial schema:
   ```bash
   psql -d shipment_manager -f database/schema.sql
   ```

### 4.3 Backend Configuration
1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create your local environment file from the example template:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your PostgreSQL user and credentials:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/shipment_manager
   FRONTEND_URL=http://localhost:3000
   ```

### 4.4 Frontend Configuration
1. Navigate to the frontend directory and install dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

2. Create your local environment file:
   ```bash
   cp .env.local.example .env.local
   ```

3. Verify `NEXT_PUBLIC_API_URL`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

---

## 5. Running the Application

### 5.1 Starting the Backend
From `backend/`:
* **Development Mode (Watcher):**
  ```bash
  npm run dev
  ```
* **Production / Normal Start:**
  ```bash
  npm start
  ```
The backend server runs on `http://localhost:5000`.

> **macOS Note regarding Port 5000:**  
> On macOS Monterey/Ventura/Sonoma/Sequoia, the default Apple **AirPlay Receiver** service listens on port 5000.  
> To free port 5000 completely for `localhost`:  
> Open **System Settings > General > AirDrop & Handoff > toggle "AirPlay Receiver" OFF**.  
> The backend automatically includes a graceful fallback binding to `127.0.0.1:5000` if port 5000 wildcard is occupied.

### 5.2 Starting the Frontend
From `frontend/`:
* **Development Mode:**
  ```bash
  npm run dev
  ```
* **Production Build & Run:**
  ```bash
  npm run build
  npm start
  ```
The frontend web app runs on `http://localhost:3000`.

---

## 6. Health Check API (`GET /api/health`)

Verifies API operational status and database connection pool health.

### Request
```http
GET /api/health HTTP/1.1
Host: localhost:5000
Accept: application/json
```

### Healthy Response (`200 OK`)
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-10-12T12:00:00.000Z",
  "database": {
    "status": "connected",
    "timestamp": "2026-10-12T12:00:00.000Z"
  }
}
```

### Degraded Response (`503 Service Unavailable`)
```json
{
  "status": "degraded",
  "version": "1.0.0",
  "timestamp": "2026-10-12T12:00:00.000Z",
  "database": {
    "status": "disconnected",
    "error": "connection to server at \"localhost\" failed: Connection refused"
  }
}
```

---

## 7. Security Best Practices

* Actual credentials, database connection strings, and local settings are stored in `.env` and `.env.local`.
* Local `.env*` files are strictly excluded from version control via `.gitignore`.
* Only template files (`.env.example` and `.env.local.example`) are committed.
* Direct PostgreSQL parameterized queries prevent SQL injection.
* Express CORS origin restriction secures API access.

---

## 8. Phase 1 Acceptance Criteria Status

- [x] **Criterion 1**: Frontend starts successfully at `http://localhost:3000`.
- [x] **Criterion 2**: Backend starts successfully at `http://localhost:5000`.
- [x] **Criterion 3**: PostgreSQL database `shipment_manager` exists and is initialized.
- [x] **Criterion 4**: Backend successfully connects to PostgreSQL via `pg.Pool`.
- [x] **Criterion 5**: `GET /api/health` returns API status, version, timestamp, and database connectivity.
- [x] **Criterion 6**: Frontend landing page reaches and displays backend health status.
- [x] **Criterion 7**: Environment files (`.env.example`, `.env.local.example`) configured correctly.
- [x] **Criterion 8**: No hardcoded credentials; local secrets gitignored.
- [x] **Criterion 9**: All files strictly conform to the required directory hierarchy.
- [x] **Criterion 10**: Exclusively Phase 1 scope; ready for Phase 2: JWT Authentication.
