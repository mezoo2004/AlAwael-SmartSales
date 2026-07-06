import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CustomerSession, DepartmentId, Measurement, UploadedImage, GeneratedDesign, ContactInfo, ModificationRequest } from '../types';

const generateRequestNumber = (): string => {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 900000) + 100000;
  return `AWA-${year}-${num}`;
};

// Safe localStorage helpers (module-level to avoid re-creation)
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
  setAnswer: (questionId: string, value: unknown) => void;
  setAnswers: (answers: Record<string, unknown>) => void;
  getAnswer: (questionId: string) => unknown;
  setMeasurements: (measurements: Measurement) => void;
  addUploadedImage: (image: UploadedImage) => void;
  removeUploadedImage: (imageId: string) => void;
  setGeneratedDesigns: (designs: GeneratedDesign[]) => void;
  selectDesign: (designId: string | null) => void;
  addModification: (modification: ModificationRequest) => void;
  setContactInfo: (info: ContactInfo) => void;
  submitSession: () => Promise<string>;
  continuePreviousSession: () => boolean;
  resetSession: () => void;
  hasIncompleteSession: boolean;
}

const STORAGE_KEY = 'showroom_session';
const SESSION_TIMEOUT = 15 * 60 * 1000;

const SessionContext = createContext<SessionContextType | null>(null);

const createNewSession = (): CustomerSession => ({
  id: `session-${Date.now()}`,
  departmentId: null,
  currentStep: 0,
  answers: {},
  measurements: { unit: 'cm' },
  uploadedImages: [],
  generatedDesigns: [],
  selectedDesignId: null,
  modificationHistory: [],
  contactInfo: null,
  status: 'in-progress',
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasIncompleteSession, setHasIncompleteSession] = useState(false);
  const isInitializedRef = useRef(false);

  // Hydration from localStorage - runs only once
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const stored = safeGetItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CustomerSession;
        parsed.createdAt = new Date(parsed.createdAt);
        parsed.updatedAt = new Date(parsed.updatedAt);

        // Fix: call getTime() as a function
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

  // Persist to localStorage when session changes
  useEffect(() => {
    if (session && isHydrated) {
      safeSetItem(STORAGE_KEY, JSON.stringify({
        ...session,
        updatedAt: new Date().toISOString(),
      }));
      setHasIncompleteSession(session.status === 'in-progress');
    }
  }, [session, isHydrated]);

  const startNewSession = useCallback(() => {
    const newSession = createNewSession();
    setSession(newSession);
    safeSetItem(STORAGE_KEY, JSON.stringify(newSession));
  }, []);

  const setDepartment = useCallback((departmentId: DepartmentId) => {
    setSession(prev => prev ? { ...prev, departmentId, currentStep: 0 } : null);
  }, []);

  const setCurrentStep = useCallback((step: number) => {
    setSession(prev => prev ? { ...prev, currentStep: step } : null);
  }, []);

  const setAnswer = useCallback((questionId: string, value: unknown) => {
    setSession(prev => prev ? {
      ...prev,
      answers: { ...prev.answers, [questionId]: value },
    } : null);
  }, []);

  const setAnswers = useCallback((answers: Record<string, unknown>) => {
    setSession(prev => prev ? {
      ...prev,
      answers: { ...prev.answers, ...answers },
    } : null);
  }, []);

  const getAnswer = useCallback((questionId: string): unknown => {
    return session?.answers?.[questionId];
  }, [session]);

  const setMeasurements = useCallback((measurements: Measurement) => {
    setSession(prev => prev ? { ...prev, measurements } : null);
  }, []);

  const addUploadedImage = useCallback((image: UploadedImage) => {
    setSession(prev => prev ? {
      ...prev,
      uploadedImages: [...prev.uploadedImages, image],
    } : null);
  }, []);

  const removeUploadedImage = useCallback((imageId: string) => {
    setSession(prev => prev ? {
      ...prev,
      uploadedImages: prev.uploadedImages.filter(img => img.id !== imageId),
    } : null);
  }, []);

  const setGeneratedDesigns = useCallback((designs: GeneratedDesign[]) => {
    setSession(prev => prev ? { ...prev, generatedDesigns: designs } : null);
  }, []);

  const selectDesign = useCallback((designId: string | null) => {
    setSession(prev => prev ? { ...prev, selectedDesignId: designId } : null);
  }, []);

  const addModification = useCallback((modification: ModificationRequest) => {
    setSession(prev => prev ? {
      ...prev,
      modificationHistory: [...prev.modificationHistory, modification],
    } : null);
  }, []);

  const setContactInfo = useCallback((contactInfo: ContactInfo) => {
    setSession(prev => prev ? { ...prev, contactInfo } : null);
  }, []);

  const submitSession = useCallback(async (): Promise<string> => {
    const requestNumber = generateRequestNumber();
    setSession(prev => prev ? { ...prev, status: 'submitted' } : null);
    return requestNumber;
  }, []);

  const continuePreviousSession = useCallback((): boolean => {
    const stored = safeGetItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CustomerSession;
        if (parsed.status === 'in-progress') {
          setSession(parsed);
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
    setHasIncompleteSession(false);
  }, []);

  return (
    <SessionContext.Provider value={{
      session,
      isHydrated,
      startNewSession,
      setDepartment,
      setCurrentStep,
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
      submitSession,
      continuePreviousSession,
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
