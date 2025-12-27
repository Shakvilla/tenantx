-- =============================================================================
-- TenantX Database Migration: Property Additional Fields
-- Version: 009
-- Description: Adds fields from frontend forms to properties table
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ADD MISSING COLUMNS TO PROPERTIES TABLE
-- -----------------------------------------------------------------------------

-- Location fields (Ghana-specific)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS gps_code TEXT;

-- Property condition
ALTER TABLE properties ADD COLUMN IF NOT EXISTS condition TEXT 
  CHECK (condition IN ('new', 'good', 'fair', 'poor'));

-- Property-level features (for properties without units, like houses)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bedrooms INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bathrooms DECIMAL(3, 1);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rooms INTEGER;

-- Media
ALTER TABLE properties ADD COLUMN IF NOT EXISTS thumbnail_index INTEGER;

-- -----------------------------------------------------------------------------
-- 2. ADD INDEXES FOR NEW COLUMNS
-- -----------------------------------------------------------------------------

-- Composite indexes for common queries (tenant_id first for RLS performance)
CREATE INDEX IF NOT EXISTS idx_properties_region ON properties(tenant_id, region);
CREATE INDEX IF NOT EXISTS idx_properties_district ON properties(tenant_id, district);
CREATE INDEX IF NOT EXISTS idx_properties_condition ON properties(tenant_id, condition);

-- -----------------------------------------------------------------------------
-- 3. UPDATE PROPERTY TYPE CHECK CONSTRAINT
-- Add 'house' and 'apartment' types used in frontend
-- -----------------------------------------------------------------------------

-- Drop existing constraint and recreate with new values
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_type_check;
ALTER TABLE properties ADD CONSTRAINT properties_type_check 
  CHECK (type IN ('residential', 'commercial', 'mixed', 'house', 'apartment'));

-- -----------------------------------------------------------------------------
-- 4. COMMENTS
-- -----------------------------------------------------------------------------

COMMENT ON COLUMN properties.region IS 'Ghana region (Greater Accra, Ashanti, etc.)';
COMMENT ON COLUMN properties.district IS 'District within the region';
COMMENT ON COLUMN properties.gps_code IS 'Ghana GPS digital address code';
COMMENT ON COLUMN properties.condition IS 'Property condition: new, good, fair, poor';
COMMENT ON COLUMN properties.bedrooms IS 'Number of bedrooms (for single-unit properties)';
COMMENT ON COLUMN properties.bathrooms IS 'Number of bathrooms (for single-unit properties)';
COMMENT ON COLUMN properties.rooms IS 'Total number of rooms';
COMMENT ON COLUMN properties.thumbnail_index IS 'Index of the thumbnail image in images array';
