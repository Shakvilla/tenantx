-- =============================================================================
-- TenantX Database Migration: Tenant History
-- Version: 008
-- Description: Creates tenant_history table to track tenant events
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TENANT_HISTORY TABLE
-- Tracks events for property tenants (renters): moves, status changes, etc.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tenant_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy: platform tenant (landlord org)
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- The property tenant (renter) this history entry belongs to
  tenant_record_id UUID NOT NULL REFERENCES tenant_records(id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'move_in',
    'move_out',
    'status_change',
    'property_change',
    'unit_change',
    'payment',
    'agreement_signed',
    'agreement_renewed',
    'agreement_terminated',
    'note_added',
    'document_uploaded',
    'other'
  )),
  
  event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Optional references
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  agreement_id UUID REFERENCES agreements(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  
  -- Event data (flexible JSON for different event types)
  details JSONB NOT NULL DEFAULT '{}',
  -- Examples:
  -- move_in: { "unit_no": "4B", "move_date": "2024-01-15" }
  -- status_change: { "from": "pending", "to": "active", "reason": "Approved" }
  -- payment: { "amount": 1500, "invoice_number": "INV-001" }
  
  -- Who triggered this event
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- INDEXES
-- Composite indexes for common query patterns (tenant_id first for RLS)
-- -----------------------------------------------------------------------------

-- Primary lookup: Get history for a specific tenant record
CREATE INDEX IF NOT EXISTS idx_tenant_history_record 
  ON tenant_history(tenant_id, tenant_record_id, event_date DESC);

-- Filter by event type within a tenant
CREATE INDEX IF NOT EXISTS idx_tenant_history_type 
  ON tenant_history(tenant_id, event_type, event_date DESC);

-- Time-based queries for reporting
CREATE INDEX IF NOT EXISTS idx_tenant_history_date 
  ON tenant_history(tenant_id, event_date DESC);

-- Property-based history lookup
CREATE INDEX IF NOT EXISTS idx_tenant_history_property 
  ON tenant_history(tenant_id, property_id, event_date DESC)
  WHERE property_id IS NOT NULL;

-- Unit-based history lookup
CREATE INDEX IF NOT EXISTS idx_tenant_history_unit 
  ON tenant_history(tenant_id, unit_id, event_date DESC)
  WHERE unit_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Using same pattern as other tables - simple, performant policy
-- -----------------------------------------------------------------------------

ALTER TABLE tenant_history ENABLE ROW LEVEL SECURITY;

-- Policy: Tenant isolation via get_current_tenant_id()
-- This uses the tenant context set by the application
CREATE POLICY "tenant_history_tenant_isolation"
  ON tenant_history FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- Policy: Service role bypass (for admin operations)
CREATE POLICY "tenant_history_service_role"
  ON tenant_history FOR ALL
  USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- GRANT PERMISSIONS
-- -----------------------------------------------------------------------------

GRANT SELECT, INSERT ON tenant_history TO authenticated;
GRANT ALL ON tenant_history TO service_role;

-- -----------------------------------------------------------------------------
-- COMMENTS
-- -----------------------------------------------------------------------------

COMMENT ON TABLE tenant_history IS 'Tracks history events for property tenants (renters)';
COMMENT ON COLUMN tenant_history.tenant_id IS 'Platform tenant (landlord organization) for multi-tenancy';
COMMENT ON COLUMN tenant_history.tenant_record_id IS 'The property tenant (renter) this entry belongs to';
COMMENT ON COLUMN tenant_history.event_type IS 'Type of event: move_in, move_out, status_change, etc.';
COMMENT ON COLUMN tenant_history.details IS 'Flexible JSON data specific to the event type';
