// Department Types
export type DepartmentId = 'washbasins' | 'wpc-doors' | 'marble' | 'aluminum' | 'glass';

export interface Department {
  id: DepartmentId;
  name: string;
  description: string;
  icon: string;
  image: string;
  order: number;
}

// Question Types
export type QuestionType =
  | 'single-choice'
  | 'multiple-choice'
  | 'visual-cards'
  | 'color-swatches'
  | 'material-cards'
  | 'number-input'
  | 'measurement-input'
  | 'yes-no'
  | 'text-input'
  | 'text-area'
  | 'slider'
  | 'image-upload'
  | 'multi-image-upload'
  | 'style-selection'
  | 'budget-range'
  | 'date-input';

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
  image?: string;
  icon?: string;
  description?: string;
}

export interface Question {
  id: string;
  departmentId: DepartmentId;
  title: string;
  subtitle?: string;
  type: QuestionType;
  required: boolean;
  order: number;
  options?: QuestionOption[];
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  conditional?: {
    questionId: string;
    operator: 'equals' | 'not-equals' | 'greater-than' | 'less-than' | 'contains';
    value: string | number;
  };
  helperImage?: string;
  allowOther?: boolean;
  unit?: string;
}

// Session Types
export interface Measurement {
  width?: number;
  height?: number;
  depth?: number;
  unit: 'cm' | 'm' | 'inches';
}

export interface UploadedImage {
  id: string;
  type: 'site' | 'inspiration';
  url: string;
  previewUrl: string;
}

export interface ModificationRequest {
  type: string;
  details?: string;
}

export interface GeneratedDesign {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  materials: string[];
  colors: string[];
  modifications?: GeneratedDesign[];
}

export interface CustomerSession {
  id: string;
  departmentId: DepartmentId | null;
  currentStep: number;
  answers: Record<string, unknown>;
  measurements: Measurement;
  uploadedImages: UploadedImage[];
  generatedDesigns: GeneratedDesign[];
  selectedDesignId: string | null;
  modificationHistory: ModificationRequest[];
  contactInfo: ContactInfo | null;
  status: 'in-progress' | 'submitted' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

// Contact Types
export type PreferredContactMethod = 'call' | 'whatsapp' | 'sms';

export interface ContactInfo {
  name: string;
  phone: string;
  city: string;
  neighborhood?: string;
  email?: string;
  preferredContactMethod: PreferredContactMethod;
  preferredContactTime?: string;
  requestMeasurementVisit: boolean;
  agreedToPrivacy: boolean;
}

// Sales Request Types
export type RequestStatus =
  | 'new'
  | 'needs-follow-up'
  | 'pricing'
  | 'contacted'
  | 'approved'
  | 'completed'
  | 'cancelled';

export interface SalesRequest {
  id: string;
  requestNumber: string;
  customerId: string;
  departmentId: DepartmentId;
  contactInfo: ContactInfo;
  answers: Record<string, unknown>;
  measurements: Measurement;
  uploadedImages: UploadedImage[];
  generatedDesigns: GeneratedDesign[];
  selectedDesignId: string | null;
  modificationHistory: ModificationRequest[];
  notes?: string;
  status: RequestStatus;
  assignedEmployeeId?: string;
  followUpDate?: Date;
  budget?: string;
  implementationDate?: string;
  internalNotes?: string[];
  activityLog: ActivityLogEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  description: string;
  employeeId?: string;
  timestamp: Date;
}

// Employee Types
export interface Employee {
  id: string;
  name: string;
  role: 'sales' | 'manager' | 'admin';
  phone: string;
  email: string;
  avatar?: string;
}

// Navigation Types
export interface Step {
  id: string;
  label: string;
  path: string;
}

export interface KioskStep extends Step {
  isComplete: boolean;
  isActive: boolean;
}
