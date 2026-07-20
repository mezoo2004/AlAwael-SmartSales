import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { KioskLayout } from '../../components/layout';
import { AIUnderstandingIndicator, AIPreferencePredictionCard, QuestionScreen } from '../../components/kiosk';
import { useSession } from '../../context/SessionContext';
import { getQuestionsByDepartment } from '../../data';
import { Question, DepartmentId } from '../../types';
import flowConfig from '../../config/questionnaire/flow.json';
import {
  DecisionAnswers,
  DecisionDependencyRule,
  DecisionSkipRule,
  DecisionTree,
  getDecisionTreeState,
  getReachableNodeIds,
} from '../../lib/decisionTree';

type QuestionnaireFlowConfig = {
  dimensionsGateQuestionId: string;
  measurementQuestionId: string;
  legacyMeasurementQuestionIds: string[];
  productSelectionQuestionIds: Record<string, string>;
  injectedQuestions: {
    dimensionsGate: Omit<Question, 'departmentId'> & { departmentId?: DepartmentId };
    doorGlassType: Question;
  };
  branching: {
    dimensions: {
      knownValue: string;
    };
    doorGlassType: {
      departmentId: DepartmentId;
      triggerQuestionId: string;
      triggerValue: string;
      questionKey: 'doorGlassType';
    };
    aluminumGlassType: {
      departmentId: DepartmentId;
      questionId: string;
      sourceQuestionId: string;
      relevantValues: string[];
    };
  };
  dependencies: DecisionDependencyRule[];
  recommendations: DecisionSkipRule[];
};

const questionnaireFlow = flowConfig as unknown as QuestionnaireFlowConfig;
const DIMENSIONS_GATE_ID = questionnaireFlow.dimensionsGateQuestionId;
const legacyMeasurementQuestionIds = new Set(questionnaireFlow.legacyMeasurementQuestionIds);
const aluminumProductsWithGlass = new Set(questionnaireFlow.branching.aluminumGlassType.relevantValues);

const createConfiguredQuestion = (
  template: Omit<Question, 'departmentId'> & { departmentId?: DepartmentId },
  departmentId: DepartmentId,
  order: number
): Question => ({
  ...template,
  departmentId: template.departmentId || departmentId,
  order,
});

const ConfigurePage: React.FC = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const { session, setAnswer, getAnswer } = useSession();
  const [currentIndex, setCurrentIndex] = useState(0);

  const questions = useMemo(() => {
    return departmentId ? getQuestionsByDepartment(departmentId as DepartmentId) : [];
  }, [departmentId]);

  // Filter questions based on conditional logic
  const visibleQuestions = useMemo(() => {
    const answers = (session?.answers || {}) as DecisionAnswers;
    const dimensionsChoice = answers[DIMENSIONS_GATE_ID];
    const doorGlassBranch = questionnaireFlow.branching.doorGlassType;
    const aluminumGlassBranch = questionnaireFlow.branching.aluminumGlassType;
    const doorGlassTriggerAnswer = answers[doorGlassBranch.triggerQuestionId];
    const aluminumProductType = answers[aluminumGlassBranch.sourceQuestionId];
    const activeDepartment = departmentId as DepartmentId | undefined;
    const measurementQuestion = questions.find((q) => q.id === questionnaireFlow.measurementQuestionId);
    const productSelectionQuestionId = activeDepartment
      ? questionnaireFlow.productSelectionQuestionIds[activeDepartment]
      : undefined;

    return questions.reduce<Question[]>((acc, q) => {
      // Replace the old measurement uncertainty flow with the new smart branch.
      if (legacyMeasurementQuestionIds.has(q.id)) {
        return acc;
      }

      if (
        activeDepartment === aluminumGlassBranch.departmentId &&
        q.id === aluminumGlassBranch.questionId &&
        typeof aluminumProductType === 'string' &&
        !aluminumProductsWithGlass.has(aluminumProductType)
      ) {
        return acc;
      }

      let shouldShow = false;
      if (!q.conditional) {
        shouldShow = true;
      } else {
        const parentAnswer = answers[q.conditional.questionId];
        if (parentAnswer === undefined) {
          shouldShow = true;
        } else {
          switch (q.conditional.operator) {
            case 'equals':
              shouldShow = parentAnswer === q.conditional.value;
              break;
            case 'not-equals':
              shouldShow = parentAnswer !== q.conditional.value;
              break;
            case 'greater-than':
              shouldShow = typeof parentAnswer === 'number' && typeof q.conditional.value === 'number'
                ? parentAnswer > q.conditional.value
                : parseFloat(String(parentAnswer)) > parseFloat(String(q.conditional.value));
              break;
            case 'less-than':
              shouldShow = typeof parentAnswer === 'number' && typeof q.conditional.value === 'number'
                ? parentAnswer < q.conditional.value
                : parseFloat(String(parentAnswer)) < parseFloat(String(q.conditional.value));
              break;
            case 'contains':
              shouldShow = Array.isArray(parentAnswer) && parentAnswer.includes(q.conditional.value as string);
              break;
            default:
              shouldShow = true;
          }
        }
      }

      if (!shouldShow) return acc;

      acc.push(q);
      if (activeDepartment && measurementQuestion && q.id === productSelectionQuestionId) {
        acc.push(createConfiguredQuestion(questionnaireFlow.injectedQuestions.dimensionsGate, activeDepartment, q.order + 0.5));
        if (dimensionsChoice === questionnaireFlow.branching.dimensions.knownValue) {
          acc.push(measurementQuestion);
        }
      }
      if (
        activeDepartment === doorGlassBranch.departmentId &&
        q.id === doorGlassBranch.triggerQuestionId &&
        doorGlassTriggerAnswer === doorGlassBranch.triggerValue
      ) {
        acc.push(createConfiguredQuestion(questionnaireFlow.injectedQuestions[doorGlassBranch.questionKey], activeDepartment, q.order + 0.5));
      }

      return acc;
    }, []);
  }, [questions, session?.answers, departmentId]);

  // Recalculate when answers change
  useEffect(() => {
    if (currentIndex >= visibleQuestions.length && visibleQuestions.length > 0) {
      setCurrentIndex(visibleQuestions.length - 1);
    }
  }, [currentIndex, session?.answers, visibleQuestions.length]);

  const questionnaireTree = useMemo<DecisionTree<Question> | null>(() => {
    if (visibleQuestions.length === 0) return null;
    const activeDepartment = departmentId as DepartmentId | undefined;
    const visibleQuestionIds = new Set(visibleQuestions.map((question) => question.id));
    const getNodeSkipRules = (questionId: string): DecisionSkipRule[] => (
      questionnaireFlow.recommendations.filter((rule) => {
        const appliesToDepartment = !rule.departmentId || rule.departmentId === activeDepartment;
        const dependsOnQuestion = rule.conditions.some((condition) => condition.questionId === questionId);
        const dependsOnExternalAnswer = rule.conditions.some((condition) => !visibleQuestionIds.has(condition.questionId));
        return appliesToDepartment && (dependsOnQuestion || dependsOnExternalAnswer);
      })
    );
    const getNodeDependencyRules = (questionId: string): DecisionDependencyRule[] => (
      questionnaireFlow.dependencies.filter((rule) => {
        const appliesToDepartment = !rule.departmentId || rule.departmentId === activeDepartment;
        const dependsOnQuestion = rule.conditions.some((condition) => condition.questionId === questionId);
        return appliesToDepartment && dependsOnQuestion;
      })
    );

    return {
      id: `questionnaire-${departmentId || 'unknown'}`,
      startNodeId: visibleQuestions[0].id,
      orderedNodeIds: visibleQuestions.map((question) => question.id),
      nodes: visibleQuestions.reduce<DecisionTree<Question>['nodes']>((nodes, question, index) => {
        const nextQuestion = visibleQuestions[index + 1];
        const questionAfterNext = visibleQuestions[index + 2];
        const doorGlassBranch = questionnaireFlow.branching.doorGlassType;
        const isDimensionsGate = question.id === DIMENSIONS_GATE_ID && nextQuestion?.id === questionnaireFlow.measurementQuestionId;
        const isDoorDesignWithGlassBranch = question.id === doorGlassBranch.triggerQuestionId &&
          nextQuestion?.id === questionnaireFlow.injectedQuestions[doorGlassBranch.questionKey].id;

        nodes[question.id] = {
          id: question.id,
          question,
          skipRules: getNodeSkipRules(question.id),
          dependencyRules: getNodeDependencyRules(question.id),
          branches: [
            ...(isDimensionsGate
              ? [{
                id: 'known-dimensions',
                conditions: [{ questionId: DIMENSIONS_GATE_ID, operator: 'equals' as const, value: questionnaireFlow.branching.dimensions.knownValue }],
                nextNodeId: questionnaireFlow.measurementQuestionId,
              }]
              : []),
            ...(isDoorDesignWithGlassBranch
              ? [{
                id: 'door-with-glass',
                conditions: [{ questionId: doorGlassBranch.triggerQuestionId, operator: 'equals' as const, value: doorGlassBranch.triggerValue }],
                nextNodeId: questionnaireFlow.injectedQuestions[doorGlassBranch.questionKey].id,
              }]
              : []),
          ],
          defaultNextNodeId: isDimensionsGate || isDoorDesignWithGlassBranch
            ? questionAfterNext?.id
            : nextQuestion?.id,
          isTerminal: nextQuestion === undefined,
        };
        return nodes;
      }, {}),
    };
  }, [departmentId, visibleQuestions]);

  const currentNodeId = visibleQuestions[currentIndex]?.id;
  const decisionTreeState = questionnaireTree
    ? getDecisionTreeState(
      questionnaireTree,
      currentNodeId,
      (session?.answers || {}) as DecisionAnswers
    )
    : null;
  const currentQuestion = decisionTreeState?.currentNode?.question || null;
  const reachableNodeIds = questionnaireTree
    ? getReachableNodeIds(questionnaireTree, (session?.answers || {}) as DecisionAnswers)
    : [];
  const reachableNodeIdSet = new Set(reachableNodeIds);
  const navigationQuestions = visibleQuestions.filter((question) => reachableNodeIdSet.has(question.id));
  const currentQuestionIndex = currentQuestion
    ? navigationQuestions.findIndex((question) => question.id === currentQuestion.id)
    : -1;
  const answeredQuestionCount = navigationQuestions.filter((question) => {
    const answer = session?.answers?.[question.id];
    if (Array.isArray(answer)) return answer.length > 0;
    return answer !== undefined && answer !== null && answer !== '';
  }).length;

  const handleNext = () => {
    const nextNodeId = decisionTreeState?.nextNodeId;
    if (!nextNodeId) {
      navigate('/kiosk/review');
      return;
    }

    const nextIndex = visibleQuestions.findIndex((question) => question.id === nextNodeId);
    if (nextIndex >= 0) {
      setCurrentIndex(nextIndex);
    } else {
      navigate('/kiosk/review');
    }
  };

  const handleAnswerChange = (value: unknown) => {
    if (!currentQuestion) return;

    setAnswer(currentQuestion.id, value);
    if (currentQuestion.id === DIMENSIONS_GATE_ID) {
      setCurrentIndex((index) => Math.min(index + 1, visibleQuestions.length - 1));
    }
  };

  const handleBack = () => {
    const previousQuestion = currentQuestionIndex > 0
      ? navigationQuestions[currentQuestionIndex - 1]
      : null;
    if (previousQuestion) {
      const previousIndex = visibleQuestions.findIndex((question) => question.id === previousQuestion.id);
      setCurrentIndex(previousIndex);
    } else if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      navigate('/kiosk/departments');
    }
  };

  // Calculate step for progress
  const getStepFromQuestionType = (question: Question | undefined): number => {
    if (!question) return 2;
    if (question.id === DIMENSIONS_GATE_ID || legacyMeasurementQuestionIds.has(question.id)) {
      return 3;
    }
    if (question.id === 'budget' || question.id === 'implementation_date' || question.id === 'notes') {
      return 4;
    }
    if (question.id === 'site_image' || question.id === 'inspiration_images') {
      return 4;
    }
    return 2;
  };

  if (!currentQuestion) {
    return (
      <KioskLayout currentStep={2}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-brand-dark mb-4">لا توجد أسئلة متاحة</h2>
            <button onClick={() => navigate('/kiosk/departments')} className="btn btn-primary">
              العودة للأقسام
            </button>
          </div>
        </div>
      </KioskLayout>
    );
  }

  return (
    <KioskLayout currentStep={getStepFromQuestionType(currentQuestion)}>
      <AIUnderstandingIndicator
        answeredCount={answeredQuestionCount}
        currentQuestionIndex={Math.max(currentQuestionIndex, currentIndex)}
        totalQuestions={navigationQuestions.length || visibleQuestions.length}
      />
      <AIPreferencePredictionCard
        answers={(session?.answers || {}) as DecisionAnswers}
      />
      {currentQuestion && (
        <QuestionScreen
          question={currentQuestion}
          value={getAnswer(currentQuestion.id)}
          onChange={handleAnswerChange}
          onNext={handleNext}
          onBack={handleBack}
          isFirstQuestion={currentQuestionIndex <= 0}
          isLastQuestion={currentQuestionIndex === navigationQuestions.length - 1}
          currentQuestionIndex={Math.max(currentQuestionIndex, currentIndex)}
          totalQuestions={navigationQuestions.length || visibleQuestions.length}
        />
      )}
    </KioskLayout>
  );
};

export default ConfigurePage;
