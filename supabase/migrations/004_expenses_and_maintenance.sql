-- =============================================================================
-- TenantX Database Migration: Expenses and Maintenance Tables
-- Version: 004
-- Description: Creates expenses, expense_categories, maintenance, and maintainers
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. EXPENSE CATEGORIES TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Category info
  name TEXT NOT NULL,
  description TEXT,
  color TEXT, -- For UI display
  icon TEXT, -- Icon name
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE, -- System default categories
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique category name per tenant
  CONSTRAINT unique_expense_category UNIQUE (tenant_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expense_categories_tenant ON expense_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_active ON expense_categories(tenant_id, is_active);

-- Enable RLS
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "expense_categories_tenant_isolation"
  ON expense_categories FOR ALL
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "expense_categories_service_role"
  ON expense_categories FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger
CREATE TRIGGER update_expense_categories_updated_at
  BEFORE UPDATE ON expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 2. EXPENSES TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Category
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  category TEXT NOT NULL, -- Store category name for history
  
  -- Details
  description TEXT NOT NULL,
  
  -- Financial
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'GHS',
  
  -- Date
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- References
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  
  -- Vendor info
  vendor TEXT,
  vendor_contact TEXT,
  
  -- Receipt
  receipt_url TEXT,
  receipt_number TEXT,
  
  -- Tags
  tags TEXT[],
  
  -- Approval workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reimbursed')),
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Submitted by
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Recurring expense reference
  recurring_id UUID,
  is_recurring BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(tenant_id, category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_property ON expenses(tenant_id, property_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(tenant_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_created ON expenses(tenant_id, created_at DESC);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "expenses_tenant_isolation"
  ON expenses FOR ALL
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "expenses_service_role"
  ON expenses FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 3. MAINTAINERS TABLE (Service Providers)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS maintainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  
  -- Business info
  company_name TEXT,
  license_number TEXT,
  
  -- Specializations
  specialization TEXT[], -- ['plumbing', 'electrical', 'hvac', 'general']
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- Performance
  rating DECIMAL(3, 2), -- 0.00 to 5.00
  total_jobs INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  
  -- Rates
  hourly_rate DECIMAL(10, 2),
  currency TEXT DEFAULT 'GHS',
  
  -- Address
  address JSONB,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_maintainers_tenant_id ON maintainers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintainers_status ON maintainers(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_maintainers_specialization ON maintainers USING GIN(specialization);

-- Enable RLS
ALTER TABLE maintainers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "maintainers_tenant_isolation"
  ON maintainers FOR ALL
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "maintainers_service_role"
  ON maintainers FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger
CREATE TRIGGER update_maintainers_updated_at
  BEFORE UPDATE ON maintainers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 4. MAINTENANCE REQUESTS TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Request identification
  request_number TEXT NOT NULL,
  
  -- Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Priority and status
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  
  -- Location
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  location_details TEXT, -- Specific location within unit/property
  
  -- Requestor
  tenant_record_id UUID REFERENCES tenant_records(id) ON DELETE SET NULL,
  requested_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Assignment
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  maintainer_id UUID REFERENCES maintainers(id) ON DELETE SET NULL,
  
  -- Scheduling
  scheduled_date TIMESTAMPTZ,
  scheduled_end_date TIMESTAMPTZ,
  
  -- Completion
  completed_date TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Cost
  estimated_cost DECIMAL(12, 2),
  actual_cost DECIMAL(12, 2),
  currency TEXT DEFAULT 'GHS',
  
  -- Media
  images TEXT[],
  attachments TEXT[],
  
  -- Notes
  notes TEXT,
  resolution_notes TEXT,
  
  -- Feedback
  tenant_rating INTEGER CHECK (tenant_rating >= 1 AND tenant_rating <= 5),
  tenant_feedback TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique request number per tenant
  CONSTRAINT unique_request_number UNIQUE (tenant_id, request_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_tenant_id ON maintenance_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_requests(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_maintenance_priority ON maintenance_requests(tenant_id, priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_property ON maintenance_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_unit ON maintenance_requests(unit_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_assignee ON maintenance_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_maintenance_maintainer ON maintenance_requests(maintainer_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_created ON maintenance_requests(tenant_id, created_at DESC);

-- Enable RLS
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "maintenance_requests_tenant_isolation"
  ON maintenance_requests FOR ALL
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "maintenance_requests_service_role"
  ON maintenance_requests FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger
CREATE TRIGGER update_maintenance_requests_updated_at
  BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 5. UPDATE MAINTAINER STATS
-- Trigger to update maintainer job counts
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_maintainer_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_new_maintainer_id uuid;
  v_old_maintainer_id uuid;
BEGIN
  v_new_maintainer_id := NEW.maintainer_id;
  v_old_maintainer_id := OLD.maintainer_id;

  -- Update new maintainer stats
  IF v_new_maintainer_id IS NOT NULL THEN
    UPDATE public.maintainers m
    SET
      total_jobs = s.total_jobs,
      completed_jobs = s.completed_jobs
    FROM (
      SELECT
        COUNT(*) AS total_jobs,
        COUNT(*) FILTER (WHERE r.status = 'completed') AS completed_jobs
      FROM public.maintenance_requests r
      WHERE r.maintainer_id = v_new_maintainer_id
    ) s
    WHERE m.id = v_new_maintainer_id;
  END IF;

  -- Update old maintainer stats if reassigned
  IF v_old_maintainer_id IS NOT NULL
     AND v_old_maintainer_id IS DISTINCT FROM v_new_maintainer_id THEN

    UPDATE public.maintainers m
    SET
      total_jobs = s.total_jobs,
      completed_jobs = s.completed_jobs
    FROM (
      SELECT
        COUNT(*) AS total_jobs,
        COUNT(*) FILTER (WHERE r.status = 'completed') AS completed_jobs
      FROM public.maintenance_requests r
      WHERE r.maintainer_id = v_old_maintainer_id
    ) s
    WHERE m.id = v_old_maintainer_id;
  END IF;

  RETURN NEW;
END;
$$;


CREATE TRIGGER update_maintainer_on_request_change
  AFTER INSERT OR UPDATE ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_maintainer_stats();
