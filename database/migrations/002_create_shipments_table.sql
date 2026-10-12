-- ============================================================================
-- Migration: 002_create_shipments_table.sql
-- Description: Create shipments table with cargo metrics, logistics dates, and foreign key to users
-- Phase: 5 - Complete Shipment CRUD & Database Persistence
-- ============================================================================

-- Create shipments table
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

-- Indexes for high-performance lookups and filters
CREATE INDEX IF NOT EXISTS idx_shipments_invoice_no ON shipments (invoice_no);
CREATE INDEX IF NOT EXISTS idx_shipments_fba_id ON shipments (fba_id);
CREATE INDEX IF NOT EXISTS idx_shipments_region ON shipments (region);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments (status);
CREATE INDEX IF NOT EXISTS idx_shipments_created_by ON shipments (created_by);
CREATE INDEX IF NOT EXISTS idx_shipments_dates ON shipments (pickup_date, sailing_date, expected_eta);

-- Automatic updated_at trigger using existing update_updated_at_column() function
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_shipments_updated_at'
    ) THEN
        CREATE TRIGGER set_shipments_updated_at
        BEFORE UPDATE ON shipments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
