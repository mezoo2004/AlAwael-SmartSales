# Deploy generate-design (DEMO MODE)

Safe deployment checklist for AlAwael SmartSales AI design generation.

**Do not** set `DESIGN_GENERATION_MODE=live` yet.  
**Do not** set a real `OPENAI_API_KEY` yet.  
**Do not** run `supabase db reset` against production.

## Prerequisites

- Supabase CLI installed: https://supabase.com/docs/guides/cli
- Access to the Supabase project
- Project ref from Dashboard → Project Settings → General → Reference ID

## Manual commands

Replace `<PROJECT_REF>` with your project reference ID.

```bash
supabase login
supabase link --project-ref <PROJECT_REF>
supabase db push
supabase functions deploy generate-design
supabase secrets set DESIGN_GENERATION_MODE=demo
```

Optional verification (demo only — no OpenAI billing):

```bash
supabase secrets list
```

Confirm `DESIGN_GENERATION_MODE` is `demo` (or unset — server defaults to demo).

## Frontend switch (keep false)

File: `src/services/designGenerationService.ts`

```ts
export const USE_EDGE_FUNCTION_FOR_GENERATION = false;
```

- `false` (default): local demo images — current safe path
- `true`: calls Edge Function `generate-design` (still no browser OpenAI calls)

## After deploy (dashboard checks)

1. Storage → `generated-designs` bucket exists and is **private**
2. Table `generated_designs` has nullable `image_url`, plus `storage_path`, `source`, `model`, `status`, `metadata`
3. Edge Function `generate-design` is deployed
4. Secret `DESIGN_GENERATION_MODE=demo` is set
5. Do **not** add `OPENAI_API_KEY` until Live Mode is intentionally enabled

## Trust model (kiosk)

The showroom kiosk uses the anon key without per-customer Supabase Auth.
Table RLS currently allows broad anon access to projects/designs (existing kiosk policies).

Edge Function protections added:

- Valid UUID `projectId` required
- Project must exist in `projects`
- `resolve-image` requires matching `designId` + `projectId`
- `storage_path` must start with `projects/{projectId}/`

This is not strong multi-tenant ownership. Do not expose the service role key to the frontend.
