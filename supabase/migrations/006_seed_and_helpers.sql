-- =============================================================================
-- TenantX Database Migration: Seed Default Data
-- Version: 006
-- Description: Seeds default expense categories and creates helper views
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. FUNCTION TO SEED DEFAULT EXPENSE CATEGORIES FOR NEW TENANTS
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION seed_default_expense_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default expense categories for the new tenant
  INSERT INTO expense_categories (tenant_id, name, description, color, icon, is_default)
  VALUES
    (NEW.id, 'Maintenance', 'Property maintenance and repairs', '#4CAF50', 'ri-tools-line', TRUE),
    (NEW.id, 'Utilities', 'Electricity, water, gas, etc.', '#2196F3', 'ri-flashlight-line', TRUE),
    (NEW.id, 'Insurance', 'Property and liability insurance', '#9C27B0', 'ri-shield-check-line', TRUE),
    (NEW.id, 'Taxes', 'Property taxes and levies', '#F44336', 'ri-government-line', TRUE),
    (NEW.id, 'Legal', 'Legal fees and services', '#607D8B', 'ri-scales-line', TRUE),
    (NEW.id, 'Management', 'Property management fees', '#FF9800', 'ri-user-settings-line', TRUE),
    (NEW.id, 'Cleaning', 'Cleaning and janitorial services', '#00BCD4', 'ri-brush-line', TRUE),
    (NEW.id, 'Landscaping', 'Lawn care and landscaping', '#8BC34A', 'ri-plant-line', TRUE),
    (NEW.id, 'Security', 'Security services and equipment', '#795548', 'ri-shield-user-line', TRUE),
    (NEW.id, 'Supplies', 'Office and property supplies', '#FF5722', 'ri-archive-line', TRUE),
    (NEW.id, 'Marketing', 'Advertising and marketing', '#E91E63', 'ri-megaphone-line', TRUE),
    (NEW.id, 'Other', 'Miscellaneous expenses', '#9E9E9E', 'ri-more-line', TRUE);
  
  -- Create default settings for the new tenant
  INSERT INTO settings (tenant_id, company, payment, notification, invoice, preferences)
  VALUES (
    NEW.id,
    '{}'::JSONB,
    '{"currency": "GHS", "taxRate": 0, "methods": ["mobile_money", "bank_transfer", "cash"]}'::JSONB,
    '{"emailEnabled": true, "smsEnabled": false}'::JSONB,
    '{"prefix": "INV", "nextNumber": 1, "dueDays": 30}'::JSONB,
    '{"timezone": "Africa/Accra", "dateFormat": "DD/MM/YYYY", "currency": "GHS", "language": "en"}'::JSONB
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to seed data when new tenant is created
CREATE TRIGGER seed_tenant_defaults
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION seed_default_expense_categories();

-- -----------------------------------------------------------------------------
-- 2. HELPER VIEWS
-- -----------------------------------------------------------------------------

-- Dashboard stats view
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  t.id AS tenant_id,
  (SELECT COUNT(*) FROM properties WHERE tenant_id = t.id) AS total_properties,
  (SELECT COUNT(*) FROM units WHERE tenant_id = t.id) AS total_units,
  (SELECT COUNT(*) FROM units WHERE tenant_id = t.id AND status = 'occupied') AS occupied_units,
  (SELECT COUNT(*) FROM units WHERE tenant_id = t.id AND status = 'available') AS available_units,
  (SELECT COUNT(*) FROM tenant_records WHERE tenant_id = t.id AND status = 'active') AS active_tenants,
  (SELECT COUNT(*) FROM agreements WHERE tenant_id = t.id AND status = 'active') AS active_agreements,
  (SELECT COUNT(*) FROM invoices WHERE tenant_id = t.id AND status = 'overdue') AS overdue_invoices,
  (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE tenant_id = t.id AND status = 'paid' AND paid_date >= date_trunc('month', CURRENT_DATE)) AS revenue_this_month,
  (SELECT COALESCE(SUM(balance_due), 0) FROM invoices WHERE tenant_id = t.id AND status IN ('sent', 'overdue', 'partial')) AS total_outstanding,
  (SELECT COUNT(*) FROM maintenance_requests WHERE tenant_id = t.id AND status IN ('pending', 'in_progress')) AS pending_maintenance
FROM tenants t;

-- Occupancy rate view
CREATE OR REPLACE VIEW occupancy_rates AS
SELECT
  p.tenant_id,
  p.id AS property_id,
  p.name AS property_name,
  p.total_units,
  p.occupied_units,
  CASE 
    WHEN p.total_units > 0 THEN ROUND((p.occupied_units::DECIMAL / p.total_units) * 100, 2)
    ELSE 0
  END AS occupancy_rate
FROM properties p;

-- Revenue summary view
CREATE OR REPLACE VIEW revenue_summary AS
SELECT
  i.tenant_id,
  date_trunc('month', i.issue_date)::DATE AS month,
  i.type,
  COUNT(*) AS invoice_count,
  SUM(i.total) AS total_billed,
  SUM(i.amount_paid) AS total_collected,
  SUM(i.balance_due) AS total_outstanding
FROM invoices i
WHERE i.status != 'cancelled'
GROUP BY i.tenant_id, date_trunc('month', i.issue_date), i.type
ORDER BY month DESC;

-- -----------------------------------------------------------------------------
-- 3. SEQUENCE GENERATORS FOR HUMAN-READABLE IDs
-- -----------------------------------------------------------------------------

-- Agreement number generator
CREATE OR REPLACE FUNCTION generate_agreement_number(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  prefix TEXT := 'AGR';
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(agreement_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM agreements
  WHERE tenant_id = p_tenant_id;
  
  RETURN prefix || '-' || LPAD(next_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Invoice number generator
CREATE OR REPLACE FUNCTION generate_invoice_number(p_tenant_id UUID)
RETURNS TEXT 
LANGUAGE plpgsql
-- Fixes the lint issue and ensures the function only looks in the public schema
SET search_path = public, pg_temp
AS $$
DECLARE
  next_num INTEGER;
  prefix TEXT;
BEGIN
  -- 1. Get prefix from settings, default to 'INV'
  -- This ensures the invoice number matches the landlord's preferences
  SELECT invoice->>'prefix' INTO prefix 
  FROM settings 
  WHERE tenant_id = p_tenant_id;
  
  prefix := COALESCE(prefix, 'INV');
  
  -- 2. Calculate the next number
  -- It strips the prefix and increments the highest existing number
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM LENGTH(prefix) + 2) AS INTEGER)), 0) + 1
  INTO next_num
  FROM invoices
  WHERE tenant_id = p_tenant_id;
  
  RETURN prefix || '-' || LPAD(next_num::TEXT, 5, '0');
END;
$$;

-- Maintenance request number generator
CREATE OR REPLACE FUNCTION generate_maintenance_number(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  prefix TEXT := 'MNT';
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM maintenance_requests
  WHERE tenant_id = p_tenant_id;
  
  RETURN prefix || '-' || LPAD(next_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 4. GRANT EXECUTE ON FUNCTIONS
-- -----------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION set_tenant_context(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_tenant_context() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_agreement_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invoice_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_maintenance_number(UUID) TO authenticated;
