/**
 * generate-design — Supabase Edge Function
 *
 * Modes (server-side only via DESIGN_GENERATION_MODE secret):
 * - demo (default if missing/invalid): curated demo images, NO OpenAI call
 * - live: OpenAI gpt-image-1 → Storage → generated_designs (storage_path canonical)
 *
 * Actions:
 * - generate (default): create designs
 * - resolve-image: mint a fresh signed URL from storage_path (never treat signed URLs as permanent)
 *
 * Browser must NEVER choose/override mode.
 * Never expose OPENAI_API_KEY, service role keys, stack traces, or raw OpenAI bodies.
 */

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const OPENAI_IMAGES_URL = 'https://api.openai.com/v1/images/generations';
const OPENAI_MODEL = 'gpt-image-1';
const OPENAI_TIMEOUT_MS = 90_000;
const STORAGE_BUCKET = 'generated-designs';
/** Display-only TTL. storage_path is the permanent DB reference. */
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DEMO_IMAGES_BY_CATEGORY: Record<string, Array<{ url: string; title: string }>> = {
  washbasins: [
    { url: 'https://images.pexels.com/photos/6585594/pexels-photo-6585594.jpeg', title: 'تصميم مودرن فاخر' },
    { url: 'https://images.pexels.com/photos/6550506/pexels-photo-6550506.jpeg', title: 'تصميم فندقي أنيق' },
    { url: 'https://images.pexels.com/photos/1910475/pexels-photo-1910475.jpeg', title: 'تصميم بسيط عصري' },
    { url: 'https://images.pexels.com/photos/2089678/pexels-photo-2089678.jpeg', title: 'تصميم كلاسيكي معاصر' },
  ],
  'wpc-doors': [
    { url: 'https://images.pexels.com/photos/5370652/pexels-photo-5370652.jpeg', title: 'باب رئيسي فاخر' },
    { url: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg', title: 'باب مودرن بسيط' },
  ],
  marble: [
    { url: 'https://images.pexels.com/photos/2089678/pexels-photo-2089678.jpeg', title: 'أرضية رخامية فاخرة' },
  ],
  aluminum: [
    { url: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg', title: 'واجهة ألمنيوم زجاجية' },
  ],
  glass: [
    { url: 'https://images.pexels.com/photos/1579259/pexels-photo-1579259.jpeg', title: 'باب شاور عصري' },
  ],
};

type GenerationMode = 'demo' | 'live';
type RequestAction = 'generate' | 'resolve-image';

type GenerationMeasurements = {
  width?: number;
  height?: number;
  depth?: number;
  length?: number;
  area?: number;
  unit?: string;
};

type GenerationRequestBody = {
  action?: string;
  category?: string;
  categoryLabel?: string;
  selectedProduct?: string;
  usageLocation?: string;
  style?: string;
  colors?: string[];
  materials?: string[];
  measurements?: GenerationMeasurements;
  budget?: string;
  budgetPriority?: string;
  customerNotes?: string;
  questionnaireAnswers?: Record<string, unknown>;
  recommendations?: unknown;
  projectId?: string;
  designId?: string;
  requestNumber?: string;
  validatedPrompt?: string;
  /** Ignored if present — mode is server-controlled only */
  mode?: unknown;
};

type ApiError = {
  code: string;
  message: string;
  retryable: boolean;
};

const MISSING = 'not specified by customer';

const isEmpty = (value: unknown): boolean => {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
};

const asText = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const isUuid = (value: string): boolean => UUID_RE.test(value);

const resolveServerMode = (): GenerationMode => {
  const raw = (Deno.env.get('DESIGN_GENERATION_MODE') || '').trim().toLowerCase();
  return raw === 'live' ? 'live' : 'demo';
};

const resolveAction = (body: GenerationRequestBody): RequestAction => {
  const action = asText(body.action)?.toLowerCase();
  return action === 'resolve-image' ? 'resolve-image' : 'generate';
};

const formatKnownOrMissing = (label: string, value: string | null | undefined): string => {
  if (!value) return `${label}: ${MISSING}`;
  return `${label}: ${value}`;
};

const formatList = (label: string, values?: string[]): string => {
  if (!values || values.length === 0) return `${label}: ${MISSING}`;
  return `${label}: ${values.join(', ')}`;
};

const formatMeasurements = (measurements?: GenerationMeasurements): string => {
  if (!measurements) return `measurements: ${MISSING}`;
  const parts: string[] = [];
  if (measurements.length != null) parts.push(`length ${measurements.length}`);
  if (measurements.width != null) parts.push(`width ${measurements.width}`);
  if (measurements.height != null) parts.push(`height ${measurements.height}`);
  if (measurements.depth != null) parts.push(`depth ${measurements.depth}`);
  if (measurements.area != null) parts.push(`area ${measurements.area}`);
  if (parts.length === 0) return `measurements: ${MISSING}`;
  const unit = asText(measurements.unit);
  return `measurements: ${parts.join(' × ')}${unit ? ` ${unit}` : ''}`;
};

const formatQuestionnaire = (answers?: Record<string, unknown>): string[] => {
  if (!answers || Object.keys(answers).length === 0) {
    return [`questionnaire answers: ${MISSING}`];
  }

  const lines = ['questionnaire answers (customer-provided only):'];
  for (const key of Object.keys(answers).sort()) {
    const value = answers[key];
    if (isEmpty(value)) continue;
    if (Array.isArray(value)) {
      const list = value.map((item) => asText(String(item))).filter(Boolean);
      if (list.length === 0) continue;
      lines.push(`- ${key}: ${list.join(', ')}`);
      continue;
    }
    if (typeof value === 'object') {
      lines.push(`- ${key}: ${JSON.stringify(value)}`);
      continue;
    }
    if (typeof value === 'boolean') {
      lines.push(`- ${key}: ${value ? 'yes' : 'no'}`);
      continue;
    }
    const text = asText(String(value));
    if (!text) continue;
    lines.push(`- ${key}: ${text}`);
  }

  return lines.length === 1 ? [`questionnaire answers: ${MISSING}`] : lines;
};

function buildDesignPrompt(request: GenerationRequestBody): string {
  const category = asText(request.categoryLabel) || asText(request.category);
  if (!category) {
    throw new Error('category_required');
  }

  return [
    'Create exactly one coherent photorealistic architectural visualization for a professional project file.',
    'Generate a single finished design scene only — not a collage, not multiple options, not a moodboard.',
    '',
    'MANDATORY CUSTOMER SELECTIONS (do not alter, replace, upgrade, or reinterpret):',
    formatKnownOrMissing('category', category),
    formatKnownOrMissing('selected product', asText(request.selectedProduct)),
    formatKnownOrMissing('usage location', asText(request.usageLocation)),
    formatKnownOrMissing('style', asText(request.style)),
    formatList('colors', request.colors),
    formatList('materials', request.materials),
    formatMeasurements(request.measurements),
    formatKnownOrMissing('budget', asText(request.budget)),
    formatKnownOrMissing('budget priority', asText(request.budgetPriority)),
    formatKnownOrMissing('customer notes', asText(request.customerNotes)),
    '',
    ...formatQuestionnaire(request.questionnaireAnswers),
    '',
    'ACCURACY RULES:',
    '- Preserve every explicit customer selection exactly as written',
    '- Do not invent material brands or product brands',
    '- Do not invent measurements',
    '- Do not change the category',
    '- Do not change the style',
    '- Do not add products that the customer did not select',
    '- If a value is missing, keep the scene plausible without fabricating branded or specific customer choices',
    '',
    'RENDERING REQUIREMENTS:',
    '- Photorealistic architectural visualization',
    '- Realistic construction, materials, and finishes exactly as specified when provided',
    '- Realistic proportions matching the provided measurements when available',
    '- Premium Saudi residential or commercial context when relevant to the category/usage',
    '- Natural, believable lighting and shadows',
    '',
    'STRICT NEGATIVE CONSTRAINTS:',
    '- No text, captions, labels, typography, or signage',
    '- No logos',
    '- No watermark',
    '- No impossible geometry',
    '- No duplicated objects or duplicated fixtures',
    '- No distorted doors, sinks, cabinets, windows, or fixtures',
    '- Do not invent materials, colors, category, products, or measurements that the customer did not provide',
  ].join('\n');
}

function hasStructuredSelections(body: GenerationRequestBody): boolean {
  return Boolean(
    asText(body.category) ||
    asText(body.selectedProduct) ||
    asText(body.style) ||
    asText(body.usageLocation) ||
    (body.colors && body.colors.length > 0) ||
    (body.materials && body.materials.length > 0) ||
    body.measurements ||
    asText(body.budget) ||
    asText(body.customerNotes) ||
    (body.questionnaireAnswers && Object.keys(body.questionnaireAnswers).length > 0)
  );
}

function resolvePrompt(body: GenerationRequestBody): string {
  const provided = asText(body.validatedPrompt);
  if (provided && provided.length >= 40) {
    if (hasStructuredSelections(body) && asText(body.category)) {
      return buildDesignPrompt(body);
    }
    return provided;
  }
  return buildDesignPrompt(body);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function errorResponse(mode: GenerationMode, error: ApiError, status = 400): Response {
  return jsonResponse(
    {
      success: false,
      mode,
      error,
    },
    status
  );
}

function createServiceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    throw new Error('missing_supabase_env');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Smallest practical project check without rewriting kiosk auth.
 * Trust model: kiosk uses anon key with broad table RLS; we still reject
 * invalid UUIDs and non-existent project ids before generate/sign.
 */
async function assertProjectExists(
  supabase: SupabaseClient,
  projectId: string
): Promise<ApiError | null> {
  if (!isUuid(projectId)) {
    return {
      code: 'INVALID_PROJECT',
      message: 'معرّف المشروع غير صالح.',
      retryable: false,
    };
  }

  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .maybeSingle();

  if (error) {
    return {
      code: 'PROJECT_LOOKUP_FAILED',
      message: 'تعذر التحقق من المشروع.',
      retryable: true,
    };
  }

  if (!data?.id) {
    return {
      code: 'MISSING_PROJECT',
      message: 'المشروع غير موجود.',
      retryable: false,
    };
  }

  return null;
}

function decodeBase64Image(b64: string): Uint8Array {
  const cleaned = b64.replace(/^data:image\/\w+;base64,/, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function mapOpenAiFailure(status: number, bodyText: string): ApiError {
  const lower = bodyText.toLowerCase();

  if (status === 401 || status === 403) {
    return {
      code: 'OPENAI_AUTH_FAILED',
      message: 'تعذر إنشاء التصميم حاليًا، يرجى المحاولة لاحقًا.',
      retryable: false,
    };
  }

  if (status === 429 || lower.includes('rate_limit') || lower.includes('rate limit')) {
    return {
      code: 'OPENAI_RATE_LIMIT',
      message: 'تعذر إنشاء التصميم حاليًا، يرجى المحاولة لاحقًا.',
      retryable: true,
    };
  }

  if (
    lower.includes('insufficient_quota') ||
    lower.includes('billing') ||
    lower.includes('quota') ||
    lower.includes('payment')
  ) {
    return {
      code: 'OPENAI_QUOTA_EXCEEDED',
      message: 'تعذر إنشاء التصميم حاليًا، يرجى المحاولة لاحقًا.',
      retryable: false,
    };
  }

  if (
    lower.includes('moderation') ||
    lower.includes('safety') ||
    lower.includes('content_policy') ||
    lower.includes('rejected')
  ) {
    return {
      code: 'OPENAI_MODERATION_REJECTED',
      message: 'تعذر إنشاء التصميم حاليًا، يرجى المحاولة لاحقًا.',
      retryable: false,
    };
  }

  if (status >= 500) {
    return {
      code: 'OPENAI_SERVER_ERROR',
      message: 'تعذر إنشاء التصميم حاليًا، يرجى المحاولة لاحقًا.',
      retryable: true,
    };
  }

  return {
    code: 'OPENAI_REQUEST_FAILED',
    message: 'تعذر إنشاء التصميم حاليًا، يرجى المحاولة لاحقًا.',
    retryable: false,
  };
}

type OpenAiImageResult =
  | { ok: true; b64: string }
  | { ok: false; error: ApiError; httpStatus: number };

async function callOpenAiOnce(prompt: string, apiKey: string): Promise<OpenAiImageResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_IMAGES_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        prompt,
        n: 1,
        size: '1536x1024',
        quality: 'high',
        background: 'opaque',
        output_format: 'png',
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      return {
        ok: false,
        error: mapOpenAiFailure(response.status, text),
        httpStatus: response.status,
      };
    }

    let parsed: { data?: Array<{ b64_json?: string; url?: string }> };
    try {
      parsed = JSON.parse(text);
    } catch {
      return {
        ok: false,
        error: {
          code: 'OPENAI_MALFORMED_RESPONSE',
          message: 'تعذر إنشاء التصميم حاليًا، يرجى المحاولة لاحقًا.',
          retryable: false,
        },
        httpStatus: 502,
      };
    }

    const b64 = parsed.data?.[0]?.b64_json;
    if (!b64 || typeof b64 !== 'string') {
      return {
        ok: false,
        error: {
          code: 'OPENAI_MALFORMED_RESPONSE',
          message: 'تعذر إنشاء التصميم حاليًا، يرجى المحاولة لاحقًا.',
          retryable: false,
        },
        httpStatus: 502,
      };
    }

    return { ok: true, b64 };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        ok: false,
        error: {
          code: 'OPENAI_TIMEOUT',
          message: 'تعذر إنشاء التصميم حاليًا، يرجى المحاولة لاحقًا.',
          retryable: true,
        },
        httpStatus: 504,
      };
    }

    return {
      ok: false,
      error: {
        code: 'OPENAI_NETWORK_ERROR',
        message: 'تعذر إنشاء التصميم حاليًا، يرجى المحاولة لاحقًا.',
        retryable: true,
      },
      httpStatus: 502,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function generateWithOpenAi(prompt: string, apiKey: string): Promise<OpenAiImageResult> {
  const first = await callOpenAiOnce(prompt, apiKey);
  if (first.ok) return first;

  const canRetry =
    first.error.retryable &&
    (first.error.code === 'OPENAI_SERVER_ERROR' ||
      first.error.code === 'OPENAI_NETWORK_ERROR' ||
      first.error.code === 'OPENAI_TIMEOUT');

  if (!canRetry) return first;

  await new Promise((resolve) => setTimeout(resolve, 750));
  return callOpenAiOnce(prompt, apiKey);
}

async function createFreshSignedUrl(
  supabase: SupabaseClient,
  storagePath: string
): Promise<string> {
  const signed = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (signed.error || !signed.data?.signedUrl) {
    throw new Error('signed_url_failed');
  }

  return signed.data.signedUrl;
}

/**
 * Persist live generation with storage_path as the canonical reference.
 * Do NOT store temporary signed URLs in image_url.
 */
async function uploadAndPersist(params: {
  supabase: SupabaseClient;
  projectId: string;
  prompt: string;
  imageBytes: Uint8Array;
}): Promise<{ imageUrl: string; storagePath: string; designId: string }> {
  const generationId = crypto.randomUUID();
  const storagePath = `projects/${params.projectId}/${generationId}.png`;

  const upload = await params.supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, params.imageBytes, {
      contentType: 'image/png',
      upsert: false,
    });

  if (upload.error) {
    throw new Error('storage_upload_failed');
  }

  const signedUrl = await createFreshSignedUrl(params.supabase, storagePath);

  const insert = await params.supabase
    .from('generated_designs')
    .insert({
      project_id: params.projectId,
      image_url: null,
      prompt: params.prompt,
      selected: false,
      model: OPENAI_MODEL,
      source: 'openai',
      status: 'completed',
      storage_path: storagePath,
      metadata: {
        size: '1536x1024',
        quality: 'high',
        output_format: 'png',
        background: 'opaque',
      },
    })
    .select('id')
    .single();

  if (insert.error || !insert.data?.id) {
    throw new Error('database_save_failed');
  }

  return {
    imageUrl: signedUrl,
    storagePath,
    designId: insert.data.id as string,
  };
}

async function handleResolveImage(
  mode: GenerationMode,
  body: GenerationRequestBody
): Promise<Response> {
  const projectId = asText(body.projectId);
  const designId = asText(body.designId);

  if (!projectId || !designId) {
    return errorResponse(mode, {
      code: 'INVALID_REQUEST',
      message: 'معرّف المشروع والتصميم مطلوبان.',
      retryable: false,
    });
  }

  if (!isUuid(projectId) || !isUuid(designId)) {
    return errorResponse(mode, {
      code: 'INVALID_REQUEST',
      message: 'معرّف المشروع أو التصميم غير صالح.',
      retryable: false,
    });
  }

  let supabase: SupabaseClient;
  try {
    supabase = createServiceClient();
  } catch {
    return errorResponse(mode, {
      code: 'SERVER_CONFIG_ERROR',
      message: 'تعذر تحميل صورة التصميم.',
      retryable: false,
    }, 503);
  }

  const projectError = await assertProjectExists(supabase, projectId);
  if (projectError) {
    return errorResponse(mode, projectError, projectError.code === 'MISSING_PROJECT' ? 404 : 400);
  }

  const { data: design, error } = await supabase
    .from('generated_designs')
    .select('id, project_id, image_url, storage_path, source')
    .eq('id', designId)
    .eq('project_id', projectId)
    .maybeSingle();

  if (error) {
    return errorResponse(mode, {
      code: 'DESIGN_LOOKUP_FAILED',
      message: 'تعذر تحميل صورة التصميم.',
      retryable: true,
    }, 502);
  }

  if (!design) {
    return errorResponse(mode, {
      code: 'DESIGN_NOT_FOUND',
      message: 'التصميم غير موجود لهذا المشروع.',
      retryable: false,
    }, 404);
  }

  const storagePath = asText(design.storage_path);
  if (storagePath) {
    const expectedPrefix = `projects/${projectId}/`;
    if (!storagePath.startsWith(expectedPrefix)) {
      return errorResponse(mode, {
        code: 'STORAGE_PATH_MISMATCH',
        message: 'تعذر تحميل صورة التصميم.',
        retryable: false,
      }, 403);
    }

    try {
      const url = await createFreshSignedUrl(supabase, storagePath);
      return jsonResponse({
        success: true,
        mode,
        url,
        storagePath,
        expiresInSeconds: SIGNED_URL_TTL_SECONDS,
        source: design.source || 'openai',
      });
    } catch {
      return errorResponse(mode, {
        code: 'SIGNED_URL_FAILED',
        message: 'تعذر تحميل صورة التصميم.',
        retryable: true,
      }, 502);
    }
  }

  const legacyUrl = asText(design.image_url);
  if (legacyUrl) {
    return jsonResponse({
      success: true,
      mode,
      url: legacyUrl,
      storagePath: null,
      source: design.source || 'demo',
      legacy: true,
    });
  }

  return errorResponse(mode, {
    code: 'DESIGN_IMAGE_MISSING',
    message: 'لا توجد صورة متاحة لهذا التصميم.',
    retryable: false,
  }, 404);
}

async function handleGenerate(
  mode: GenerationMode,
  body: GenerationRequestBody
): Promise<Response> {
  const projectId = asText(body.projectId);
  if (!projectId) {
    return errorResponse(mode, {
      code: 'MISSING_PROJECT',
      message: 'معرّف المشروع مطلوب لإنشاء التصميم.',
      retryable: false,
    });
  }

  if (!isUuid(projectId)) {
    return errorResponse(mode, {
      code: 'INVALID_PROJECT',
      message: 'معرّف المشروع غير صالح.',
      retryable: false,
    });
  }

  const category = asText(body.category);
  const validatedPrompt = asText(body.validatedPrompt);
  if (!category && !validatedPrompt) {
    return errorResponse(mode, {
      code: 'EMPTY_GENERATION_REQUEST',
      message: 'طلب التوليد فارغ. يلزم اختيارات العميل أو وصف معتمد.',
      retryable: false,
    });
  }

  if (!hasStructuredSelections(body) && !(validatedPrompt && validatedPrompt.length >= 40)) {
    return errorResponse(mode, {
      code: 'EMPTY_GENERATION_REQUEST',
      message: 'طلب التوليد فارغ. يلزم اختيارات العميل أو وصف معتمد.',
      retryable: false,
    });
  }

  let prompt = '';
  try {
    prompt = resolvePrompt(body);
  } catch {
    return errorResponse(mode, {
      code: 'PROMPT_BUILD_FAILED',
      message: 'تعذر بناء وصف التصميم.',
      retryable: false,
    });
  }

  if (!prompt || prompt.trim().length < 40) {
    return errorResponse(mode, {
      code: 'PROMPT_BUILD_FAILED',
      message: 'تعذر بناء وصف التصميم.',
      retryable: false,
    });
  }

  // Project existence check (service role). Missing OPENAI key is irrelevant in demo.
  let supabase: SupabaseClient | null = null;
  try {
    supabase = createServiceClient();
    const projectError = await assertProjectExists(supabase, projectId);
    if (projectError) {
      return errorResponse(mode, projectError, projectError.code === 'MISSING_PROJECT' ? 404 : 400);
    }
  } catch {
    // In demo mode, allow response without service role only if we cannot look up —
    // but prefer failing closed when service role is missing in any mode.
    return errorResponse(mode, {
      code: 'SERVER_CONFIG_ERROR',
      message: 'تعذر إنشاء التصميم حاليًا، يرجى المحاولة لاحقًا.',
      retryable: false,
    }, 503);
  }

  // -------------------- DEMO MODE (no OpenAI network call) --------------------
  if (mode === 'demo') {
    const demoCategory = category || 'washbasins';
    const demoSet = DEMO_IMAGES_BY_CATEGORY[demoCategory] || DEMO_IMAGES_BY_CATEGORY.washbasins;

    return jsonResponse({
      success: true,
      mode: 'demo',
      prompt,
      images: demoSet.map((image) => ({
        url: image.url,
        title: image.title,
        source: 'demo',
      })),
    });
  }

  // -------------------- LIVE MODE --------------------
  const apiKey = Deno.env.get('OPENAI_API_KEY')?.trim();
  if (!apiKey) {
    return errorResponse(mode, {
      code: 'MISSING_OPENAI_KEY',
      message: 'تعذر إنشاء التصميم حاليًا، يرجى المحاولة لاحقًا.',
      retryable: false,
    }, 503);
  }

  const openaiResult = await generateWithOpenAi(prompt, apiKey);
  if (!openaiResult.ok) {
    const status =
      openaiResult.error.code === 'OPENAI_TIMEOUT' ? 504 :
      openaiResult.error.code === 'OPENAI_RATE_LIMIT' ? 429 :
      502;
    return errorResponse(mode, openaiResult.error, status);
  }

  let imageBytes: Uint8Array;
  try {
    imageBytes = decodeBase64Image(openaiResult.b64);
  } catch {
    return errorResponse(mode, {
      code: 'OPENAI_MALFORMED_RESPONSE',
      message: 'تعذر إنشاء التصميم حاليًا، يرجى المحاولة لاحقًا.',
      retryable: false,
    }, 502);
  }

  try {
    const saved = await uploadAndPersist({
      supabase: supabase!,
      projectId,
      prompt,
      imageBytes,
    });

    return jsonResponse({
      success: true,
      mode: 'live',
      prompt,
      images: [
        {
          id: saved.designId,
          url: saved.imageUrl,
          storagePath: saved.storagePath,
          source: 'openai',
          model: OPENAI_MODEL,
          title: 'تصميم مُنشأ بالذكاء الاصطناعي',
        },
      ],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'storage_upload_failed' || message === 'signed_url_failed') {
      return errorResponse(mode, {
        code: 'STORAGE_UPLOAD_FAILED',
        message: 'تعذر حفظ صورة التصميم، يرجى المحاولة لاحقًا.',
        retryable: true,
      }, 502);
    }

    if (message === 'database_save_failed') {
      return errorResponse(mode, {
        code: 'DATABASE_SAVE_FAILED',
        message: 'تعذر حفظ التصميم، يرجى المحاولة لاحقًا.',
        retryable: true,
      }, 502);
    }

    return errorResponse(mode, {
      code: 'GENERATION_FAILED',
      message: 'تعذر إنشاء التصميم حاليًا، يرجى المحاولة لاحقًا.',
      retryable: false,
    }, 500);
  }
}

Deno.serve(async (req) => {
  const mode = resolveServerMode();

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse(mode, {
      code: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed. Use POST.',
      retryable: false,
    }, 405);
  }

  let body: GenerationRequestBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse(mode, {
      code: 'INVALID_REQUEST',
      message: 'طلب التوليد غير صالح.',
      retryable: false,
    });
  }

  if (!body || typeof body !== 'object') {
    return errorResponse(mode, {
      code: 'INVALID_REQUEST',
      message: 'طلب التوليد غير صالح.',
      retryable: false,
    });
  }

  const action = resolveAction(body);
  if (action === 'resolve-image') {
    return handleResolveImage(mode, body);
  }

  return handleGenerate(mode, body);
});
