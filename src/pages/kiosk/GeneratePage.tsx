import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KioskLayout } from '../../components/layout';
import { LoadingScreen } from '../../components/ui';
import { GeometricStrip } from '../../components/patterns/GeometricPatterns';
import { useSession } from '../../context/SessionContext';
import { aiProvider } from '../../providers';

const GeneratePage: React.FC = () => {
  const navigate = useNavigate();
  const { session, setGeneratedDesigns } = useSession();
  const [progress, setProgress] = useState({ step: 0, total: 5, message: '' });
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    const generate = async () => {
      if (!session) return;

      setIsGenerating(true);
      try {
        const designs = await aiProvider.generateDesigns(session, (p) => {
          setProgress(p);
        });
        setGeneratedDesigns(designs);
        navigate('/kiosk/designs');
      } catch (error) {
        console.error('Generation failed:', error);
        // Handle error
      } finally {
        setIsGenerating(false);
      }
    };

    generate();
  }, [session, setGeneratedDesigns, navigate]);

  const progressPercent = (progress.step / progress.total) * 100;

  return (
    <KioskLayout currentStep={3} showProgress={false}>
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 pointer-events-none">
          <GeometricStrip variant="thin" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-lg mx-auto">
          {/* Animated Icon */}
          <div className="mb-8 relative">
            <div className="w-32 h-32 mx-auto rounded-full bg-brand-orange/10 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-brand-orange flex items-center justify-center">
                <svg className="w-10 h-10 text-white animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            </div>

            {/* Orbiting dots */}
            <div className="absolute top-0 left-1/2 w-4 h-4 bg-brand-orange rounded-full" style={{
              animation: 'orbit 2s linear infinite',
              transformOrigin: '50% 64px',
            }} />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-brand-dark mb-4">
            جاري إنشاء التصاميم
          </h1>

          {/* Status Message */}
          <p className="text-xl text-brand-orange font-medium mb-8 min-h-[32px]">
            {progress.message}
          </p>

          {/* Progress Bar */}
          <div className="w-full max-w-sm mx-auto">
            <div className="h-3 bg-brand-light rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-orange-gradient rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-brand-gray">
              <span>{progress.step} / {progress.total}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
          </div>

          {/* Hint */}
          <p className="text-brand-gray text-sm mt-8">
            أنشئنا تصاميم مخصصة بناءً على اختياراتك
          </p>
        </div>

        {/* CSS Animation */}
        <style>{`
          @keyframes orbit {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </KioskLayout>
  );
};

export default GeneratePage;
