-- ============================================================================
-- Migration: 003_create_watchlist_table.sql
-- Description: Create watchlist table for user-saved shipments with cascading delete
-- Phase: 6 - Export, Watchlist and Analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS watchlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_watchlist_user_shipment UNIQUE (user_id, shipment_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist (user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_shipment_id ON watchlist (shipment_id);
