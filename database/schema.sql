-- ============================================================================
-- Shipment Manager (Danodia FreightOS)
-- Database: shipment_manager
-- Phase 1: Initial Database Setup
-- ============================================================================

-- Ensure required PostgreSQL extensions are available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- System Information / Migration Status table (Phase 1 foundational table)
CREATE TABLE IF NOT EXISTS system_metadata (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial version metadata
INSERT INTO system_metadata (key, value)
VALUES 
    ('app_name', 'Danodia FreightOS (Shipment Manager)'),
    ('phase', '1 - Project Initialization'),
    ('schema_version', '1.0.0')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- Phase 2: Users Table (Authentication)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_email_key UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));

-- ============================================================================
-- Phase 5: Shipments Table (Freight Management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    assigned_manager VARCHAR(100) NOT NULL,
    invoice_no VARCHAR(100) NOT NULL,
    fba_id VARCHAR(100),
    container_no VARCHAR(100) NOT NULL,
    number_of_boxes INTEGER NOT NULL CHECK (number_of_boxes >= 0),
    total_weight_kg NUMERIC(12, 2) NOT NULL CHECK (total_weight_kg >= 0),
    volume_cbm NUMERIC(12, 2) NOT NULL CHECK (volume_cbm >= 0),
    pickup_date DATE NOT NULL,
    sailing_date DATE NOT NULL,
    expected_eta DATE NOT NULL,
    actual_arrival DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Booked',
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shipments_invoice_no ON shipments (invoice_no);
CREATE INDEX IF NOT EXISTS idx_shipments_fba_id ON shipments (fba_id);
CREATE INDEX IF NOT EXISTS idx_shipments_region ON shipments (region);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments (status);
CREATE INDEX IF NOT EXISTS idx_shipments_created_by ON shipments (created_by);
CREATE INDEX IF NOT EXISTS idx_shipments_dates ON shipments (pickup_date, sailing_date, expected_eta);

-- Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_users_updated_at') THEN
        CREATE TRIGGER set_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_shipments_updated_at') THEN
        CREATE TRIGGER set_shipments_updated_at
        BEFORE UPDATE ON shipments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

