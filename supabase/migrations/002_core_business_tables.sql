-- =============================================================================
-- TenantX Database Migration: Core Business Tables
-- Version: 002
-- Description: Creates tenant_records, properties, and units tables
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TENANT_RECORDS TABLE (Property Tenants - the people renting)
-- These are the tenants of properties, NOT platform tenants
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tenant_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Personal information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  avatar TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  
  -- Property assignment
  property_id UUID,
  unit_id UUID,
  unit_no TEXT,
  
  -- Dates
  move_in_date TIMESTAMPTZ,
  move_out_date TIMESTAMPTZ,
  
  -- Emergency contact
  emergency_contact JSONB,
  -- Structure: { "name": string, "phone": string, "relationship": string }
  
  -- Metadata
  notes TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique email per tenant
  CONSTRAINT unique_tenant_email UNIQUE (tenant_id, email)
);

-- Indexes for tenant_records
CREATE INDEX IF NOT EXISTS idx_tenant_records_tenant_id ON tenant_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_records_email ON tenant_records(email);
CREATE INDEX IF NOT EXISTS idx_tenant_records_status ON tenant_records(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tenant_records_property ON tenant_records(tenant_id, property_id);
CREATE INDEX IF NOT EXISTS idx_tenant_records_unit ON tenant_records(tenant_id, unit_id);
CREATE INDEX IF NOT EXISTS idx_tenant_records_created ON tenant_records(tenant_id, created_at DESC);

-- Enable RLS
ALTER TABLE tenant_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant_records
CREATE POLICY "tenant_records_tenant_isolation"
  ON tenant_records FOR ALL
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "tenant_records_service_role"
  ON tenant_records FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_tenant_records_updated_at
  BEFORE UPDATE ON tenant_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 2. PROPERTIES TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Address (stored as JSONB for flexibility)
  address JSONB NOT NULL,
  -- Structure: { "street": string, "city": string, "state": string, "zip": string, "country": string }
  
  -- Property details
  type TEXT NOT NULL DEFAULT 'residential' CHECK (type IN ('residential', 'commercial', 'mixed')),
  ownership TEXT NOT NULL DEFAULT 'own' CHECK (ownership IN ('own', 'lease')),
  
  -- Unit counts
  total_units INTEGER NOT NULL DEFAULT 0,
  occupied_units INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  
  -- Media
  images TEXT[],
  documents JSONB DEFAULT '[]',
  
  -- Financial
  purchase_price DECIMAL(12, 2),
  current_value DECIMAL(12, 2),
  currency TEXT DEFAULT 'GHS',
  
  -- Metadata
  amenities TEXT[],
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for properties
CREATE INDEX IF NOT EXISTS idx_properties_tenant_id ON properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_properties_created ON properties(tenant_id, created_at DESC);

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for properties
CREATE POLICY "properties_tenant_isolation"
  ON properties FOR ALL
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "properties_service_role"
  ON properties FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 3. UNITS TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Unit details
  unit_no TEXT NOT NULL,
  floor INTEGER,
  type TEXT NOT NULL DEFAULT '1br' CHECK (type IN ('studio', '1br', '2br', '3br', '4br+', 'commercial', 'office', 'retail')),
  
  -- Size
  size_sqft DECIMAL(10, 2),
  bedrooms INTEGER,
  bathrooms DECIMAL(3, 1),
  
  -- Financial
  rent DECIMAL(10, 2) NOT NULL DEFAULT 0,
  deposit DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'GHS',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved')),
  
  -- Current tenant
  tenant_record_id UUID REFERENCES tenant_records(id) ON DELETE SET NULL,
  
  -- Features
  amenities TEXT[],
  features JSONB DEFAULT '{}',
  
  -- Media
  images TEXT[],
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique unit number per property
  CONSTRAINT unique_unit_per_property UNIQUE (property_id, unit_no)
);

-- Indexes for units
CREATE INDEX IF NOT EXISTS idx_units_tenant_id ON units(tenant_id);
CREATE INDEX IF NOT EXISTS idx_units_property_id ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_units_tenant_record ON units(tenant_record_id);
CREATE INDEX IF NOT EXISTS idx_units_created ON units(tenant_id, created_at DESC);

-- Enable RLS
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- RLS Policies for units
CREATE POLICY "units_tenant_isolation"
  ON units FOR ALL
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "units_service_role"
  ON units FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 4. Add foreign key constraints back to tenant_records
-- -----------------------------------------------------------------------------

ALTER TABLE tenant_records 
  ADD CONSTRAINT fk_tenant_records_property 
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL;

ALTER TABLE tenant_records 
  ADD CONSTRAINT fk_tenant_records_unit 
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 5. AUTO-UPDATE PROPERTY UNIT COUNTS
-- Trigger to auto-update total_units and occupied_units on properties
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_property_unit_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_property_id uuid;
  v_total_units integer;
  v_occupied_units integer;
BEGIN
  v_property_id := COALESCE(NEW.property_id, OLD.property_id);

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE u.status = 'occupied')
  INTO
    v_total_units,
    v_occupied_units
  FROM public.units u
  WHERE u.property_id = v_property_id;

  UPDATE public.properties p
  SET
    total_units = v_total_units,
    occupied_units = v_occupied_units
  WHERE p.id = v_property_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;


CREATE TRIGGER update_property_counts_on_unit_change
  AFTER INSERT OR UPDATE OR DELETE ON units
  FOR EACH ROW
  EXECUTE FUNCTION update_property_unit_counts();
