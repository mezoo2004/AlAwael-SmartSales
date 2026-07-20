import { SalesRequest } from '../types';

export const mockRequests: SalesRequest[] = [
  {
    id: 'req-001',
    requestNumber: 'AWA-2026-000123',
    customerId: 'cust-001',
    departmentId: 'washbasins',
    contactInfo: {
      name: 'سعد العمري',
      phone: '+966509876543',
      city: 'الرياض',
      neighborhood: 'النرجس',
      preferredContactMethod: 'whatsapp',
      requestMeasurementVisit: true,
      privacyAccepted: true,
      marketingConsent: false,
      consentTextVersion: 'showroom_kiosk_v1',
      agreedToPrivacy: true,
    },
    answers: {
      service_type: 'new',
      installation_location: 'main-bathroom',
      basin_count: '2',
      arrangement: 'connected',
      installation_type: 'marble-surface',
      design_style: 'modern',
      marble_color: 'white',
      cabinet_config: 'drawers-doors',
    },
    measurements: {
      width: 180,
      height: 55,
      depth: 50,
      unit: 'cm',
    },
    uploadedImages: [
      {
        id: 'img-001',
        type: 'site',
        url: 'https://images.pexels.com/photos/6550506/pexels-photo-6550506.jpeg',
        previewUrl: 'https://images.pexels.com/photos/6550506/pexels-photo-6550506.jpeg',
      },
    ],
    generatedDesigns: [
      {
        id: 'design-001',
        imageUrl: 'https://images.pexels.com/photos/6585594/pexels-photo-6585594.jpeg',
        thumbnailUrl: 'https://images.pexels.com/photos/6585594/pexels-photo-6585594.jpeg',
        title: 'تصميم مودرن أبيض',
        description: 'وحدة مغاسل مودرن برخام أبيض نقي وخزائن ب drawers أنيقة',
        materials: ['رخام كرارا', 'خشب MDF', 'كروم'],
        colors: ['أبيض', 'رمادي'],
      },
    ],
    selectedDesignId: 'design-001',
    modificationHistory: [],
    status: 'new',
    assignedEmployeeId: 'emp-001',
    budget: 'mid-range',
    activityLog: [
      {
        id: 'log-001',
        action: 'created',
        description: 'تم إنشاء الطلب',
        timestamp: new Date('2026-07-06T10:00:00'),
      },
    ],
    createdAt: new Date('2026-07-06T10:00:00'),
    updatedAt: new Date('2026-07-06T10:00:00'),
  },
  {
    id: 'req-002',
    requestNumber: 'AWA-2026-000124',
    customerId: 'cust-002',
    departmentId: 'wpc-doors',
    contactInfo: {
      name: 'فهد الدوسري',
      phone: '+966558765432',
      city: 'الرياض',
      neighborhood: 'العرقة',
      email: 'fahad@email.com',
      preferredContactMethod: 'call',
      requestMeasurementVisit: false,
      privacyAccepted: true,
      marketingConsent: true,
      consentTextVersion: 'showroom_kiosk_v1',
      agreedToPrivacy: true,
    },
    answers: {
      project_type: 'villa',
      door_type: 'main-door',
      door_count: 2,
      design_style: 'luxury',
      door_color: 'dark-wood',
    },
    measurements: {
      width: 120,
      height: 220,
      unit: 'cm',
    },
    uploadedImages: [],
    generatedDesigns: [
      {
        id: 'design-002',
        imageUrl: 'https://images.pexels.com/photos/5370652/pexels-photo-5370652.jpeg',
        thumbnailUrl: 'https://images.pexels.com/photos/5370652/pexels-photo-5370652.jpeg',
        title: 'باب رئيسي فاخر',
        description: 'باب WPC خشبي داكن بتصميم فاخر مع إكسسوارات ذهبية',
        materials: ['WPC', 'ألمنيوم'],
        colors: ['خشبي داكن', 'ذهبي'],
      },
    ],
    selectedDesignId: 'design-002',
    modificationHistory: [],
    status: 'pricing',
    assignedEmployeeId: 'emp-002',
    activityLog: [
      {
        id: 'log-002',
        action: 'created',
        description: 'تم إنشاء الطلب',
        timestamp: new Date('2026-07-05T14:30:00'),
      },
      {
        id: 'log-003',
        action: 'status_changed',
        description: 'تم تغيير الحالة إلى قيد التسعير',
        employeeId: 'emp-002',
        timestamp: new Date('2026-07-05T15:00:00'),
      },
    ],
    createdAt: new Date('2026-07-05T14:30:00'),
    updatedAt: new Date('2026-07-06T09:00:00'),
  },
  {
    id: 'req-003',
    requestNumber: 'AWA-2026-000125',
    customerId: 'cust-003',
    departmentId: 'marble',
    contactInfo: {
      name: 'نورة الشمرة',
      phone: '+966547654321',
      city: 'جدة',
      neighborhood: 'الحمراء',
      preferredContactMethod: 'whatsapp',
      requestMeasurementVisit: true,
      privacyAccepted: true,
      marketingConsent: false,
      consentTextVersion: 'showroom_kiosk_v1',
      agreedToPrivacy: true,
    },
    answers: {
      usage: ['floor', 'stairs'],
      stone_type: 'natural',
      color: 'beige',
      finish: 'polished',
    },
    measurements: {
      width: 45,
      unit: 'm',
    },
    uploadedImages: [],
    generatedDesigns: [
      {
        id: 'design-003',
        imageUrl: 'https://images.pexels.com/photos/2089678/pexels-photo-2089678.jpeg',
        thumbnailUrl: 'https://images.pexels.com/photos/2089678/pexels-photo-2089678.jpeg',
        title: 'رخام ترافيرتين بيج',
        description: 'أرضيات ودرج من رخام ترافيرتين طبيعي لون بيج مصقول',
        materials: ['ترافيرتين طبيعي'],
        colors: ['بيج'],
      },
    ],
    selectedDesignId: 'design-003',
    modificationHistory: [],
    status: 'contacted',
    assignedEmployeeId: 'emp-003',
    activityLog: [
      {
        id: 'log-004',
        action: 'created',
        description: 'تم إنشاء الطلب',
        timestamp: new Date('2026-07-04T09:15:00'),
      },
    ],
    createdAt: new Date('2026-07-04T09:15:00'),
    updatedAt: new Date('2026-07-05T11:00:00'),
  },
];

export const getRequestById = (id: string): SalesRequest | undefined => {
  return mockRequests.find((req) => req.id === id || req.requestNumber === id);
};

export const generateRequestNumber = (): string => {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 900000) + 100000;
  return `AWA-${year}-${num}`;
};
