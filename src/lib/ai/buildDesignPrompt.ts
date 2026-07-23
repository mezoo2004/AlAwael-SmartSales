import type {
  GenerationMeasurements,
  GenerationRecommendation,
  GenerationRequest,
} from './types';

const MISSING = 'not specified by customer';

const isEmptyValue = (value: unknown): boolean => {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
};

const asTrimmedString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const asStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => asTrimmedString(item))
      .filter((item): item is string => Boolean(item));
  }

  const single = asTrimmedString(value);
  return single ? [single] : [];
};

const formatKnownOrMissing = (label: string, value: string | null | undefined): string => {
  if (!value || value.trim() === '') {
    return `${label}: ${MISSING}`;
  }
  return `${label}: ${value.trim()}`;
};

const formatListKnownOrMissing = (label: string, values: string[] | undefined): string => {
  if (!values || values.length === 0) {
    return `${label}: ${MISSING}`;
  }
  return `${label}: ${values.join(', ')}`;
};

const formatMeasurements = (measurements?: GenerationMeasurements): string => {
  if (!measurements) {
    return `measurements: ${MISSING}`;
  }

  const parts: string[] = [];
  if (measurements.length !== undefined && measurements.length !== null) {
    parts.push(`length ${measurements.length}`);
  }
  if (measurements.width !== undefined && measurements.width !== null) {
    parts.push(`width ${measurements.width}`);
  }
  if (measurements.height !== undefined && measurements.height !== null) {
    parts.push(`height ${measurements.height}`);
  }
  if (measurements.depth !== undefined && measurements.depth !== null) {
    parts.push(`depth ${measurements.depth}`);
  }
  if (measurements.area !== undefined && measurements.area !== null) {
    parts.push(`area ${measurements.area}`);
  }

  if (parts.length === 0) {
    return `measurements: ${MISSING}`;
  }

  const unit = asTrimmedString(measurements.unit);
  return `measurements: ${parts.join(' × ')}${unit ? ` ${unit}` : ''}`;
};

const formatRecommendations = (
  recommendations?: GenerationRecommendation | GenerationRecommendation[]
): string[] => {
  if (!recommendations) {
    return [`recommendations: ${MISSING}`];
  }

  const list = Array.isArray(recommendations) ? recommendations : [recommendations];
  const lines: string[] = [];

  list.forEach((item, index) => {
    const prefix = list.length > 1 ? `recommendation ${index + 1}` : 'recommendation';
    const product = asTrimmedString(item.productName);
    const description = asTrimmedString(item.shortDescription);
    const why = asTrimmedString(item.whyItFits);
    const benefits = (item.keyBenefits || []).map(asTrimmedString).filter(Boolean) as string[];
    const complementary = (item.complementaryRecommendations || [])
      .map(asTrimmedString)
      .filter(Boolean) as string[];

    if (!product && !description && !why && benefits.length === 0 && complementary.length === 0) {
      return;
    }

    if (product) lines.push(`${prefix} product: ${product}`);
    if (description) lines.push(`${prefix} description: ${description}`);
    if (why) lines.push(`${prefix} rationale: ${why}`);
    if (benefits.length > 0) lines.push(`${prefix} benefits: ${benefits.join('; ')}`);
    if (complementary.length > 0) {
      lines.push(`${prefix} complementary: ${complementary.join('; ')}`);
    }
  });

  if (lines.length === 0) {
    return [`recommendations: ${MISSING}`];
  }

  return lines;
};

const formatQuestionnaireAnswers = (
  answers?: Record<string, unknown>
): string[] => {
  if (!answers || Object.keys(answers).length === 0) {
    return [`questionnaire answers: ${MISSING}`];
  }

  const lines: string[] = ['questionnaire answers (customer-provided only):'];
  const keys = Object.keys(answers).sort();

  keys.forEach((key) => {
    const value = answers[key];
    if (isEmptyValue(value)) return;

    if (Array.isArray(value)) {
      const list = asStringList(value);
      if (list.length === 0) return;
      lines.push(`- ${key}: ${list.join(', ')}`);
      return;
    }

    if (typeof value === 'object') {
      lines.push(`- ${key}: ${JSON.stringify(value)}`);
      return;
    }

    if (typeof value === 'boolean') {
      lines.push(`- ${key}: ${value ? 'yes' : 'no'}`);
      return;
    }

    const text = asTrimmedString(String(value));
    if (!text) return;
    lines.push(`- ${key}: ${text}`);
  });

  if (lines.length === 1) {
    return [`questionnaire answers: ${MISSING}`];
  }

  return lines;
};

/**
 * Deterministic image-generation prompt builder.
 * Never invents missing customer selections, never replaces materials/category/measurements.
 */
export function buildDesignPrompt(request: GenerationRequest): string {
  const category = asTrimmedString(request.categoryLabel) || asTrimmedString(request.category);
  if (!category) {
    throw new Error('GenerationRequest.category is required');
  }

  const colors = asStringList(request.colors);
  const materials = asStringList(request.materials);
  const selectedProduct = asTrimmedString(request.selectedProduct);
  const usageLocation = asTrimmedString(request.usageLocation);
  const style = asTrimmedString(request.style);
  const budget = asTrimmedString(request.budget);
  const budgetPriority = asTrimmedString(request.budgetPriority);
  const customerNotes = asTrimmedString(request.customerNotes);

  const sections: string[] = [
    'Create exactly one coherent photorealistic architectural visualization for a professional project file.',
    'Generate a single finished design scene only — not a collage, not multiple options, not a moodboard.',
    '',
    'MANDATORY CUSTOMER SELECTIONS (do not alter, replace, upgrade, or reinterpret):',
    formatKnownOrMissing('category', category),
    formatKnownOrMissing('selected product', selectedProduct),
    formatKnownOrMissing('usage location', usageLocation),
    formatKnownOrMissing('style', style),
    formatListKnownOrMissing('colors', colors),
    formatListKnownOrMissing('materials', materials),
    formatMeasurements(request.measurements),
    formatKnownOrMissing('budget', budget),
    formatKnownOrMissing('budget priority', budgetPriority),
    formatKnownOrMissing('customer notes', customerNotes),
    ...formatRecommendations(request.recommendations),
    '',
    ...formatQuestionnaireAnswers(request.questionnaireAnswers),
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
  ];

  return sections.join('\n');
}

export const DESIGN_PROMPT_MISSING_VALUE = MISSING;
