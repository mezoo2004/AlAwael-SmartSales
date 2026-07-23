-- Minimal metadata for AI design generation (STEP 2/3).
-- Idempotent: safe to re-run. Does not delete or rewrite existing design rows.
-- Existing columns remain; new columns are nullable for backward compatibility.

ALTER TABLE generated_designs
  ADD COLUMN IF NOT EXISTS model TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- image_url is legacy / temporary display only.
-- Canonical permanent reference for private Storage designs is storage_path.
-- Demo / legacy rows may still store a permanent public HTTP image_url.
ALTER TABLE generated_designs
  ALTER COLUMN image_url DROP NOT NULL;

COMMENT ON COLUMN generated_designs.model IS 'Image model used, e.g. gpt-image-1 or demo';
COMMENT ON COLUMN generated_designs.source IS 'Generation source, e.g. openai or demo';
COMMENT ON COLUMN generated_designs.status IS 'Generation status, e.g. completed or failed';
COMMENT ON COLUMN generated_designs.storage_path IS 'Canonical private Storage object path in generated-designs bucket';
COMMENT ON COLUMN generated_designs.metadata IS 'Safe generation metadata (no secrets)';
COMMENT ON COLUMN generated_designs.image_url IS 'Legacy or temporary display URL. Prefer storage_path + fresh signed URL for private designs.';

-- Private Storage bucket for generated design images (never remains false).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-designs',
  'generated-designs',
  false,
  15728640,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = COALESCE(storage.buckets.file_size_limit, EXCLUDED.file_size_limit),
  allowed_mime_types = COALESCE(storage.buckets.allowed_mime_types, EXCLUDED.allowed_mime_types);

-- Storage access model:
-- - Bucket is private (public = false).
-- - Edge Functions upload/sign with the service role (bypasses RLS).
-- - Do NOT grant anon/authenticated browse, upload, update, or delete.
-- - Remove any previously created broad SELECT policy if present.
DROP POLICY IF EXISTS "generated_designs_storage_authenticated_select" ON storage.objects;
DROP POLICY IF EXISTS "generated_designs_storage_anon_select" ON storage.objects;
DROP POLICY IF EXISTS "generated_designs_storage_public_select" ON storage.objects;
DROP POLICY IF EXISTS "generated_designs_storage_anon_insert" ON storage.objects;
DROP POLICY IF EXISTS "generated_designs_storage_authenticated_insert" ON storage.objects;
