-- =============================================================================
-- TenantX Database Migration: Core Functions & Platform Tables
-- Version: 001
-- Description: Creates tenant context functions and core platform tables
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TENANT CONTEXT FUNCTIONS
-- These functions manage the application-level tenant context for RLS policies
-- -----------------------------------------------------------------------------

-- Function to set the current tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  PERFORM pg_catalog.set_config(
    'app.current_tenant_id',
    p_tenant_id::text,
    true
  );
END;
$$;


-- Function to clear the tenant context
CREATE OR REPLACE FUNCTION clear_tenant_context()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  PERFORM pg_catalog.set_config(
    'app.current_tenant_id',
    '',
    true
  );
END;
$$;


-- Function to get the current tenant ID (for RLS policies)
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID 
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER
-- This line fixes the linting error and secures the function
SET search_path = public, pg_temp 
AS $$
DECLARE
  tenant_id TEXT;
BEGIN
  tenant_id := current_setting('app.current_tenant_id', TRUE);
  IF tenant_id IS NULL OR tenant_id = '' THEN
    RETURN NULL;
  END IF;
  RETURN tenant_id::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2. TENANTS TABLE (Platform Tenants / Organizations)
-- This represents the SaaS tenant (organization), NOT property tenants
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  slug TEXT UNIQUE,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
  subscription_id UUID,
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for tenants table
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON tenants(created_at DESC);

-- Enable RLS on tenants (special case - platform-level)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see tenants they belong to
CREATE POLICY "Users can view their own tenants"
  ON tenants FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Only super admins can insert tenants (handled at application level)
CREATE POLICY "Service role can manage tenants"
  ON tenants FOR ALL
  USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- 3. USERS TABLE (Platform Users)
-- Linked to Supabase auth.users
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('viewer', 'user', 'manager', 'admin', 'super_admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
  avatar_url TEXT,
  metadata JSONB DEFAULT '{}',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_tenant_created ON users(tenant_id, created_at DESC);

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see other users in their tenant
CREATE POLICY "Users can view users in their tenant"
  ON users FOR SELECT
  USING (tenant_id = get_current_tenant_id() OR id = auth.uid());

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy: Admins can manage users in their tenant
CREATE POLICY "Admins can manage tenant users"
  ON users FOR ALL
  USING (
    tenant_id = get_current_tenant_id() 
    AND is_admin()
  );

-- Policy: Service role can manage users
CREATE POLICY "Service role can manage users"
  ON users FOR ALL
  USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- DEBUG FUNCTIONS
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_auth_context()
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'auth_uid', coalesce(auth.uid()::text, 'null'),
    'tenant_id', coalesce(current_setting('app.current_tenant_id', TRUE), 'null'),
    'auth_role', coalesce(auth.role()::text, 'null')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 4. UPDATED_AT TRIGGER FUNCTION
-- Automatically updates the updated_at column
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- Apply trigger to tenants
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 5. HELPER FUNCTION: Check if user is admin
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
