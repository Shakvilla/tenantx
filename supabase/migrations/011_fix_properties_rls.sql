-- =============================================================================
-- TenantX Database Migration: Fix Properties RLS Policies
-- Version: 011
-- Description: Fixes RLS INSERT policy for properties table with WITH CHECK clause
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CREATE IMPROVED TENANT ID FUNCTION
-- This function combines JWT claims (browser auth) with RPC context (API auth)
-- for maximum compatibility with both frontend and API requests
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID 
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER
SET search_path = public, pg_temp 
AS $$
DECLARE
  jwt_tenant_id TEXT;
  context_tenant_id TEXT;
BEGIN
  -- First try: Get tenant_id from JWT user_metadata (browser auth via Supabase SSR)
  BEGIN
    jwt_tenant_id := (auth.jwt() ->> 'user_metadata')::jsonb ->> 'tenant_id';
  EXCEPTION WHEN OTHERS THEN
    jwt_tenant_id := NULL;
  END;
  
  -- Return JWT tenant_id if available
  IF jwt_tenant_id IS NOT NULL AND jwt_tenant_id != '' THEN
    RETURN jwt_tenant_id::UUID;
  END IF;
  
  -- Fallback: Get tenant_id from RPC context (API auth with set_tenant_context)
  context_tenant_id := current_setting('app.current_tenant_id', TRUE);
  IF context_tenant_id IS NOT NULL AND context_tenant_id != '' THEN
    RETURN context_tenant_id::UUID;
  END IF;
  
  RETURN NULL;
END;
$$;


-- -----------------------------------------------------------------------------
-- 2. FIX PROPERTIES RLS POLICIES
-- The previous policy used FOR ALL with only USING clause
-- INSERT operations require WITH CHECK clause
-- -----------------------------------------------------------------------------

-- Drop the old combined policy
DROP POLICY IF EXISTS "properties_tenant_isolation" ON properties;

-- Create separate policies for better control

-- SELECT policy
CREATE POLICY "properties_select_policy"
  ON properties FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- INSERT policy (requires WITH CHECK)
CREATE POLICY "properties_insert_policy"
  ON properties FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

-- UPDATE policy (requires both USING and WITH CHECK)
CREATE POLICY "properties_update_policy"
  ON properties FOR UPDATE
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- DELETE policy
CREATE POLICY "properties_delete_policy"
  ON properties FOR DELETE
  USING (tenant_id = get_current_tenant_id());


-- -----------------------------------------------------------------------------
-- 3. VERIFY POLICIES
-- -----------------------------------------------------------------------------

-- This will show all policies on properties table after migration
-- Run: SELECT * FROM pg_policies WHERE tablename = 'properties';
