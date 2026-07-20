export type DecisionValue = string | number | boolean | string[] | null | undefined;

export type DecisionAnswers = Record<string, DecisionValue>;

export type DecisionConditionOperator =
  | 'equals'
  | 'not-equals'
  | 'greater-than'
  | 'less-than'
  | 'contains'
  | 'exists';

export interface DecisionCondition {
  questionId: string;
  operator: DecisionConditionOperator;
  value?: DecisionValue;
}

export interface DecisionBranch {
  id: string;
  conditions: DecisionCondition[];
  nextNodeId: string;
}

export interface DecisionSkipRule {
  id: string;
  departmentId?: string;
  conditions: DecisionCondition[];
  skipNodeIds?: string[];
  skipQuestionIds?: string[];
}

export interface DecisionDependencyRule {
  id: string;
  departmentId?: string;
  conditions: DecisionCondition[];
  skipNodeIds?: string[];
  requiredNodeIds?: string[];
}

export interface DecisionNode<TQuestion = unknown> {
  id: string;
  question: TQuestion;
  branches?: DecisionBranch[];
  skipRules?: DecisionSkipRule[];
  dependencyRules?: DecisionDependencyRule[];
  defaultNextNodeId?: string;
  isTerminal?: boolean;
}

export interface DecisionTree<TQuestion = unknown> {
  id: string;
  startNodeId: string;
  nodes: Record<string, DecisionNode<TQuestion>>;
  orderedNodeIds?: string[];
}

export interface DecisionTreeState<TQuestion = unknown> {
  currentNode: DecisionNode<TQuestion> | null;
  nextNodeId: string | null;
  skippedNodeIds: string[];
  isComplete: boolean;
}

const isNumeric = (value: DecisionValue): value is number | string => {
  if (value === null || value === undefined || Array.isArray(value) || typeof value === 'boolean') {
    return false;
  }
  return Number.isFinite(Number(value));
};

export const evaluateCondition = (
  condition: DecisionCondition,
  answers: DecisionAnswers
): boolean => {
  const answer = answers[condition.questionId];

  switch (condition.operator) {
    case 'equals':
      return answer === condition.value;
    case 'not-equals':
      return answer !== condition.value;
    case 'greater-than':
      return isNumeric(answer) && isNumeric(condition.value)
        ? Number(answer) > Number(condition.value)
        : false;
    case 'less-than':
      return isNumeric(answer) && isNumeric(condition.value)
        ? Number(answer) < Number(condition.value)
        : false;
    case 'contains':
      return Array.isArray(answer) && typeof condition.value === 'string'
        ? answer.includes(condition.value)
        : false;
    case 'exists':
      return answer !== undefined && answer !== null && answer !== '';
    default:
      return false;
  }
};

export const evaluateBranch = (
  branch: DecisionBranch,
  answers: DecisionAnswers
): boolean => branch.conditions.every((condition) => evaluateCondition(condition, answers));

const evaluateSkipRule = (
  rule: DecisionSkipRule | DecisionDependencyRule,
  answers: DecisionAnswers
): boolean => rule.conditions.every((condition) => evaluateCondition(condition, answers));

export const getSkippedNodeIds = <TQuestion>(
  tree: DecisionTree<TQuestion>,
  answers: DecisionAnswers
): string[] => {
  const skippedNodeIds = new Set<string>();

  Object.values(tree.nodes).forEach((node) => {
    node.skipRules?.forEach((rule) => {
      if (evaluateSkipRule(rule, answers)) {
        [...(rule.skipNodeIds || []), ...(rule.skipQuestionIds || [])]
          .forEach((nodeId) => skippedNodeIds.add(nodeId));
      }
    });

    node.dependencyRules?.forEach((rule) => {
      if (evaluateSkipRule(rule, answers)) {
        rule.skipNodeIds?.forEach((nodeId) => skippedNodeIds.add(nodeId));
      }
    });
  });

  return [...skippedNodeIds];
};

const getFallbackNextNodeId = <TQuestion>(
  tree: DecisionTree<TQuestion>,
  node: DecisionNode<TQuestion>,
  skippedNodeIds: Set<string>
): string | null => {
  let nextNodeId = node.defaultNextNodeId || null;

  while (nextNodeId && skippedNodeIds.has(nextNodeId)) {
    const skippedNode = tree.nodes[nextNodeId];
    nextNodeId = skippedNode
      ? getFallbackNextNodeId(tree, skippedNode, skippedNodeIds)
      : null;
  }

  return nextNodeId;
};

export const resolveNextNodeId = <TQuestion>(
  node: DecisionNode<TQuestion>,
  answers: DecisionAnswers,
  tree?: DecisionTree<TQuestion>
): string | null => {
  const matchingBranch = node.branches?.find((branch) => evaluateBranch(branch, answers));
  const skippedNodeIds = tree ? new Set(getSkippedNodeIds(tree, answers)) : new Set<string>();
  let nextNodeId = matchingBranch?.nextNodeId || node.defaultNextNodeId || null;

  while (nextNodeId && skippedNodeIds.has(nextNodeId)) {
    nextNodeId = tree
      ? getFallbackNextNodeId(tree, tree.nodes[nextNodeId], skippedNodeIds)
      : null;
  }

  return nextNodeId;
};

export const getDecisionTreeState = <TQuestion>(
  tree: DecisionTree<TQuestion>,
  currentNodeId: string | null | undefined,
  answers: DecisionAnswers
): DecisionTreeState<TQuestion> => {
  const nodeId = currentNodeId || tree.startNodeId;
  const currentNode = tree.nodes[nodeId] || null;

  if (!currentNode) {
    return {
      currentNode: null,
      nextNodeId: null,
      skippedNodeIds: [],
      isComplete: true,
    };
  }

  const skippedNodeIds = getSkippedNodeIds(tree, answers);
  const nextNodeId = currentNode.isTerminal
    ? null
    : resolveNextNodeId(currentNode, answers, tree);

  return {
    currentNode,
    nextNodeId,
    skippedNodeIds,
    isComplete: currentNode.isTerminal === true || nextNodeId === null,
  };
};

export const getReachableNodeIds = <TQuestion>(
  tree: DecisionTree<TQuestion>,
  answers: DecisionAnswers
): string[] => {
  const visited = new Set<string>();
  const orderedNodeIds: string[] = [];
  let currentNodeId: string | null = tree.startNodeId;

  while (currentNodeId && !visited.has(currentNodeId)) {
    visited.add(currentNodeId);
    orderedNodeIds.push(currentNodeId);

    const node: DecisionNode<TQuestion> | undefined = tree.nodes[currentNodeId];
    if (!node || node.isTerminal) break;

    currentNodeId = resolveNextNodeId(node, answers, tree);
  }

  return orderedNodeIds;
};
