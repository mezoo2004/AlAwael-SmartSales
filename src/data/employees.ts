import { Employee } from '../types';

export const employees: Employee[] = [
  {
    id: 'emp-001',
    name: 'أحمد الغامدي',
    role: 'sales',
    phone: '0501234567',
    email: 'ahmed@showroom.sa',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
  },
  {
    id: 'emp-002',
    name: 'محمد العتيبي',
    role: 'sales',
    phone: '0502345678',
    email: 'mohammed@showroom.sa',
    avatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg',
  },
  {
    id: 'emp-003',
    name: 'خالد الشهري',
    role: 'manager',
    phone: '0503456789',
    email: 'khaled@showroom.sa',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
  },
  {
    id: 'emp-004',
    name: 'عبدالله القحطاني',
    role: 'sales',
    phone: '0504567890',
    email: 'abdullah@showroom.sa',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg',
  },
];

export const getEmployeeById = (id: string): Employee | undefined => {
  return employees.find((emp) => emp.id === id);
};
