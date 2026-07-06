import { Department } from '../types';

export const departments: Department[] = [
  {
    id: 'washbasins',
    name: 'المغاسل',
    description: 'صمّم وحدة مغاسل متكاملة حسب المساحة والذوق والخامات المناسبة.',
    icon: 'bath',
    image: 'https://images.pexels.com/photos/6550506/pexels-photo-6550506.jpeg',
    order: 1,
  },
  {
    id: 'wpc-doors',
    name: 'أبواب WPC',
    description: 'اختر تصميم الباب واللون والمقاس والإكسسوارات التي تناسب مشروعك.',
    icon: 'door-open',
    image: 'https://images.pexels.com/photos/5370652/pexels-photo-5370652.jpeg',
    order: 2,
  },
  {
    id: 'marble',
    name: 'الرخام',
    description: 'حدّد الاستخدام واللون والنمط والتشطيب للحصول على تصور مناسب.',
    icon: 'gem',
    image: 'https://images.pexels.com/photos/2089678/pexels-photo-2089678.jpeg',
    order: 3,
  },
  {
    id: 'aluminum',
    name: 'الألمنيوم',
    description: 'اختر النوافذ أو الأبواب أو الواجهات مع خيارات العزل والزجاج.',
    icon: 'layout-grid',
    image: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg',
    order: 4,
  },
  {
    id: 'glass',
    name: 'الزجاج',
    description: 'صمم واجهات أو قواطع أو شاورات أو مرايا حسب متطلباتك.',
    icon: 'square',
    image: 'https://images.pexels.com/photos/1579259/pexels-photo-1579259.jpeg',
    order: 5,
  },
];

export const getDepartmentById = (id: string): Department | undefined => {
  return departments.find((dept) => dept.id === id);
};
