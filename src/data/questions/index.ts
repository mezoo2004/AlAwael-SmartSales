import { DepartmentId, Question } from '../../types';
import washbasinQuestions from './washbasins';
import wpcDoorQuestions from './wpc-doors';
import marbleQuestions from './marble';
import aluminumQuestions from './aluminum';
import glassQuestions from './glass';

export const questions: Record<DepartmentId, Question[]> = {
  washbasins: washbasinQuestions,
  'wpc-doors': wpcDoorQuestions,
  marble: marbleQuestions,
  aluminum: aluminumQuestions,
  glass: glassQuestions,
};

export const getQuestionsByDepartment = (departmentId: DepartmentId): Question[] => {
  return questions[departmentId] || [];
};

export const getQuestionById = (departmentId: DepartmentId, questionId: string): Question | undefined => {
  const deptQuestions = questions[departmentId];
  return deptQuestions?.find((q) => q.id === questionId);
};

export { washbasinQuestions, wpcDoorQuestions, marbleQuestions, aluminumQuestions, glassQuestions };
