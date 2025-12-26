-- =============================================================================
-- TenantX Database Migration: Agreements and Billing Tables
-- Version: 003
-- Description: Creates agreements, invoices, and payments tables
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. AGREEMENTS TABLE (Lease Agreements / Contracts)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Agreement identification
  agreement_number TEXT NOT NULL,
  
  -- Type and status
  type TEXT NOT NULL DEFAULT 'lease' CHECK (type IN ('lease', 'contract', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'expired', 'pending', 'terminated', 'draft')),
  
  -- Parties
  tenant_record_id UUID NOT NULL REFERENCES tenant_records(id) ON DELETE RESTRICT,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  signed_date DATE,
  expiry_date DATE,
  
  -- Financial terms
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  rent DECIMAL(12, 2) NOT NULL DEFAULT 0,
  security_deposit DECIMAL(12, 2) DEFAULT 0,
  late_fee DECIMAL(10, 2) DEFAULT 0,
  late_fee_type TEXT DEFAULT 'fixed' CHECK (late_fee_type IN ('fixed', 'percentage')),
  grace_period_days INTEGER DEFAULT 5,
  currency TEXT DEFAULT 'GHS',
  
  -- Payment terms
  payment_frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (payment_frequency IN ('monthly', 'quarterly', 'yearly', 'one-time', 'weekly')),
  payment_due_day INTEGER DEFAULT 1, -- Day of month rent is due
  
  -- Terms and conditions
  terms TEXT,
  conditions TEXT,
  special_clauses TEXT,
  
  -- Documents
  document_url TEXT,
  attachments TEXT[],
  
  -- Renewal
  auto_renew BOOLEAN DEFAULT FALSE,
  renewal_terms TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique agreement number per tenant
  CONSTRAINT unique_agreement_number UNIQUE (tenant_id, agreement_number)
);

-- Indexes for agreements
CREATE INDEX IF NOT EXISTS idx_agreements_tenant_id ON agreements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_agreements_tenant_record ON agreements(tenant_record_id);
CREATE INDEX IF NOT EXISTS idx_agreements_property ON agreements(property_id);
CREATE INDEX IF NOT EXISTS idx_agreements_unit ON agreements(unit_id);
CREATE INDEX IF NOT EXISTS idx_agreements_dates ON agreements(tenant_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_agreements_created ON agreements(tenant_id, created_at DESC);

-- Enable RLS
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "agreements_tenant_isolation"
  ON agreements FOR ALL
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "agreements_service_role"
  ON agreements FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_agreements_updated_at
  BEFORE UPDATE ON agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 2. INVOICES TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Invoice identification
  invoice_number TEXT NOT NULL,
  
  -- References
  tenant_record_id UUID NOT NULL REFERENCES tenant_records(id) ON DELETE RESTRICT,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  agreement_id UUID REFERENCES agreements(id) ON DELETE SET NULL,
  
  -- Type and status
  type TEXT NOT NULL DEFAULT 'rent' CHECK (type IN ('rent', 'utility', 'maintenance', 'deposit', 'late_fee', 'other')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled', 'refunded')),
  
  -- Dates
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,
  
  -- Line items (stored as JSONB array)
  items JSONB NOT NULL DEFAULT '[]',
  -- Structure: [{ "id": uuid, "description": string, "quantity": number, "unit_price": number, "amount": number, "tax": number }]
  
  -- Financial summary
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  tax DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(12, 2) DEFAULT 0,
  discount_type TEXT DEFAULT 'fixed' CHECK (discount_type IN ('fixed', 'percentage')),
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(12, 2) DEFAULT 0,
  balance_due DECIMAL(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'GHS',
  
  -- Payment info
  payment_method TEXT CHECK (payment_method IN ('card', 'bank_transfer', 'mobile_money', 'cash', 'check')),
  payment_gateway TEXT CHECK (payment_gateway IN ('redde', 'paystack', 'hubtel', 'manual')),
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  
  -- Reminder tracking
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique invoice number per tenant
  CONSTRAINT unique_invoice_number UNIQUE (tenant_id, invoice_number)
);

-- Indexes for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_record ON invoices(tenant_record_id);
CREATE INDEX IF NOT EXISTS idx_invoices_property ON invoices(property_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(tenant_id, due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(tenant_id, created_at DESC);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "invoices_tenant_isolation"
  ON invoices FOR ALL
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "invoices_service_role"
  ON invoices FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 3. PAYMENTS TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- References
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  tenant_record_id UUID REFERENCES tenant_records(id) ON DELETE SET NULL,
  
  -- Payment details
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'GHS',
  
  -- Method and gateway
  method TEXT NOT NULL CHECK (method IN ('card', 'bank_transfer', 'mobile_money', 'cash', 'check')),
  gateway TEXT CHECK (gateway IN ('redde', 'paystack', 'hubtel', 'manual')),
  
  -- Transaction info
  transaction_id TEXT,
  gateway_reference TEXT,
  gateway_response JSONB,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
  
  -- Dates
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  
  -- Refund info
  refund_amount DECIMAL(12, 2),
  refund_reason TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(tenant_id, created_at DESC);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "payments_tenant_isolation"
  ON payments FOR ALL
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "payments_service_role"
  ON payments FOR ALL
  USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- 4. AUTO-UPDATE INVOICE BALANCE
-- Trigger to update invoice balance when payment is made
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_invoice_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  total_paid numeric;
BEGIN
  IF NEW.status = 'completed' THEN

    SELECT COALESCE(SUM(p.amount), 0)
    INTO total_paid
    FROM public.payments p
    WHERE p.invoice_id = NEW.invoice_id
      AND p.status = 'completed';

    UPDATE public.invoices i
    SET
      amount_paid = total_paid,
      balance_due = i.total - total_paid,
      paid_date = CASE
        WHEN total_paid >= i.total THEN CURRENT_DATE
        ELSE NULL
      END,
      status = CASE
        WHEN total_paid >= i.total THEN 'paid'
        WHEN total_paid > 0 THEN 'partial'
        ELSE i.status
      END
    WHERE i.id = NEW.invoice_id;

  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER update_invoice_on_payment
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_balance();
