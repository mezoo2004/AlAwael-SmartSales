import { Department } from '../types';
import departmentsConfig from '../config/questionnaire/departments.json';

export const departments: Department[] = [...(departmentsConfig as Department[])]
  .sort((a, b) => a.order - b.order);

export const getDepartmentById = (id: string): Department | undefined => {
  return departments.find((dept) => dept.id === id);
};
