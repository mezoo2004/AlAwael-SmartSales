import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '../../components/ui';
import { GeometricStrip, GeometricBackground, GeometricCorner } from '../../components/patterns/GeometricPatterns';
import { useSession } from '../../context/SessionContext';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { hasIncompleteSession, startNewSession, continuePreviousSession } = useSession();

  const handleStartNew = () => {
    startNewSession();
    navigate('/kiosk/departments');
  };

  const handleContinue = () => {
    const success = continuePreviousSession();
    if (success) {
      navigate('/kiosk/departments');
    }
  };

  const handleHelp = () => {
    // In a real app, this would trigger an alert to staff
    alert('تم إرسال طلب المساعدة. سيأتي أحد الموظفين قريبًا.');
  };

  return (
    <div className="min-h-screen bg-brand-light-gradient flex flex-col relative overflow-hidden">
      {/* Background Pattern */}
      <GeometricBackground opacity={0.03} />

      {/* Top Pattern Strip */}
      <GeometricStrip variant="compact" />

      {/* Corner Decorations */}
      <GeometricCorner position="top-right" />
      <GeometricCorner position="bottom-left" />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full text-center relative z-10">
          {/* Logo Placeholder */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-brand-orange-gradient rounded-3xl shadow-xl">
              <span className="text-white text-4xl font-bold">AW</span>
            </div>
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

      {/* Bottom Pattern Strip */}
      <GeometricStrip variant="compact" />

      {/* Subtle gradient animation */}
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.1; }
        }
      `}</style>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 30% 70%, rgba(255, 90, 0, 0.05) 0%, transparent 50%)',
          animation: 'gradient-shift 8s ease-in-out infinite',
        }}
      />
    </div>
  );
};

export default WelcomePage;
