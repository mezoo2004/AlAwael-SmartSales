/**
 * Frontend design generation service.
 *
 * DEMO MODE (default, enabled):
 * - Uses local prompt builder + centralized demo images from designs.ts
 * - Never calls OpenAI
 * - Never reads an OpenAI API key
 *
 * LIVE / EDGE PATH (prepared, not enabled):
 * - Flip USE_EDGE_FUNCTION_FOR_GENERATION to true in THIS FILE only when ready
 * - Call invokeGenerateDesignEdgeFunction()
 * - Server decides demo vs live via DESIGN_GENERATION_MODE secret
 * - Frontend must never override server mode
 * - Frontend must never call OpenAI directly
 */

import { getDepartmentById, getDesignsForDepartment } from '../data';
import { buildDesignPrompt } from '../lib/ai/buildDesignPrompt';
import type {
  GenerationError,
  GenerationImage,
  GenerationMeasurements,
  GenerationMode,
  GenerationRecommendation,
  GenerationRequest,
  GenerationResult,
  GenerationStatus,
} from '../lib/ai/types';
import type { CustomerSession, GeneratedDesign } from '../types';
import {
  getSummaryRecommendationResult,
  type ComplementaryProductRule,
  type RankedSummaryRecommendation,
  type SummaryRecommendationRule,
} from '../lib/summaryRecommendationEngine';
import type { DecisionAnswers } from '../lib/decisionTree';
import complementaryProductRules from '../config/questionnaire/complementaryProducts.json';
import summaryRecommendationRules from '../config/questionnaire/summaryRecommendations.json';
import { getSupabase } from '../lib/supabase';

/**
 * Frontend fallback remains demo until Live Mode is intentionally enabled later.
 * Server-side mode is controlled only by the DESIGN_GENERATION_MODE secret.
 */
export const DESIGN_GENERATION_MODE: GenerationMode = 'demo';

/**
 * SINGLE FRONTEND SWITCH for Edge Function generation testing.
 * Location: src/services/designGenerationService.ts
 *
 * - false (default): local demo images via designs.ts — current production-safe path
 * - true: call Supabase Edge Function `generate-design` (still never calls OpenAI from browser)
 *
 * Keep false until Edge Function is deployed and DESIGN_GENERATION_MODE=demo is set.
 * Do NOT use a VITE_ secret for this flag.
 */
export const USE_EDGE_FUNCTION_FOR_GENERATION = true;

const budgetLabels: Record<string, string> = {
  'under-5000': 'أقل من 5,000 ريال',
  '5000-10000': '5,000 - 10,000 ريال',
  '10000-20000': '10,000 - 20,000 ريال',
  '20000-50000': '20,000 - 50,000 ريال',
  'over-50000': 'أكثر من 50,000 ريال',
};

const priorityLabels: Record<string, string> = {
  economy: 'أقل تكلفة',
  balanced: 'أفضل قيمة',
  quality: 'جودة عالية',
  luxury: 'فخامة',
};

const styleLabels: Record<string, string> = {
  modern: 'مودرن',
  luxury: 'فاخر',
  minimal: 'بسيط',
  hotel: 'فندقي',
};

const asString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const asStringList = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    const list = value
      .map((item) => asString(item))
      .filter((item): item is string => Boolean(item));
    return list.length > 0 ? list : undefined;
  }
  const single = asString(value);
  return single ? [single] : undefined;
};

const firstAnswer = (
  answers: Record<string, unknown> | undefined,
  keys: string[]
): string | undefined => {
  if (!answers) return undefined;
  for (const key of keys) {
    const value = answers[key];
    const list = asStringList(value);
    if (list && list.length > 0) return list.join(', ');
    const single = asString(value);
    if (single) return single;
  }
  return undefined;
};

const mapBudget = (answers: Record<string, unknown> | undefined): string | undefined => {
  const raw = firstAnswer(answers, ['budget_intelligence', 'budget']);
  if (!raw) return undefined;
  return budgetLabels[raw] || raw;
};

const mapBudgetPriority = (answers: Record<string, unknown> | undefined): string | undefined => {
  const raw = firstAnswer(answers, ['budgetPriority', 'budget_priority']);
  if (!raw) return undefined;
  return priorityLabels[raw] || raw;
};

const mapStyle = (answers: Record<string, unknown> | undefined): string | undefined => {
  const raw = firstAnswer(answers, ['design_style', 'style']);
  if (!raw) return undefined;
  return styleLabels[raw] || raw;
};

const extractMeasurements = (session: CustomerSession): GenerationMeasurements | undefined => {
  const fromSession = session.measurements;
  const answerMeasurements = session.answers?.measurements;

  const merged: GenerationMeasurements = {
    unit: fromSession?.unit || 'cm',
  };

  const source =
    answerMeasurements && typeof answerMeasurements === 'object'
      ? (answerMeasurements as Record<string, unknown>)
      : null;

  const readNumber = (primary?: number, fallback?: unknown): number | undefined => {
    if (typeof primary === 'number' && !Number.isNaN(primary)) return primary;
    if (typeof fallback === 'number' && !Number.isNaN(fallback)) return fallback;
    if (typeof fallback === 'string' && fallback.trim() !== '') {
      const parsed = Number(fallback);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  };

  merged.width = readNumber(fromSession?.width, source?.width);
  merged.height = readNumber(fromSession?.height, source?.height);
  merged.depth = readNumber(fromSession?.depth, source?.depth);
  merged.length = readNumber(
    (fromSession as { length?: number } | undefined)?.length,
    source?.length
  );
  merged.area = readNumber(
    (fromSession as { area?: number } | undefined)?.area,
    source?.area
  );

  if (
    merged.width === undefined &&
    merged.height === undefined &&
    merged.depth === undefined &&
    merged.length === undefined &&
    merged.area === undefined
  ) {
    return undefined;
  }

  return merged;
};

const mapRecommendation = (
  item: RankedSummaryRecommendation
): GenerationRecommendation => ({
  productName: item.productName,
  shortDescription: item.shortDescription,
  whyItFits: item.whyItFits,
  keyBenefits: item.keyBenefits,
  complementaryRecommendations: item.complementaryRecommendations,
});

const extractRecommendations = (
  session: CustomerSession
): GenerationRecommendation[] | undefined => {
  if (!session.departmentId) return undefined;

  try {
    const result = getSummaryRecommendationResult(
      session.departmentId,
      (session.answers || {}) as DecisionAnswers,
      summaryRecommendationRules as unknown as SummaryRecommendationRule[],
      complementaryProductRules as unknown as ComplementaryProductRule[]
    );

    if (!result) return undefined;

    const list = [mapRecommendation(result.primary), ...result.alternatives.map(mapRecommendation)];
    return list;
  } catch {
    return undefined;
  }
};

/** Maps the live kiosk session into a structured GenerationRequest without inventing values. */
export function buildGenerationRequestFromSession(
  session: CustomerSession,
  extras?: { requestNumber?: string }
): GenerationRequest {
  const answers = session.answers || {};
  const departmentId = session.departmentId || 'washbasins';
  const department = getDepartmentById(departmentId);
  const recommendations = extractRecommendations(session);
  const selectedProduct =
    recommendations?.[0]?.productName ||
    firstAnswer(answers, ['product', 'selected_product', 'recommended_product']);

  return {
    category: departmentId,
    categoryLabel: department?.name,
    selectedProduct,
    usageLocation: firstAnswer(answers, ['location', 'usage', 'usage_location', 'room']),
    style: mapStyle(answers),
    colors: asStringList(answers.color) || asStringList(answers.colors),
    materials: asStringList(answers.material) || asStringList(answers.materials),
    measurements: extractMeasurements(session),
    budget: mapBudget(answers),
    budgetPriority: mapBudgetPriority(answers),
    customerNotes: firstAnswer(answers, ['notes', 'customer_notes', 'additional_notes']),
    questionnaireAnswers: answers,
    recommendations,
    projectId: session.projectId || undefined,
    requestNumber: extras?.requestNumber,
  };
}

export function validateGenerationRequest(request: GenerationRequest): GenerationError | null {
  if (!request || typeof request !== 'object') {
    return { code: 'invalid_request', message: 'طلب التوليد غير صالح.', retryable: false };
  }

  if (!request.category || String(request.category).trim() === '') {
    return { code: 'missing_category', message: 'الفئة مطلوبة لتوليد التصميم.', retryable: false };
  }

  return null;
}

const customizeDescription = (baseDescription: string, request: GenerationRequest): string => {
  let customized = baseDescription;

  if (request.style) {
    customized = customized.replace(/تصميم \w+/, `تصميم ${request.style}`);
  }

  if (request.budget && request.budgetPriority) {
    customized = `${customized} مع مراعاة ميزانية العميل (${request.budget}) وأولوية الاستثمار (${request.budgetPriority}).`;
  }

  return customized;
};

const toDemoImages = (request: GenerationRequest): GenerationImage[] => {
  const baseDesigns = getDesignsForDepartment(request.category);
  return baseDesigns.map((design, index) => ({
    id: `${design.id}-${Date.now()}-${index}`,
    url: design.imageUrl,
    thumbnailUrl: design.thumbnailUrl || design.imageUrl,
    source: 'demo' as const,
    title: design.title,
    description: customizeDescription(design.description, request),
    materials: design.materials,
    colors: design.colors,
  }));
};

/** Convert generation images into the existing GeneratedDesign shape used by the kiosk UI. */
export function toGeneratedDesigns(images: GenerationImage[], prompt: string): GeneratedDesign[] {
  return images.map((image, index) => ({
    id: image.id || `design-${Date.now()}-${index}`,
    generatedDesignId: image.source === 'openai' ? image.id : undefined,
    imageUrl: image.url,
    thumbnailUrl: image.thumbnailUrl || image.url,
    storagePath: image.storagePath,
    source: image.source,
    title: image.title || `تصميم ${index + 1}`,
    description: image.description || '',
    prompt,
    materials: image.materials || [],
    colors: image.colors || [],
  }));
}

export interface GenerateDesignOptions {
  onStatus?: (status: GenerationStatus) => void;
}

type EdgeFunctionSuccess = {
  success: true;
  mode: GenerationMode;
  prompt: string;
  images: GenerationImage[];
};

type EdgeFunctionFailure = {
  success: false;
  mode?: GenerationMode;
  error?: GenerationError;
};

function normalizeEdgeError(error: GenerationError | undefined): GenerationError {
  return {
    code: error?.code || 'EDGE_FUNCTION_FAILED',
    message: error?.message || 'تعذر إنشاء التصميم حاليًا، يرجى المحاولة لاحقًا.',
    retryable: error?.retryable ?? false,
    details: error?.details,
  };
}

/**
 * Safe Edge Function caller.
 * Mode is decided only on the server. Do not send mode from the browser.
 * Never places or reads OPENAI_API_KEY.
 */
export async function invokeGenerateDesignEdgeFunction(
  request: GenerationRequest,
  options?: GenerateDesignOptions
): Promise<GenerationResult> {
  const { onStatus } = options || {};
  onStatus?.('validating');

  const validationError = validateGenerationRequest(request);
  if (validationError) {
    return {
      success: false,
      mode: 'demo',
      status: 'failed',
      prompt: '',
      images: [],
      error: validationError,
    };
  }

  if (!request.projectId) {
    return {
      success: false,
      mode: 'demo',
      status: 'failed',
      prompt: '',
      images: [],
      error: {
        code: 'MISSING_PROJECT',
        message: 'معرّف المشروع مطلوب لإنشاء التصميم.',
        retryable: false,
      },
    };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {
      success: false,
      mode: 'demo',
      status: 'failed',
      prompt: '',
      images: [],
      error: {
        code: 'SUPABASE_NOT_CONFIGURED',
        message: 'تعذر الاتصال بخدمة التوليد حالياً.',
        retryable: false,
      },
    };
  }

  onStatus?.('queued');

  let validatedPrompt = '';
  try {
    validatedPrompt = buildDesignPrompt(request);
  } catch {
    // Edge Function can rebuild from structured fields.
  }

  // Never include mode — server secret decides.
  const payload = {
    category: request.category,
    categoryLabel: request.categoryLabel,
    selectedProduct: request.selectedProduct,
    usageLocation: request.usageLocation,
    style: request.style,
    colors: request.colors,
    materials: request.materials,
    measurements: request.measurements,
    budget: request.budget,
    budgetPriority: request.budgetPriority,
    customerNotes: request.customerNotes,
    questionnaireAnswers: request.questionnaireAnswers,
    recommendations: request.recommendations,
    projectId: request.projectId,
    requestNumber: request.requestNumber,
    validatedPrompt: validatedPrompt || request.validatedPrompt,
  };

  onStatus?.('generating');

  try {
    const { data, error } = await supabase.functions.invoke('generate-design', {
      body: payload,
    });

    if (error) {
      return {
        success: false,
        mode: 'demo',
        status: 'failed',
        prompt: validatedPrompt,
        images: [],
        error: {
          code: 'EDGE_FUNCTION_FAILED',
          message: 'تعذر إنشاء التصميم حاليًا، يرجى المحاولة لاحقًا.',
          retryable: true,
        },
      };
    }

    const response = data as EdgeFunctionSuccess | EdgeFunctionFailure | null;
    if (!response || typeof response !== 'object') {
      return {
        success: false,
        mode: 'demo',
        status: 'failed',
        prompt: validatedPrompt,
        images: [],
        error: {
          code: 'EDGE_MALFORMED_RESPONSE',
          message: 'تعذر إنشاء التصميم حاليًا، يرجى المحاولة لاحقًا.',
          retryable: false,
        },
      };
    }

    if (!response.success) {
      return {
        success: false,
        mode: response.mode === 'live' ? 'live' : 'demo',
        status: 'failed',
        prompt: validatedPrompt,
        images: [],
        error: normalizeEdgeError(response.error),
      };
    }

    const mode: GenerationMode = response.mode === 'live' ? 'live' : 'demo';
    onStatus?.(mode === 'live' ? 'saving' : 'demo');
    onStatus?.('completed');

    return {
      success: true,
      mode,
      status: mode === 'live' ? 'completed' : 'demo',
      prompt: response.prompt || validatedPrompt,
      images: (response.images || []).map((image) => ({
        ...image,
        source: image.source === 'openai' ? 'openai' : image.source === 'storage' ? 'storage' : 'demo',
      })),
    };
  } catch {
    return {
      success: false,
      mode: 'demo',
      status: 'failed',
      prompt: validatedPrompt,
      images: [],
      error: {
        code: 'EDGE_FUNCTION_FAILED',
        message: 'تعذر إنشاء التصميم حاليًا، يرجى المحاولة لاحقًا.',
        retryable: true,
      },
    };
  }
}

/**
 * Primary generation entry point used by the kiosk.
 * Remains in local Demo Mode (no Edge Function, no OpenAI) until Live Mode is enabled.
 */
export async function generateDesign(
  request: GenerationRequest,
  options?: GenerateDesignOptions
): Promise<GenerationResult> {
  const { onStatus } = options || {};

  // Prepared cutover path — intentionally disabled.
  if (USE_EDGE_FUNCTION_FOR_GENERATION) {
    return invokeGenerateDesignEdgeFunction(request, options);
  }

  onStatus?.('validating');
  const validationError = validateGenerationRequest(request);
  if (validationError) {
    return {
      success: false,
      mode: DESIGN_GENERATION_MODE,
      status: 'failed',
      prompt: '',
      images: [],
      error: validationError,
    };
  }

  onStatus?.('demo');

  let prompt = '';
  try {
    prompt = buildDesignPrompt(request);
  } catch (error) {
    return {
      success: false,
      mode: DESIGN_GENERATION_MODE,
      status: 'failed',
      prompt: '',
      images: [],
      error: {
        code: 'prompt_build_failed',
        message: 'تعذر بناء وصف التصميم.',
        details: error instanceof Error ? error.message : undefined,
        retryable: false,
      },
    };
  }

  const images = toDemoImages(request);

  onStatus?.('completed');

  return {
    success: true,
    mode: DESIGN_GENERATION_MODE,
    status: 'demo',
    prompt,
    images,
  };
}

export default generateDesign;
