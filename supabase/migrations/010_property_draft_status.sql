-- =============================================================================
-- TenantX Database Migration: Property Draft Status
-- Version: 010
-- Description: Adds 'draft' to properties status for save-as-draft functionality
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. UPDATE PROPERTIES STATUS CONSTRAINT
-- Add 'draft' status for properties that are still being created
-- -----------------------------------------------------------------------------

-- Drop existing constraint
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;

-- Recreate with draft status included
ALTER TABLE properties ADD CONSTRAINT properties_status_check 
  CHECK (status IN ('active', 'inactive', 'maintenance', 'draft'));

-- -----------------------------------------------------------------------------
-- 2. ADD INDEX FOR DRAFT PROPERTIES
-- Useful for finding user's incomplete property listings
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_properties_draft 
  ON properties(tenant_id, status) 
  WHERE status = 'draft';

-- -----------------------------------------------------------------------------
-- 3. COMMENTS
-- -----------------------------------------------------------------------------

COMMENT ON CONSTRAINT properties_status_check ON properties IS 
  'Property status: active (listing visible), inactive (listing hidden), maintenance (under repair), draft (incomplete form)';
