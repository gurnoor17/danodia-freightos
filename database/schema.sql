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

-- Note: Complete tables for Users, Authentication (Phase 2),
-- Shipments, Cargo Metrics, and Tracking (Phase 3+) will be added in subsequent phases.
