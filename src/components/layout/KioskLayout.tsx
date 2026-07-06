import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import { ProgressStepper } from '../ui';
import { ConfirmDialog } from '../ui/Modal';

const KIOSK_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const WARNING_TIME = 30 * 1000; // 30 seconds before timeout

const kioskSteps = [
  { id: 'department', label: 'القسم' },
  { id: 'details', label: 'التفاصيل' },
  { id: 'measurements', label: 'المقاسات' },
  { id: 'design', label: 'التصميم' },
  { id: 'contact', label: 'التواصل' },
  { id: 'submit', label: 'الإرسال' },
];

interface KioskLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  showProgress?: boolean;
  className?: string;
}

export const KioskLayout: React.FC<KioskLayoutProps> = ({
  children,
  currentStep,
  showProgress = true,
  className = '',
}) => {
  const navigate = useNavigate();
  const { resetSession } = useSession();
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [remainingTime, setRemainingTime] = useState(30);
  const [showWarning, setShowWarning] = useState(false);

  const clearTimers = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const startInactivityTimer = useCallback(() => {
    clearTimers();

    inactivityTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingTime(30);

      // Start countdown
      countdownIntervalRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            // Time's up - reset and redirect
            clearTimers();
            resetSession();
            navigate('/kiosk');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, KIOSK_TIMEOUT - WARNING_TIME);
  }, [clearTimers, resetSession, navigate]);

  const continueSession = useCallback(() => {
    setShowWarning(false);
    clearTimers();
    startInactivityTimer();
  }, [clearTimers, startInactivityTimer]);

  const handleTimeout = useCallback(() => {
    setShowWarning(false);
    clearTimers();
    resetSession();
    navigate('/kiosk');
  }, [clearTimers, resetSession, navigate]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];

    const handleActivity = () => {
      if (!showWarning) {
        startInactivityTimer();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    startInactivityTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearTimers();
    };
  }, [startInactivityTimer, clearTimers, showWarning]);

  return (
    <div className={`min-h-screen bg-brand-light-gradient flex flex-col ${className}`}>
      {/* Header with Progress */}
      {showProgress && (
        <header className="bg-white shadow-md py-6 px-8">
          <div className="max-w-5xl mx-auto">
            <ProgressStepper
              steps={kioskSteps}
              currentStep={currentStep}
            />
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Inactivity Warning Dialog */}
      <ConfirmDialog
        isOpen={showWarning}
        onClose={continueSession}
        onConfirm={handleTimeout}
        title="تنبيه: انتهاء الجلسة"
        message={`ستنتهي الجلسة في ${remainingTime} ثانية بسبب عدم النشاط. هل تريد إنهاء الجلسة الآن؟`}
        confirmLabel="إنهاء الجلسة"
        cancelLabel="متابعة"
        variant="warning"
      />
    </div>
  );
};

export default KioskLayout;
