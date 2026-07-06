import { RequestStatus } from '../types';

export interface StatusConfig {
  id: RequestStatus;
  label: string;
  color: string;
  bgColor: string;
}

export const requestStatuses: StatusConfig[] = [
  {
    id: 'new',
    label: 'الطلبات الجديدة',
    color: '#FF5A00',
    bgColor: '#FFF3EB',
  },
  {
    id: 'needs-follow-up',
    label: 'تحتاج متابعة',
    color: '#F59E0B',
    bgColor: '#FFF8EB',
  },
  {
    id: 'pricing',
    label: 'قيد التسعير',
    color: '#3B82F6',
    bgColor: '#EBF5FF',
  },
  {
    id: 'contacted',
    label: 'تم التواصل',
    color: '#8B5CF6',
    bgColor: '#F5EBFF',
  },
  {
    id: 'approved',
    label: 'تمت الموافقة',
    color: '#10B981',
    bgColor: '#EBFFF5',
  },
  {
    id: 'completed',
    label: 'مكتمل',
    color: '#059669',
    bgColor: '#EBFDF5',
  },
  {
    id: 'cancelled',
    label: 'ملغي',
    color: '#6B7280',
    bgColor: '#F3F4F6',
  },
];

export const getStatusConfig = (status: RequestStatus): StatusConfig => {
  return requestStatuses.find((s) => s.id === status) || requestStatuses[0];
};

export const colorOptions = [
  { id: 'white', label: 'أبيض', value: 'white', hex: '#FFFFFF' },
  { id: 'black', label: 'أسود', value: 'black', hex: '#1A1A1A' },
  { id: 'gray', label: 'رمادي', value: 'gray', hex: '#6B7280' },
  { id: 'beige', label: 'بيج', value: 'beige', hex: '#D4B896' },
  { id: 'cream', label: 'كريمي', value: 'cream', hex: '#FFFDD0' },
  { id: 'gold', label: 'ذهبي', value: 'gold', hex: '#FFC107' },
  { id: 'green', label: 'أخضر', value: 'green', hex: '#4CAF50' },
  { id: 'silver', label: 'فضي', value: 'silver', hex: '#C0C0C0' },
  { id: 'chrome', label: 'كروم', value: 'chrome', hex: '#DEE1E6' },
  { id: 'matte-black', label: 'أسود مطفي', value: 'matte-black', hex: '#2D2D2D' },
  { id: 'copper', label: 'نحاسي', value: 'copper', hex: '#B87333' },
  { id: 'light-wood', label: 'خشبي فاتح', value: 'light-wood', hex: '#DEB887' },
  { id: 'dark-wood', label: 'خشبي داكن', value: 'dark-wood', hex: '#654321' },
];
