import { DepartmentId, Question } from '../../types';
import questionsConfig from '../../config/questionnaire/questions.json';

const sortQuestions = (questionList: Question[]): Question[] => (
  [...questionList].sort((a, b) => a.order - b.order)
);

export const questions: Record<DepartmentId, Question[]> = Object.fromEntries(
  Object.entries(questionsConfig as Record<string, Question[]>)
    .map(([departmentId, questionList]) => [departmentId, sortQuestions(questionList)])
);

export const getQuestionsByDepartment = (departmentId: DepartmentId): Question[] => {
  return questions[departmentId] || [];
};

export const getQuestionById = (departmentId: DepartmentId, questionId: string): Question | undefined => {
  const deptQuestions = questions[departmentId];
  return deptQuestions?.find((q) => q.id === questionId);
};

export const washbasinQuestions = questions.washbasins || [];
export const wpcDoorQuestions = questions['wpc-doors'] || [];
export const marbleQuestions = questions.marble || [];
export const aluminumQuestions = questions.aluminum || [];
export const glassQuestions = questions.glass || [];
