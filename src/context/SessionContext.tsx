import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  CustomerSession,
  DepartmentId,
  Measurement,
  UploadedImage,
  GeneratedDesign,
  ContactInfo,
  ModificationRequest,
  JourneyStep,
} from '../types';
import {
  saveCustomerAndIncompleteLead,
  updateLeadProgress,
  LeadPersistenceError,
  isSupabaseConfigured,
} from '../services/leadService';
import {
  finalizeProjectOrder,
  persistGeneratedDesigns,
  saveProjectAnswer,
  selectGeneratedDesign,
  updateProjectMetadata,
} from '../services/projectService';
import { normalizeSaudiPhone } from '../utils/phone';
import { CONSENT_TEXT_VERSION } from '../constants/consent';

const generateRequestNumber = (): string => {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 900000) + 100000;
  return `AWA-${year}-${num}`;
};

const safeGetItem = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const safeSetItem = (key: string, value: string): void => {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
};
const safeRemoveItem = (key: string): void => {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
};

interface SessionContextType {
  session: CustomerSession | null;
  isHydrated: boolean;
  startNewSession: () => void;
  setDepartment: (departmentId: DepartmentId) => void;
  setCurrentStep: (step: number) => void;
  setJourneyStep: (step: JourneyStep) => void;
  setAnswer: (questionId: string, value: unknown) => void;
  setAnswers: (answers: Record<string, unknown>) => void;
  getAnswer: (questionId: string) => unknown;
  setMeasurements: (measurements: Measurement) => void;
  addUploadedImage: (image: UploadedImage) => void;
  removeUploadedImage: (imageId: string) => void;
  setGeneratedDesigns: (designs: GeneratedDesign[]) => Promise<void>;
  selectDesign: (designId: string | null) => Promise<void>;
  addModification: (modification: ModificationRequest) => void;
  setContactInfo: (info: ContactInfo) => void;
  setRemoteCustomerProject: (customerId: string, projectId: string) => void;
  /** Save contact remotely as incomplete lead (required before departments) */
  saveContactAsLead: (info: ContactInfo) => Promise<void>;
  /** Update remote customer contact without creating a new lead */
  updateSavedContact: (info: ContactInfo) => Promise<void>;
  submitSession: () => Promise<string>;
  continuePreviousSession: () => boolean;
  getContinuePath: () => string;
  resetSession: () => void;
  hasIncompleteSession: boolean;
}

const STORAGE_KEY = 'showroom_session';
const SESSION_TIMEOUT = 15 * 60 * 1000;

const SessionContext = createContext<SessionContextType | null>(null);

const createNewSession = (): CustomerSession => ({
  id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  departmentId: null,
  currentStep: 0,
  journeyStep: 'started',
  answers: {},
  measurements: { unit: 'cm' },
  uploadedImages: [],
  generatedDesigns: [],
  selectedDesignId: null,
  modificationHistory: [],
  contactInfo: null,
  customerId: null,
  projectId: null,
  leadSessionId: null,
  remoteLeadStatus: null,
  status: 'in-progress',
  createdAt: new Date(),
  updatedAt: new Date(),
});

const normalizeHydratedSession = (parsed: CustomerSession): CustomerSession => ({
  ...parsed,
  journeyStep: parsed.journeyStep || (parsed.contactInfo ? 'customer_information_completed' : 'started'),
  customerId: parsed.customerId ?? null,
  projectId: parsed.projectId ?? null,
  leadSessionId: parsed.leadSessionId ?? null,
  remoteLeadStatus: parsed.remoteLeadStatus ?? null,
  createdAt: new Date(parsed.createdAt),
  updatedAt: new Date(parsed.updatedAt),
});

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasIncompleteSession, setHasIncompleteSession] = useState(false);
  const isInitializedRef = useRef(false);
  const sessionRef = useRef<CustomerSession | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const stored = safeGetItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = normalizeHydratedSession(JSON.parse(stored) as CustomerSession);
        const sessionAge = Date.now() - parsed.updatedAt.getTime();
        if (sessionAge < SESSION_TIMEOUT && parsed.status === 'in-progress') {
          setSession(parsed);
          setHasIncompleteSession(true);
        } else {
          safeRemoveItem(STORAGE_KEY);
        }
      } catch {
        safeRemoveItem(STORAGE_KEY);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (session && isHydrated) {
      safeSetItem(STORAGE_KEY, JSON.stringify({
        ...session,
        updatedAt: new Date().toISOString(),
      }));
      setHasIncompleteSession(session.status === 'in-progress');
    }
  }, [session, isHydrated]);

  const syncLeadProgress = useCallback((
    leadSessionId: string | null | undefined,
    currentStep: JourneyStep,
    patch?: {
      selectedDepartment?: DepartmentId | null;
      answers?: Record<string, unknown>;
      measurements?: Measurement;
      selectedDesignId?: string | null;
      sessionPayload?: Partial<CustomerSession>;
    }
  ) => {
    if (!leadSessionId || !isSupabaseConfigured) return;
    void updateLeadProgress({
      leadSessionId,
      currentStep,
      ...patch,
    });
  }, []);

  const startNewSession = useCallback(() => {
    const newSession = createNewSession();
    setSession(newSession);
    safeSetItem(STORAGE_KEY, JSON.stringify(newSession));
  }, []);

  const setDepartment = useCallback((departmentId: DepartmentId) => {
    setSession(prev => {
      if (!prev) return null;
      const next = {
        ...prev,
        departmentId,
        currentStep: 0,
        journeyStep: 'department_selected' as JourneyStep,
        updatedAt: new Date(),
      };
      syncLeadProgress(prev.leadSessionId, 'department_selected', {
        selectedDepartment: departmentId,
      });
      if (prev.projectId) {
        void updateProjectMetadata(prev.projectId, {
          department: departmentId,
          status: 'in_progress',
        });
      }
      return next;
    });
  }, [syncLeadProgress]);

  const setCurrentStep = useCallback((step: number) => {
    setSession(prev => prev ? { ...prev, currentStep: step, updatedAt: new Date() } : null);
  }, []);

  const setJourneyStep = useCallback((step: JourneyStep) => {
    setSession(prev => {
      if (!prev) return null;
      syncLeadProgress(prev.leadSessionId, step);
      return { ...prev, journeyStep: step, updatedAt: new Date() };
    });
  }, [syncLeadProgress]);

  const setAnswer = useCallback((questionId: string, value: unknown) => {
    setSession(prev => {
      if (!prev) return null;
      const answers = { ...prev.answers, [questionId]: value };
      syncLeadProgress(prev.leadSessionId, 'questionnaire_in_progress', { answers });
      if (prev.projectId) {
        void saveProjectAnswer(prev.projectId, questionId, value);
        if (questionId === 'budget_intelligence' && typeof value === 'string') {
          void updateProjectMetadata(prev.projectId, { budget_range: value });
        }
        if (questionId === 'budgetPriority' && typeof value === 'string') {
          void updateProjectMetadata(prev.projectId, { priority: value });
        }
      }
      return {
        ...prev,
        answers,
        journeyStep: 'questionnaire_in_progress',
        updatedAt: new Date(),
      };
    });
  }, [syncLeadProgress]);

  const setAnswers = useCallback((answers: Record<string, unknown>) => {
    setSession(prev => {
      if (!prev) return null;
      const merged = { ...prev.answers, ...answers };
      syncLeadProgress(prev.leadSessionId, 'questionnaire_in_progress', { answers: merged });
      if (prev.projectId) {
        Object.entries(answers).forEach(([questionId, value]) => {
          void saveProjectAnswer(prev.projectId!, questionId, value);
        });
      }
      return { ...prev, answers: merged, updatedAt: new Date() };
    });
  }, [syncLeadProgress]);

  const getAnswer = useCallback((questionId: string): unknown => {
    return session?.answers?.[questionId];
  }, [session]);

  const setMeasurements = useCallback((measurements: Measurement) => {
    setSession(prev => {
      if (!prev) return null;
      syncLeadProgress(prev.leadSessionId, 'questionnaire_in_progress', { measurements });
      if (prev.projectId) {
        void updateProjectMetadata(prev.projectId, { dimensions: measurements as unknown as Record<string, unknown> });
      }
      return { ...prev, measurements, updatedAt: new Date() };
    });
  }, [syncLeadProgress]);

  const addUploadedImage = useCallback((image: UploadedImage) => {
    setSession(prev => prev ? {
      ...prev,
      uploadedImages: [...prev.uploadedImages, image],
      updatedAt: new Date(),
    } : null);
  }, []);

  const removeUploadedImage = useCallback((imageId: string) => {
    setSession(prev => prev ? {
      ...prev,
      uploadedImages: prev.uploadedImages.filter(img => img.id !== imageId),
      updatedAt: new Date(),
    } : null);
  }, []);

  const setGeneratedDesigns = useCallback(async (designs: GeneratedDesign[]) => {
    const current = sessionRef.current;
    if (!current) return;

    let persistedDesigns = designs;
    if (current.projectId) {
      persistedDesigns = await persistGeneratedDesigns(current.projectId, designs);
    }
    console.log('Generated designs stored in session', persistedDesigns);

    setSession(prev => {
      if (!prev) return null;
      const next = {
        ...prev,
        generatedDesigns: persistedDesigns,
        selectedDesignId: null,
        journeyStep: 'designs_generated' as JourneyStep,
        updatedAt: new Date(),
      };
      syncLeadProgress(prev.leadSessionId, 'designs_generated');
      sessionRef.current = next;
      return next;
    });
  }, [syncLeadProgress]);

  const selectDesign = useCallback(async (designId: string | null) => {
    const current = sessionRef.current;
    if (!current) return;

    const selectedDesign = designId
      ? current.generatedDesigns.find(design => design.id === designId)
      : null;

    console.log('Selecting generated design', {
      localDesignId: designId,
      generatedDesignId: selectedDesign?.generatedDesignId ?? null,
      projectId: current.projectId,
      selectedDesign,
    });

    if (designId && !selectedDesign) {
      throw new LeadPersistenceError('التصميم المختار غير موجود في الجلسة', 'NO_SELECTED_DESIGN');
    }

    if (designId && current.projectId && selectedDesign?.generatedDesignId) {
      await selectGeneratedDesign({
        projectId: current.projectId,
        generatedDesignId: selectedDesign.generatedDesignId,
      });
    }

    setSession(prev => {
      if (!prev) return null;
      const next = {
        ...prev,
        selectedDesignId: designId,
        journeyStep: 'design_selected' as JourneyStep,
        updatedAt: new Date(),
      };
      syncLeadProgress(prev.leadSessionId, 'design_selected', { selectedDesignId: designId });
      sessionRef.current = next;
      console.log('Selected design stored in session', {
        selectedDesignId: designId,
        selectedDesign: selectedDesign || null,
        session: next,
      });
      return next;
    });
  }, [syncLeadProgress]);

  const addModification = useCallback((modification: ModificationRequest) => {
    setSession(prev => prev ? {
      ...prev,
      modificationHistory: [...prev.modificationHistory, modification],
      updatedAt: new Date(),
    } : null);
  }, []);

  const setContactInfo = useCallback((contactInfo: ContactInfo) => {
    setSession(prev => {
      const base = prev || createNewSession();
      return {
        ...base,
        contactInfo,
        journeyStep: 'customer_information_completed',
        updatedAt: new Date(),
      };
    });
  }, []);

  const setRemoteCustomerProject = useCallback((customerId: string, projectId: string) => {
    setSession(prev => {
      const base = prev || createNewSession();
      const next = {
        ...base,
        customerId,
        projectId,
        remoteLeadStatus: 'incomplete' as const,
        updatedAt: new Date(),
      };
      console.log('Stored remote customer/project in session', {
        customer: { id: customerId },
        project: { id: projectId, customer_id: customerId },
        session: next,
      });
      sessionRef.current = next;
      return next;
    });
  }, []);

  const prepareContact = (info: ContactInfo): ContactInfo => {
    const phone = normalizeSaudiPhone(info.phone);
    if (!phone) {
      throw new LeadPersistenceError('يرجى إدخال رقم جوال سعودي صحيح', 'INVALID_PHONE');
    }
    return {
      ...info,
      name: info.name.trim(),
      phone,
      city: info.city?.trim() || '',
      privacyAccepted: true,
      marketingConsent: Boolean(info.marketingConsent),
      consentTimestamp: info.consentTimestamp || new Date().toISOString(),
      consentTextVersion: info.consentTextVersion || CONSENT_TEXT_VERSION,
      agreedToPrivacy: true,
    };
  };

  const saveContactAsLead = useCallback(async (info: ContactInfo) => {
    const current = sessionRef.current;
    if (!current) {
      throw new LeadPersistenceError('لا توجد جلسة نشطة', 'NO_SESSION');
    }

    const prepared = prepareContact(info);
    const result = await saveCustomerAndIncompleteLead({
      localSessionId: current.id,
      contact: prepared,
      existingCustomerId: current.customerId,
      existingLeadSessionId: current.leadSessionId,
    });

    setSession(prev => prev ? {
      ...prev,
      contactInfo: prepared,
      customerId: result.customerId,
      projectId: prev.projectId,
      leadSessionId: result.leadSessionId,
      remoteLeadStatus: 'incomplete',
      journeyStep: 'customer_information_completed',
      updatedAt: new Date(),
    } : null);
  }, []);

  const updateSavedContact = useCallback(async (info: ContactInfo) => {
    const current = sessionRef.current;
    if (!current?.customerId || !current.leadSessionId) {
      throw new LeadPersistenceError('لا توجد بيانات عميل محفوظة', 'NO_CUSTOMER');
    }

    const prepared = prepareContact(info);
    await saveCustomerAndIncompleteLead({
      localSessionId: current.id,
      contact: prepared,
      existingCustomerId: current.customerId,
      existingLeadSessionId: current.leadSessionId,
    });

    setSession(prev => prev ? {
      ...prev,
      contactInfo: prepared,
      updatedAt: new Date(),
    } : null);
  }, []);

  const submitSession = useCallback(async (): Promise<string> => {
    const current = sessionRef.current;
    if (!current?.contactInfo) {
      throw new LeadPersistenceError('بيانات التواصل غير مكتملة', 'NO_CONTACT');
    }
    if (!current.customerId) {
      throw new LeadPersistenceError(
        'تعذر إكمال الطلب لأن رقم العميل في Supabase غير متوفر.',
        'NO_REMOTE_CUSTOMER'
      );
    }
    if (!current.projectId) {
      throw new LeadPersistenceError(
        'تعذر إكمال الطلب لأن رقم المشروع في Supabase غير متوفر.',
        'NO_REMOTE_PROJECT'
      );
    }
    console.log('Submitting session with remote IDs', {
      customerId: current.customerId,
      projectId: current.projectId,
      leadSessionId: current.leadSessionId,
    });

    const requestNumber = generateRequestNumber();
    const result = await finalizeProjectOrder({
      customerId: current.customerId,
      projectId: current.projectId,
      session: current,
      requestNumber,
    });
    console.log('Final project order submission result', result);

    setSession(prev => prev ? {
      ...prev,
      status: 'submitted',
      remoteLeadStatus: 'completed',
      journeyStep: 'request_submitted',
      updatedAt: new Date(),
    } : null);

    return requestNumber;
  }, []);

  const getContinuePathFromSession = (current: CustomerSession): string => {
    if (!current.contactInfo || !current.customerId) {
      return '/kiosk/contact';
    }
    if (!current.departmentId) {
      return '/kiosk/departments';
    }
    if (current.selectedDesignId) {
      return '/kiosk/final-review';
    }
    if (current.generatedDesigns.length > 0) {
      return '/kiosk/designs';
    }
    if (!current.answers?.budget_intelligence || !current.answers?.budgetPriority) {
      return '/kiosk/budget';
    }
    return `/kiosk/configure/${current.departmentId}`;
  };

  const getContinuePath = useCallback((): string => {
    const current = sessionRef.current;
    if (!current) return '/kiosk/contact';
    return getContinuePathFromSession(current);
  }, []);

  const continuePreviousSession = useCallback((): boolean => {
    const stored = safeGetItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = normalizeHydratedSession(JSON.parse(stored) as CustomerSession);
        if (parsed.status === 'in-progress') {
          setSession(parsed);
          sessionRef.current = parsed;
          return true;
        }
      } catch {
        // ignore
      }
    }
    return false;
  }, []);

  const resetSession = useCallback(() => {
    setSession(null);
    safeRemoveItem(STORAGE_KEY);
    safeRemoveItem('showroom_contact_draft');
    setHasIncompleteSession(false);
  }, []);

  return (
    <SessionContext.Provider value={{
      session,
      isHydrated,
      startNewSession,
      setDepartment,
      setCurrentStep,
      setJourneyStep,
      setAnswer,
      setAnswers,
      getAnswer,
      setMeasurements,
      addUploadedImage,
      removeUploadedImage,
      setGeneratedDesigns,
      selectDesign,
      addModification,
      setContactInfo,
      setRemoteCustomerProject,
      saveContactAsLead,
      updateSavedContact,
      submitSession,
      continuePreviousSession,
      getContinuePath,
      resetSession,
      hasIncompleteSession,
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export default SessionContext;
