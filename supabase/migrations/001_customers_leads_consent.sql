-- Showroom kiosk: customers, lead sessions, consent, and completed sales requests

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  city TEXT,
  preferred_contact_method TEXT CHECK (
    preferred_contact_method IS NULL
    OR preferred_contact_method IN ('whatsapp', 'call', 'sms')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT customers_phone_e164_unique UNIQUE (phone_e164)
);

CREATE INDEX IF NOT EXISTS idx_customers_phone_e164 ON customers (phone_e164);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers (created_at DESC);

-- ---------------------------------------------------------------------------
-- lead_sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'showroom_kiosk',
  status TEXT NOT NULL DEFAULT 'incomplete'
    CHECK (status IN ('incomplete', 'completed', 'abandoned')),
  current_step TEXT NOT NULL DEFAULT 'customer_information_completed',
  selected_department TEXT,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  measurements JSONB,
  selected_design_id TEXT,
  session_payload JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_request_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_sessions_customer_id ON lead_sessions (customer_id);
CREATE INDEX IF NOT EXISTS idx_lead_sessions_session_id ON lead_sessions (session_id);
CREATE INDEX IF NOT EXISTS idx_lead_sessions_status ON lead_sessions (status);
CREATE INDEX IF NOT EXISTS idx_lead_sessions_started_at ON lead_sessions (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_sessions_last_activity ON lead_sessions (last_activity_at DESC);

-- ---------------------------------------------------------------------------
-- consent_records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  lead_session_id UUID REFERENCES lead_sessions (id) ON DELETE SET NULL,
  privacy_accepted BOOLEAN NOT NULL DEFAULT false,
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  marketing_channels TEXT[] NOT NULL DEFAULT '{}',
  consent_text_version TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'showroom_kiosk',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  withdrawn_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_consent_records_customer_id ON consent_records (customer_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_lead_session_id ON consent_records (lead_session_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_recorded_at ON consent_records (recorded_at DESC);

-- ---------------------------------------------------------------------------
-- sales_requests (completed submissions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers (id) ON DELETE RESTRICT,
  lead_session_id UUID REFERENCES lead_sessions (id) ON DELETE SET NULL,
  department_id TEXT NOT NULL,
  contact_snapshot JSONB NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  measurements JSONB,
  uploaded_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_designs JSONB NOT NULL DEFAULT '[]'::jsonb,
  selected_design_id TEXT,
  modification_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'new',
  source TEXT NOT NULL DEFAULT 'showroom_kiosk',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_requests_customer_id ON sales_requests (customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_requests_created_at ON sales_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_requests_status ON sales_requests (status);

ALTER TABLE lead_sessions
  DROP CONSTRAINT IF EXISTS lead_sessions_completed_request_fk;

ALTER TABLE lead_sessions
  ADD CONSTRAINT lead_sessions_completed_request_fk
  FOREIGN KEY (completed_request_id) REFERENCES sales_requests (id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_lead_sessions_updated_at ON lead_sessions;
CREATE TRIGGER trg_lead_sessions_updated_at
  BEFORE UPDATE ON lead_sessions
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_sales_requests_updated_at ON sales_requests;
CREATE TRIGGER trg_sales_requests_updated_at
  BEFORE UPDATE ON sales_requests
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security (anon key used from kiosk frontend)
-- ---------------------------------------------------------------------------
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_requests ENABLE ROW LEVEL SECURITY;

-- Kiosk showroom inserts/updates via anon key (tighten later with Edge Functions if needed)
DROP POLICY IF EXISTS "kiosk_customers_all" ON customers;
CREATE POLICY "kiosk_customers_all" ON customers
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "kiosk_lead_sessions_all" ON lead_sessions;
CREATE POLICY "kiosk_lead_sessions_all" ON lead_sessions
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "kiosk_consent_records_all" ON consent_records;
CREATE POLICY "kiosk_consent_records_all" ON consent_records
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "kiosk_sales_requests_all" ON sales_requests;
CREATE POLICY "kiosk_sales_requests_all" ON sales_requests
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);
