// Department Types
export type DepartmentId = string;

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

export type JourneyStep =
  | 'started'
  | 'customer_information_completed'
  | 'department_selected'
  | 'questionnaire_in_progress'
  | 'review'
  | 'designs_generated'
  | 'design_selected'
  | 'final_review'
  | 'request_submitted';

export interface CustomerSession {
  id: string;
  departmentId: DepartmentId | null;
  currentStep: number;
  journeyStep: JourneyStep;
  answers: Record<string, unknown>;
  measurements: Measurement;
  uploadedImages: UploadedImage[];
  generatedDesigns: GeneratedDesign[];
  selectedDesignId: string | null;
  modificationHistory: ModificationRequest[];
  contactInfo: ContactInfo | null;
  /** Remote Supabase customer UUID */
  customerId: string | null;
  /** Remote Supabase lead_sessions UUID */
  leadSessionId: string | null;
  remoteLeadStatus: 'incomplete' | 'completed' | null;
  status: 'in-progress' | 'submitted' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

// Contact Types
export type PreferredContactMethod = 'call' | 'whatsapp' | 'sms';

export interface ContactInfo {
  name: string;
  /** Stored in E.164 (+9665XXXXXXXX) after save */
  phone: string;
  city?: string;
  preferredContactMethod?: PreferredContactMethod;
  privacyAccepted: boolean;
  marketingConsent: boolean;
  consentTimestamp?: string;
  consentTextVersion: string;
  /** Legacy optional fields kept for mock dashboard requests */
  neighborhood?: string;
  email?: string;
  preferredContactTime?: string;
  requestMeasurementVisit?: boolean;
  /** @deprecated use privacyAccepted */
  agreedToPrivacy?: boolean;
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
