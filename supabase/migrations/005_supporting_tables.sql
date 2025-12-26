-- =============================================================================
-- TenantX Database Migration: Supporting Tables
-- Version: 005
-- Description: Creates documents, communications, subscriptions, and settings
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. DOCUMENTS TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Document info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Type and category
  type TEXT NOT NULL DEFAULT 'other' CHECK (type IN ('agreement', 'invoice', 'receipt', 'id', 'lease', 'contract', 'report', 'other')),
  category TEXT,
  
  -- File info
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER, -- bytes
  mime_type TEXT,
  
  -- Relations
  related_to JSONB,
  -- Structure: { "type": "tenant" | "property" | "agreement" | "invoice", "id": uuid }
  
  -- Ownership
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Review workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Tags
  tags TEXT[],
  
  -- Expiry
  expiry_date DATE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(tenant_id, created_at DESC);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "documents_tenant_isolation"
  ON documents FOR ALL
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "documents_service_role"
  ON documents FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 2. COMMUNICATIONS TABLE (Messages, Notices, Announcements)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Type
  type TEXT NOT NULL DEFAULT 'message' CHECK (type IN ('message', 'notice', 'announcement', 'reminder', 'alert')),
  
  -- Content
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  content_html TEXT, -- Rich text version
  
  -- Sender
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  from_name TEXT,
  from_email TEXT,
  
  -- Recipients
  to_type TEXT NOT NULL CHECK (to_type IN ('tenant', 'property', 'all', 'group', 'user')),
  to_ids UUID[], -- List of recipient IDs
  
  -- Thread (for conversations)
  thread_id UUID REFERENCES communications(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES communications(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'delivered', 'read', 'archived')),
  
  -- Timestamps
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  -- Priority
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Attachments
  attachments TEXT[],
  
  -- Channels
  channel TEXT DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'sms', 'push', 'all')),
  email_sent BOOLEAN DEFAULT FALSE,
  sms_sent BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_communications_tenant_id ON communications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_communications_type ON communications(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_communications_status ON communications(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_communications_from ON communications(from_user_id);
CREATE INDEX IF NOT EXISTS idx_communications_thread ON communications(thread_id);
CREATE INDEX IF NOT EXISTS idx_communications_created ON communications(tenant_id, created_at DESC);

-- Enable RLS
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "communications_tenant_isolation"
  ON communications FOR ALL
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "communications_service_role"
  ON communications FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger
CREATE TRIGGER update_communications_updated_at
  BEFORE UPDATE ON communications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 3. SUBSCRIPTION PLANS TABLE (Platform-level, not tenant-scoped)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Plan info
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Tier
  tier TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'pro', 'enterprise')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  is_popular BOOLEAN DEFAULT FALSE,
  
  -- Pricing (store as cents/pesewas for precision)
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_quarterly INTEGER,
  price_yearly INTEGER,
  currency TEXT DEFAULT 'GHS',
  
  -- Trial
  trial_period_days INTEGER DEFAULT 0,
  
  -- Limits
  limits JSONB NOT NULL DEFAULT '{}'::JSONB,
  -- Structure: { "maxProperties": number, "maxTenants": number, "maxUnits": number, "maxDocuments": number, "maxUsers": number }
  -- Use -1 for unlimited
  
  -- Features
  features TEXT[],
  
  -- Display order
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Note: subscription_plans is NOT tenant-scoped, it's platform-wide
-- No RLS needed, but restrict to service_role for writes

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_plans_read_all"
  ON subscription_plans FOR SELECT
  USING (status = 'active');

CREATE POLICY "subscription_plans_service_role"
  ON subscription_plans FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 4. SUBSCRIPTIONS TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Plan
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  
  -- User who subscribed
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'trial', 'past_due', 'suspended')),
  
  -- Billing cycle
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
  
  -- Dates
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  trial_end_date TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Financial
  amount INTEGER NOT NULL, -- Amount in smallest currency unit
  currency TEXT DEFAULT 'GHS',
  
  -- Auto-renewal
  auto_renew BOOLEAN DEFAULT TRUE,
  
  -- Payment info
  payment_method_id TEXT, -- Reference to stored payment method
  last_payment_id UUID REFERENCES payments(id),
  next_billing_date TIMESTAMPTZ,
  
  -- Cancellation
  cancellation_reason TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "subscriptions_tenant_isolation"
  ON subscriptions FOR ALL
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "subscriptions_service_role"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update tenant's subscription_id when subscription changes
CREATE OR REPLACE FUNCTION public.update_tenant_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE public.tenants t
    SET subscription_id = NEW.id
    WHERE t.id = NEW.tenant_id;
  END IF;

  RETURN NEW;
END;
$$;


CREATE TRIGGER set_tenant_subscription
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_subscription();

-- -----------------------------------------------------------------------------
-- 5. SETTINGS TABLE
-- Stores tenant-specific settings as JSONB
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  
  -- Company settings
  company JSONB DEFAULT '{}'::JSONB,
  -- Structure: { "name", "address", "phone", "email", "website", "logo", "taxId", "registrationNumber" }
  
  -- Payment settings
  payment JSONB DEFAULT '{}'::JSONB,
  -- Structure: { "gateways": { "redde": {...}, "paystack": {...} }, "methods": [], "currency", "taxRate" }
  
  -- Notification settings
  notification JSONB DEFAULT '{}'::JSONB,
  -- Structure: { "smtp": {...}, "sms": {...}, "emailTemplates": {...}, "preferences": {...} }
  
  -- Invoice settings
  invoice JSONB DEFAULT '{}'::JSONB,
  -- Structure: { "prefix", "nextNumber", "dueDays", "lateFee", "autoGenerate", "sendReminders" }
  
  -- Recurring invoice settings
  recurring_invoice JSONB DEFAULT '{}'::JSONB,
  
  -- General preferences
  preferences JSONB DEFAULT '{}'::JSONB,
  -- Structure: { "timezone", "dateFormat", "currency", "language" }
  
  -- Feature flags
  features JSONB DEFAULT '{}'::JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_settings_tenant_id ON settings(tenant_id);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "settings_tenant_isolation"
  ON settings FOR ALL
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "settings_service_role"
  ON settings FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 6. INSERT DEFAULT SUBSCRIPTION PLANS
-- -----------------------------------------------------------------------------

INSERT INTO subscription_plans (name, description, tier, price_monthly, price_yearly, limits, features, display_order, is_popular)
VALUES
  (
    'Free',
    'Get started with basic property management',
    'free',
    0,
    0,
    '{"maxProperties": 1, "maxTenants": 5, "maxUnits": 5, "maxDocuments": 50, "maxUsers": 1}'::JSONB,
    ARRAY['1 Property', '5 Units', '5 Tenants', 'Basic Reports', 'Email Support'],
    1,
    FALSE
  ),
  (
    'Basic',
    'Perfect for small landlords',
    'basic',
    5000, -- 50 GHS
    50000, -- 500 GHS (2 months free)
    '{"maxProperties": 5, "maxTenants": 25, "maxUnits": 25, "maxDocuments": 200, "maxUsers": 3}'::JSONB,
    ARRAY['5 Properties', '25 Units', '25 Tenants', 'Invoice Management', 'Payment Tracking', 'Standard Reports', 'Email Support'],
    2,
    FALSE
  ),
  (
    'Pro',
    'For growing property managers',
    'pro',
    15000, -- 150 GHS
    150000, -- 1500 GHS (2 months free)
    '{"maxProperties": 20, "maxTenants": 100, "maxUnits": 100, "maxDocuments": 1000, "maxUsers": 10}'::JSONB,
    ARRAY['20 Properties', '100 Units', '100 Tenants', 'Payment Gateway Integration', 'Maintenance Management', 'Advanced Reports', 'Priority Support', 'API Access'],
    3,
    TRUE
  ),
  (
    'Enterprise',
    'For large property management companies',
    'enterprise',
    50000, -- 500 GHS
    500000, -- 5000 GHS (2 months free)
    '{"maxProperties": -1, "maxTenants": -1, "maxUnits": -1, "maxDocuments": -1, "maxUsers": -1}'::JSONB,
    ARRAY['Unlimited Properties', 'Unlimited Units', 'Unlimited Tenants', 'White-label Option', 'Custom Integrations', 'Dedicated Support', 'SLA Guarantee', 'Training'],
    4,
    FALSE
  )
ON CONFLICT (name) DO NOTHING;
