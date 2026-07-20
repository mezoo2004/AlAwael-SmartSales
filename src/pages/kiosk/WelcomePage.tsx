import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '../../components/ui';
import { BrandLogo, WelcomeAtmosphere } from '../../components/welcome/WelcomeAtmosphere';
import { useSession } from '../../context/SessionContext';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { hasIncompleteSession, startNewSession, continuePreviousSession, getContinuePath } = useSession();

  const handleStartNew = () => {
    startNewSession();
    navigate('/kiosk/contact');
  };

  const handleContinue = () => {
    const success = continuePreviousSession();
    if (success) {
      navigate(getContinuePath());
    }
  };

  const handleHelp = () => {
    // In a real app, this would trigger an alert to staff
    alert('تم إرسال طلب المساعدة. سيأتي أحد الموظفين قريبًا.');
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Premium architectural atmosphere (welcome-only) */}
      <WelcomeAtmosphere />

      {/* Main Content — unchanged copy & actions */}
      <div className="flex-1 flex items-center justify-center px-8 py-[95px] opacity-100 relative z-10">
        <div className="max-w-4xl w-full text-center welcome-content-fade">
          {/* Company logo */}
          <div className="mb-8 flex justify-center">
            <BrandLogo priority />
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl font-bold text-brand-dark mb-6 leading-tight">
            صمّم طلبك
            <span className="text-brand-orange block mt-2">كما تتخيله</span>
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-brand-gray mb-12 max-w-2xl mx-auto leading-relaxed">
            أجب عن بعض الأسئلة البسيطة، وسنحوّل فكرتك إلى تصور واضح
            يساعدك على اختيار التصميم المناسب.
          </p>

          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              size="xl"
              onClick={handleStartNew}
              className="text-xl px-12"
            >
              ابدأ طلبك
              <ArrowLeft className="w-6 h-6 mr-2" />
            </Button>

            {hasIncompleteSession && (
              <Button
                variant="secondary"
                size="lg"
                onClick={handleContinue}
                className="text-lg"
              >
                استكمال طلب سابق
              </Button>
            )}
          </div>

          {/* Help Button */}
          <button
            onClick={handleHelp}
            className="inline-flex items-center gap-2 text-brand-gray hover:text-brand-orange transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="text-lg">طلب مساعدة موظف</span>
          </button>
        </div>
      </div>

      {/* Subtle welcome-only motion */}
      <style>{`
        @keyframes welcome-glow-drift {
          0%, 100% { opacity: 0.45; transform: translate3d(0, 0, 0) scale(1); }
          50% { opacity: 0.7; transform: translate3d(2%, -1%, 0) scale(1.04); }
        }
        @keyframes welcome-facade-shift {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(-1.2%, 0.4%, 0); }
        }
        @keyframes welcome-content-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .welcome-orange-glow {
          background: radial-gradient(circle at 28% 68%, rgba(255, 90, 0, 0.07) 0%, transparent 42%),
                      radial-gradient(circle at 78% 24%, rgba(255, 90, 0, 0.045) 0%, transparent 38%);
          animation: welcome-glow-drift 14s ease-in-out infinite;
        }
        .welcome-facade-drift {
          animation: welcome-facade-shift 30s ease-in-out infinite;
          will-change: transform;
        }
        .welcome-content-fade {
          animation: welcome-content-in 0.7s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .welcome-orange-glow,
          .welcome-facade-drift,
          .welcome-content-fade {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default WelcomePage;
