-- Allow the showroom kiosk frontend to persist project data with the publishable anon key.
-- The kiosk does not sign customers into Supabase, so requests run as the anon role.

GRANT SELECT, INSERT, UPDATE ON customers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON projects TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON project_answers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON generated_designs TO anon, authenticated;

DROP POLICY IF EXISTS "kiosk_customers_all" ON customers;
CREATE POLICY "kiosk_customers_all" ON customers
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "kiosk_projects_all" ON projects;
CREATE POLICY "kiosk_projects_all" ON projects
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "kiosk_project_answers_all" ON project_answers;
CREATE POLICY "kiosk_project_answers_all" ON project_answers
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "kiosk_generated_designs_all" ON generated_designs;
CREATE POLICY "kiosk_generated_designs_all" ON generated_designs
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);
