-- Production showroom project schema
-- Adds normalized projects, answers, and generated design records.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- customers compatibility extension
-- ---------------------------------------------------------------------------
-- Existing lead persistence uses customers.phone_e164. Add the requested
-- customers.phone column while keeping both values synchronized.
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS phone TEXT;

UPDATE customers
SET phone = phone_e164
WHERE phone IS NULL
  AND phone_e164 IS NOT NULL;

CREATE OR REPLACE FUNCTION sync_customer_phone_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.phone IS NULL AND NEW.phone_e164 IS NOT NULL THEN
    NEW.phone := NEW.phone_e164;
  END IF;

  IF NEW.phone_e164 IS NULL AND NEW.phone IS NOT NULL THEN
    NEW.phone_e164 := NEW.phone;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customers_sync_phone_columns ON customers;
CREATE TRIGGER trg_customers_sync_phone_columns
  BEFORE INSERT OR UPDATE ON customers
  FOR EACH ROW EXECUTE PROCEDURE sync_customer_phone_columns();

ALTER TABLE customers
  ALTER COLUMN phone SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone);

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  budget_range TEXT,
  priority TEXT,
  dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'in_progress', 'generated', 'selected', 'submitted', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON projects (customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_department ON projects (department);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects (created_at DESC);

-- ---------------------------------------------------------------------------
-- project_answers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer JSONB NOT NULL DEFAULT 'null'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_project_answers_project_id ON project_answers (project_id);
CREATE INDEX IF NOT EXISTS idx_project_answers_question ON project_answers (question);
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_answers_project_question_unique
  ON project_answers (project_id, question);

-- ---------------------------------------------------------------------------
-- generated_designs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS generated_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  prompt TEXT,
  selected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generated_designs_project_id ON generated_designs (project_id);
CREATE INDEX IF NOT EXISTS idx_generated_designs_created_at ON generated_designs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_designs_selected ON generated_designs (selected);
CREATE UNIQUE INDEX IF NOT EXISTS idx_generated_designs_one_selected_per_project
  ON generated_designs (project_id)
  WHERE selected = true;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_designs ENABLE ROW LEVEL SECURITY;

-- Authenticated customer access
DROP POLICY IF EXISTS "authenticated_customers_select" ON customers;
CREATE POLICY "authenticated_customers_select" ON customers
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated_customers_insert" ON customers;
CREATE POLICY "authenticated_customers_insert" ON customers
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_customers_update" ON customers;
CREATE POLICY "authenticated_customers_update" ON customers
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_customers_delete" ON customers;
CREATE POLICY "authenticated_customers_delete" ON customers
  FOR DELETE TO authenticated
  USING (true);

-- Authenticated project access
DROP POLICY IF EXISTS "authenticated_projects_select" ON projects;
CREATE POLICY "authenticated_projects_select" ON projects
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated_projects_insert" ON projects;
CREATE POLICY "authenticated_projects_insert" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_projects_update" ON projects;
CREATE POLICY "authenticated_projects_update" ON projects
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_projects_delete" ON projects;
CREATE POLICY "authenticated_projects_delete" ON projects
  FOR DELETE TO authenticated
  USING (true);

-- Authenticated project answer access
DROP POLICY IF EXISTS "authenticated_project_answers_select" ON project_answers;
CREATE POLICY "authenticated_project_answers_select" ON project_answers
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated_project_answers_insert" ON project_answers;
CREATE POLICY "authenticated_project_answers_insert" ON project_answers
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_project_answers_update" ON project_answers;
CREATE POLICY "authenticated_project_answers_update" ON project_answers
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_project_answers_delete" ON project_answers;
CREATE POLICY "authenticated_project_answers_delete" ON project_answers
  FOR DELETE TO authenticated
  USING (true);

-- Authenticated generated design access
DROP POLICY IF EXISTS "authenticated_generated_designs_select" ON generated_designs;
CREATE POLICY "authenticated_generated_designs_select" ON generated_designs
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated_generated_designs_insert" ON generated_designs;
CREATE POLICY "authenticated_generated_designs_insert" ON generated_designs
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_generated_designs_update" ON generated_designs;
CREATE POLICY "authenticated_generated_designs_update" ON generated_designs
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_generated_designs_delete" ON generated_designs;
CREATE POLICY "authenticated_generated_designs_delete" ON generated_designs
  FOR DELETE TO authenticated
  USING (true);
