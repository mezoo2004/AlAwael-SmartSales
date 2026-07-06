import { GeneratedDesign } from '../types';

export const generatedDesigns: Record<string, GeneratedDesign[]> = {
  washbasins: [
    {
      id: 'ws-design-001',
      imageUrl: 'https://images.pexels.com/photos/6585594/pexels-photo-6585594.jpeg',
      thumbnailUrl: 'https://images.pexels.com/photos/6585594/pexels-photo-6585594.jpeg',
      title: 'تصميم مودرن فاخر',
      description: 'وحدة مغاسل مودرن برخام أبيض كرارا وخزائن بأسلوب بسيط مع إضاءة LED مخفية',
      materials: ['رخام كرارا', 'خزائن MDF', 'كروم عالي الجودة'],
      colors: ['أبيض', 'رمادي فاتح'],
    },
    {
      id: 'ws-design-002',
      imageUrl: 'https://images.pexels.com/photos/6550506/pexels-photo-6550506.jpeg',
      thumbnailUrl: 'https://images.pexels.com/photos/6550506/pexels-photo-6550506.jpeg',
      title: 'تصميم فندقي أنيق',
      description: 'تصميم مستوحى من الفنادق الفاخرة مع رخام أسود لامع ومرآة ممتدة بإضاءة جانبية',
      materials: ['رخام أسود نيجرو ماركينا', 'زجاج', 'معدن فرش'],
      colors: ['أسود', 'ذهبي'],
    },
    {
      id: 'ws-design-003',
      imageUrl: 'https://images.pexels.com/photos/1910475/pexels-photo-1910475.jpeg',
      thumbnailUrl: 'https://images.pexels.com/photos/1910475/pexels-photo-1910475.jpeg',
      title: 'تصميم بسيط عصري',
      description: 'وحدة مغاسل بسيطة بخطوط نظيفة وبيج ناعم مع خزائن معلقة',
      materials: ['رخام كالاكاتا', 'خشب طبيعي', 'كروم مطفي'],
      colors: ['بيج', 'أبيض'],
    },
    {
      id: 'ws-design-004',
      imageUrl: 'https://images.pexels.com/photos/2089678/pexels-photo-2089678.jpeg',
      thumbnailUrl: 'https://images.pexels.com/photos/2089678/pexels-photo-2089678.jpeg',
      title: 'تصميم كلاسيكي معاصر',
      description: 'دمج بين الكلاسيكية والمعاصرة برخام رمادي متورد وخزائن خشبية داكنة',
      materials: ['رخام جراي ساندا', 'خشب بلوط', 'نحاس'],
      colors: ['رمادي', 'خشبي داكن'],
    },
  ],
  'wpc-doors': [
    {
      id: 'door-design-001',
      imageUrl: 'https://images.pexels.com/photos/5370652/pexels-photo-5370652.jpeg',
      thumbnailUrl: 'https://images.pexels.com/photos/5370652/pexels-photo-5370652.jpeg',
      title: 'باب رئيسي فاخر',
      description: 'باب WPC بتصميم فاخر مع خطوط عامودية وإطار ذهبي',
      materials: ['WPC عالي الجودة', 'ألمنيوم'],
      colors: ['خشبي داكن', 'ذهبي'],
    },
    {
      id: 'door-design-002',
      imageUrl: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg',
      thumbnailUrl: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg',
      title: 'باب مودرن بسيط',
      description: 'تصميم مودرن سادة مع تفاصيل دقيقة ومقبض كروم',
      materials: ['WPC', 'كروم'],
      colors: ['أبيض', 'كروم'],
    },
  ],
  marble: [
    {
      id: 'marble-design-001',
      imageUrl: 'https://images.pexels.com/photos/2089678/pexels-photo-2089678.jpeg',
      thumbnailUrl: 'https://images.pexels.com/photos/2089678/pexels-photo-2089678.jpeg',
      title: 'أرضية رخامية فاخرة',
      description: 'أرضيات من رخام كرارا الطبيعي بعروق رفيعة ولمعة ذكية',
      materials: ['رخام كرارا طبيعي'],
      colors: ['أبيض', 'رمادي'],
    },
  ],
  aluminum: [
    {
      id: 'al-design-001',
      imageUrl: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg',
      thumbnailUrl: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg',
      title: 'واجهة ألمنيوم زجاجية',
      description: 'واجهة ألمنيوم مع زجاج Low-E عالي الأداء',
      materials: ['ألمنيوم بعزل حراري', 'زجاج Low-E'],
      colors: ['أسود', 'شفاف'],
    },
  ],
  glass: [
    {
      id: 'glass-design-001',
      imageUrl: 'https://images.pexels.com/photos/1579259/pexels-photo-1579259.jpeg',
      thumbnailUrl: 'https://images.pexels.com/photos/1579259/pexels-photo-1579259.jpeg',
      title: 'باب شاور عصري',
      description: 'باب شاور زجاجي مع مفصلات كروم ومقبض أنيق',
      materials: ['زجاج 10 مم', 'كروم'],
      colors: ['شفاف', 'كروم'],
    },
  ],
};

export const getDesignsForDepartment = (departmentId: string): GeneratedDesign[] => {
  return generatedDesigns[departmentId] || generatedDesigns.washbasins;
};
