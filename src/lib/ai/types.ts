/**
 * Shared AI design-generation contracts.
 * Safe for frontend and future Edge Function alignment.
 * Never place API keys in these types or related frontend code.
 */

export type GenerationStatus =
  | 'idle'
  | 'validating'
  | 'queued'
  | 'generating'
  | 'saving'
  | 'completed'
  | 'failed'
  | 'demo';

export type GenerationMode = 'demo' | 'live';

export type GenerationImageSource = 'demo' | 'openai' | 'storage';

export interface GenerationMeasurements {
  width?: number;
  height?: number;
  depth?: number;
  length?: number;
  area?: number;
  unit?: string;
}

export interface GenerationRecommendation {
  productName?: string;
  shortDescription?: string;
  whyItFits?: string;
  keyBenefits?: string[];
  complementaryRecommendations?: string[];
}

export interface GenerationRequest {
  /** Department / category id (e.g. washbasins) */
  category: string;
  /** Human-readable category label when available */
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
  /** Full questionnaire answers; empty or missing values are ignored by the prompt builder */
  questionnaireAnswers?: Record<string, unknown>;
  recommendations?: GenerationRecommendation | GenerationRecommendation[];
  /** Required by the Edge Function for persistence */
  projectId?: string;
  requestNumber?: string;
  /**
   * Optional pre-built prompt. The Edge Function still validates and may rebuild
   * from structured selections. Never used to override server-side mode.
   */
  validatedPrompt?: string;
}

export interface GenerationError {
  code: string;
  message: string;
  details?: string;
  retryable?: boolean;
}

export interface GenerationImage {
  url: string;
  thumbnailUrl?: string;
  source: GenerationImageSource;
  title?: string;
  description?: string;
  materials?: string[];
  colors?: string[];
  id?: string;
  storagePath?: string;
  model?: string;
}

export interface GenerationResult {
  success: boolean;
  mode: GenerationMode;
  status: GenerationStatus;
  prompt: string;
  images: GenerationImage[];
  error?: GenerationError;
}
