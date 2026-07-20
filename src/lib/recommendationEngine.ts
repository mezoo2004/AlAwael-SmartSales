import { Question } from '../types';
import {
  DecisionAnswers,
  DecisionCondition,
  evaluateCondition,
} from './decisionTree';

export interface RecommendationRule {
  id: string;
  departmentId?: string;
  conditions: DecisionCondition[];
  skipQuestionIds?: string[];
}

export interface RecommendationEngineResult<TQuestion extends { id: string }> {
  questions: TQuestion[];
  skippedQuestionIds: string[];
  appliedRuleIds: string[];
}

const ruleApplies = (
  rule: RecommendationRule,
  departmentId: string | undefined,
  answers: DecisionAnswers
): boolean => {
  if (rule.departmentId && rule.departmentId !== departmentId) {
    return false;
  }

  return rule.conditions.every((condition) => evaluateCondition(condition, answers));
};

export const getRecommendedQuestionPath = <TQuestion extends Question>(
  questions: TQuestion[],
  answers: DecisionAnswers,
  rules: RecommendationRule[],
  departmentId?: string
): RecommendationEngineResult<TQuestion> => {
  const appliedRules = rules.filter((rule) => ruleApplies(rule, departmentId, answers));
  const skippedQuestionIds = new Set(
    appliedRules.flatMap((rule) => rule.skipQuestionIds || [])
  );

  return {
    questions: questions.filter((question) => !skippedQuestionIds.has(question.id)),
    skippedQuestionIds: [...skippedQuestionIds],
    appliedRuleIds: appliedRules.map((rule) => rule.id),
  };
};
