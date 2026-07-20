import {
  DecisionAnswers,
  DecisionCondition,
  evaluateCondition,
} from './decisionTree';

export interface SummaryRecommendation {
  recommendedProduct: string;
  shortDescription?: string;
  whySelected: string;
  keyBenefits: string[];
  complementaryRecommendations?: string[];
}

export interface RankedSummaryRecommendation {
  productName: string;
  shortDescription: string;
  whyItFits: string;
  matchScore: number;
  keyBenefits: string[];
  complementaryRecommendations?: string[];
  ruleId: string;
}

export interface SummaryRecommendationResult {
  primary: RankedSummaryRecommendation;
  alternatives: RankedSummaryRecommendation[];
}

export interface ComplementaryProductRule {
  id: string;
  departmentId?: string;
  priority?: number;
  conditions: DecisionCondition[];
  products: string[];
}

export interface SummaryRecommendationRule {
  id: string;
  departmentId?: string;
  priority?: number;
  conditions: DecisionCondition[];
  recommendation: SummaryRecommendation;
}

const ruleDepartmentMatches = (
  rule: { departmentId?: string },
  departmentId: string | undefined
): boolean => {
  return !rule.departmentId || rule.departmentId === departmentId;
};

const getRuleMatchCount = (
  rule: SummaryRecommendationRule,
  answers: DecisionAnswers
): number => {
  return rule.conditions.filter((condition) => evaluateCondition(condition, answers)).length;
};

const hasAnswer = (answers: DecisionAnswers, questionId: string): boolean => {
  const value = answers[questionId];
  return value !== undefined && value !== null && value !== '';
};

const getContextCoverageScore = (answers: DecisionAnswers): number => {
  const contextQuestionIds = [
    'budget_intelligence',
    'budgetPriority',
    'usage',
    'installation_location',
    'door_type',
    'product_type',
    'design_style',
    'door_color',
    'color',
    'marble_color',
    'stone_type',
    'glass_type',
    'finish',
    'dimensions_known',
  ];

  const answeredContextCount = contextQuestionIds.filter((questionId) => hasAnswer(answers, questionId)).length;
  return Math.min(12, answeredContextCount * 2);
};

const getBudgetPriorityScore = (
  rule: SummaryRecommendationRule,
  answers: DecisionAnswers
): number => {
  const budgetPriority = answers.budgetPriority;
  if (typeof budgetPriority !== 'string') return 0;

  const ruleContext = [
    rule.id,
    rule.recommendation.recommendedProduct,
    rule.recommendation.shortDescription || '',
    rule.recommendation.whySelected,
    ...rule.recommendation.keyBenefits,
  ].join(' ').toLowerCase();

  const economicalSignals = ['economical', 'economic', 'standard', 'practical', 'clean', 'engineered', 'اقتصادي', 'عملية', 'قياسي', 'تكلفة'];
  const premiumSignals = ['luxury', 'premium', 'imported', 'custom', 'architectural', 'complete', 'فاخر', 'فاخرة', 'مميز', 'مخصصة', 'بريميوم'];
  const hasEconomicalSignal = economicalSignals.some((signal) => ruleContext.includes(signal));
  const hasPremiumSignal = premiumSignals.some((signal) => ruleContext.includes(signal));

  if (budgetPriority === 'economy') {
    if (hasEconomicalSignal) return 18;
    if (hasPremiumSignal) return -34;
  }

  if (budgetPriority === 'balanced') {
    if (!hasEconomicalSignal && !hasPremiumSignal) return 12;
    if (hasEconomicalSignal) return 4;
    if (hasPremiumSignal) return -8;
  }

  if (budgetPriority === 'quality') {
    if (hasPremiumSignal) return 10;
    if (hasEconomicalSignal) return -8;
  }

  if (budgetPriority === 'luxury') {
    if (hasPremiumSignal) return 22;
    if (hasEconomicalSignal) return -28;
  }

  return 0;
};

const getBudgetPriorityGuidance = (answers: DecisionAnswers): Pick<RankedSummaryRecommendation, 'whyItFits' | 'keyBenefits'> | null => {
  const budgetPriority = answers.budgetPriority;
  const budget = answers.budget_intelligence;

  if (typeof budgetPriority !== 'string' || typeof budget !== 'string') return null;

  if (budgetPriority === 'economy') {
    return {
      whyItFits: 'تم ضبط التوصية لتراعي الميزانية وأولوية أقل تكلفة، لذلك يركز الاختيار على خامات محلية وبدائل ذكية تقلل التكلفة دون فقدان الوظيفة الأساسية.',
      keyBenefits: [
        'خامات محلية أو بدائل عملية',
        'أفكار لتقليل التكلفة',
        'تجنب المنتجات المستوردة الفاخرة',
      ],
    };
  }

  if (budgetPriority === 'balanced') {
    return {
      whyItFits: 'تم ضبط التوصية لتوازن بين الميزانية وأولوية أفضل قيمة، لذلك يركز الاختيار على خامات أعلى قيمة دون مبالغة في التكلفة.',
      keyBenefits: [
        'أفضل توازن بين السعر والجودة',
        'خامات عالية القيمة',
        'ترقيات مختارة بعناية',
      ],
    };
  }

  if (budgetPriority === 'quality') {
    return {
      whyItFits: 'تم ضبط التوصية لتراعي الميزانية مع أولوية الجودة العالية، لذلك يركز الاختيار على تحسين الخامات والتشطيبات ضمن حدود الميزانية.',
      keyBenefits: [
        'جودة أعلى ضمن الميزانية',
        'تشطيبات أكثر متانة',
        'اختيارات عملية طويلة الأمد',
      ],
    };
  }

  if (budgetPriority === 'luxury') {
    return {
      whyItFits: 'تم ضبط التوصية لتراعي الميزانية مع أولوية الفخامة، لذلك يفتح النظام خيارات خامات وإكسسوارات وتشطيبات أفخم بما يتناسب مع سقف الميزانية.',
      keyBenefits: [
        'خامات وتشطيبات فاخرة',
        'إكسسوارات بريميوم',
        'تفاصيل تصميم أعلى مستوى',
      ],
    };
  }

  return null;
};

const scoreRule = (
  rule: SummaryRecommendationRule,
  answers: DecisionAnswers
): number => {
  const totalConditions = rule.conditions.length;
  const matchedConditions = getRuleMatchCount(rule, answers);
  const conditionScore = totalConditions === 0
    ? 42
    : Math.round((matchedConditions / totalConditions) * 72);
  const priorityScore = Math.min(14, Math.round((rule.priority || 0) / 10));

  return Math.max(1, Math.min(99, conditionScore + priorityScore + getContextCoverageScore(answers) + getBudgetPriorityScore(rule, answers)));
};

const toRankedRecommendation = (
  rule: SummaryRecommendationRule,
  answers: DecisionAnswers
): RankedSummaryRecommendation => {
  const budgetPriorityGuidance = getBudgetPriorityGuidance(answers);
  const keyBenefits = [
    ...rule.recommendation.keyBenefits,
    ...(budgetPriorityGuidance?.keyBenefits || []),
  ];

  return {
    productName: rule.recommendation.recommendedProduct,
    shortDescription: rule.recommendation.shortDescription || rule.recommendation.recommendedProduct,
    whyItFits: budgetPriorityGuidance
      ? `${rule.recommendation.whySelected} ${budgetPriorityGuidance.whyItFits}`
      : rule.recommendation.whySelected,
    matchScore: scoreRule(rule, answers),
    keyBenefits: [...new Set(keyBenefits)],
    complementaryRecommendations: rule.recommendation.complementaryRecommendations,
    ruleId: rule.id,
  };
};

const complementaryRuleMatches = (
  rule: ComplementaryProductRule,
  departmentId: string | undefined,
  answers: DecisionAnswers
): boolean => (
  ruleDepartmentMatches(rule, departmentId) &&
  rule.conditions.every((condition) => evaluateCondition(condition, answers))
);

const getComplementaryProducts = (
  departmentId: string | undefined,
  answers: DecisionAnswers,
  rules: ComplementaryProductRule[],
  fallbackProducts: string[] = []
): string[] => {
  const products = [
    ...rules
      .filter((rule) => complementaryRuleMatches(rule, departmentId, answers))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .flatMap((rule) => rule.products),
    ...fallbackProducts,
  ];

  return [...new Set(products)].slice(0, 6);
};

export const getSummaryRecommendationResult = (
  departmentId: string | undefined,
  answers: DecisionAnswers,
  rules: SummaryRecommendationRule[],
  complementaryRules: ComplementaryProductRule[] = []
): SummaryRecommendationResult | null => {
  const candidates = rules
    .filter((rule) => ruleDepartmentMatches(rule, departmentId))
    .map((rule) => toRankedRecommendation(rule, answers))
    .sort((a, b) => b.matchScore - a.matchScore);

  const primary = candidates[0];
  if (!primary) return null;

  const primaryWithComplementaryProducts = {
    ...primary,
    complementaryRecommendations: getComplementaryProducts(
      departmentId,
      answers,
      complementaryRules,
      primary.complementaryRecommendations || []
    ),
  };

  return {
    primary: primaryWithComplementaryProducts,
    alternatives: candidates
      .filter((candidate) => candidate.ruleId !== primary.ruleId)
      .slice(0, 3),
  };
};

export const getSummaryRecommendation = (
  departmentId: string | undefined,
  answers: DecisionAnswers,
  rules: SummaryRecommendationRule[],
  complementaryRules: ComplementaryProductRule[] = []
): SummaryRecommendation | null => {
  const result = getSummaryRecommendationResult(departmentId, answers, rules, complementaryRules);
  if (!result) return null;

  return {
    recommendedProduct: result.primary.productName,
    shortDescription: result.primary.shortDescription,
    whySelected: result.primary.whyItFits,
    keyBenefits: result.primary.keyBenefits,
    complementaryRecommendations: result.primary.complementaryRecommendations,
  };
};
