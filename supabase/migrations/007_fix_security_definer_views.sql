-- =============================================================================
-- TenantX Database Migration: Fix SECURITY DEFINER views
-- Version: 007
-- Description: Recreates views with SECURITY INVOKER to respect RLS policies
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. DROP AND RECREATE VIEWS WITH SECURITY INVOKER
-- -----------------------------------------------------------------------------

-- Note: In PostgreSQL 15+, views use SECURITY INVOKER by default.
-- For compatibility and explicitness, we recreate views with proper settings.

-- Dashboard stats view - respects RLS of querying user
DROP VIEW IF EXISTS dashboard_stats;
CREATE VIEW dashboard_stats
WITH (security_invoker = true)
AS
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

-- Occupancy rate view - respects RLS of querying user
DROP VIEW IF EXISTS occupancy_rates;
CREATE VIEW occupancy_rates
WITH (security_invoker = true)
AS
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

-- Revenue summary view - respects RLS of querying user
DROP VIEW IF EXISTS revenue_summary;
CREATE VIEW revenue_summary
WITH (security_invoker = true)
AS
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
-- 2. GRANT SELECT ON VIEWS TO AUTHENTICATED USERS
-- -----------------------------------------------------------------------------

GRANT SELECT ON dashboard_stats TO authenticated;
GRANT SELECT ON occupancy_rates TO authenticated;
GRANT SELECT ON revenue_summary TO authenticated;
