import React from 'react';

/**
 * Company logo for the showroom kiosk.
 * Uses the official brand mark with no background container.
 * No background box; only a very soft premium shadow.
 */
export const BrandLogo: React.FC<{
  className?: string;
  priority?: boolean;
}> = ({ className = '', priority = false }) => {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <img
        src="/brand/logo.png"
        alt="أول الأوائل"
        width={400}
        height={300}
        decoding={priority ? 'sync' : 'async'}
        className="w-[230px] sm:w-[240px] md:w-[280px] lg:w-[340px] xl:w-[620px] h-auto xl:h-[329px] object-contain select-none brand-logo-fade"
        style={{
          filter: 'drop-shadow(0 12px 24px rgba(41, 45, 50, 0.12))',
        }}
        onError={(e) => {
          const img = e.currentTarget;
          if (!img.dataset.fallback) {
            img.dataset.fallback = '1';
            img.src = '/brand/logo.svg';
          }
        }}
      />
      <style>{`
        @keyframes brand-logo-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .brand-logo-fade {
          animation: brand-logo-fade-in 420ms ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .brand-logo-fade {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Thin angular corner accents inspired by structural facade frames.
 * Orange (#FF5A00) + gray (#AEB5BC) — low opacity, edge placement only.
 */
export const ArchitecturalCorner: React.FC<{
  position: 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
}> = ({ position }) => {
  const placement: Record<typeof position, string> = {
    'top-start': 'top-0 start-0',
    'top-end': 'top-0 end-0',
    'bottom-start': 'bottom-0 start-0',
    'bottom-end': 'bottom-0 end-0',
  };

  const flipX = position.includes('end');
  const flipY = position.includes('bottom');

  return (
    <div
      className={`absolute ${placement[position]} w-44 h-44 md:w-64 md:h-64 lg:w-72 lg:h-72 pointer-events-none z-[1]`}
      aria-hidden
    >
      <svg
        viewBox="0 0 220 220"
        className="w-full h-full opacity-[0.2]"
        style={{
          transform: `scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})`,
        }}
      >
        {/* Outer structural angle */}
        <path
          d="M8 8 L168 8 L168 22 L22 22 L22 168 L8 168 Z"
          fill="none"
          stroke="#FF5A00"
          strokeWidth="1.4"
        />
        {/* Nested frame */}
        <path
          d="M22 22 L132 22 L132 34 L34 34 L34 132 L22 132 Z"
          fill="none"
          stroke="#AEB5BC"
          strokeWidth="1.15"
        />
        {/* Diagonal architectural ribs */}
        <path d="M34 34 L78 78" stroke="#AEB5BC" strokeWidth="1" opacity="0.85" />
        <path d="M48 34 L92 78" stroke="#FF5A00" strokeWidth="0.9" opacity="0.55" />
        <path d="M34 48 L78 92" stroke="#AEB5BC" strokeWidth="0.9" opacity="0.7" />
        {/* Vertical mullions */}
        <path d="M52 34 L52 110" stroke="#292D32" strokeWidth="0.75" opacity="0.35" />
        <path d="M70 34 L70 96" stroke="#292D32" strokeWidth="0.75" opacity="0.28" />
        {/* Accent ticks */}
        <path d="M34 34 L68 34" stroke="#FF5A00" strokeWidth="1.2" opacity="0.75" />
        <path d="M34 34 L34 68" stroke="#AEB5BC" strokeWidth="1.2" />
      </svg>
    </div>
  );
};

/**
 * Extremely subtle facade / structural line pattern (~3% opacity).
 */
export const ArchitecturalPattern: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none z-[1] opacity-[0.03]" aria-hidden>
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="welcome-facade-grid" width="108" height="132" patternUnits="userSpaceOnUse">
          <path d="M0 0 H108" stroke="#292D32" strokeWidth="0.55" />
          <path d="M0 44 H108" stroke="#292D32" strokeWidth="0.35" />
          <path d="M0 88 H108" stroke="#292D32" strokeWidth="0.35" />
          <path d="M27 0 V132" stroke="#292D32" strokeWidth="0.45" />
          <path d="M54 0 V132" stroke="#AEB5BC" strokeWidth="0.4" />
          <path d="M81 0 V132" stroke="#292D32" strokeWidth="0.45" />
          <path d="M0 0 L27 44" stroke="#FF5A00" strokeWidth="0.3" opacity="0.65" />
          <path d="M54 88 L81 132" stroke="#FF5A00" strokeWidth="0.3" opacity="0.45" />
          <rect x="27" y="44" width="27" height="44" fill="none" stroke="#AEB5BC" strokeWidth="0.3" opacity="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#welcome-facade-grid)" />
    </svg>
  </div>
);

/**
 * Soft edge ribs — thin architectural lines along screen edges only.
 */
const EdgeRibs: React.FC = () => (
  <>
    <div
      className="absolute top-[18%] bottom-[18%] start-0 w-px opacity-[0.12] pointer-events-none z-[1]"
      style={{ background: 'linear-gradient(180deg, transparent, #AEB5BC 20%, #FF5A00 50%, #AEB5BC 80%, transparent)' }}
      aria-hidden
    />
    <div
      className="absolute top-[18%] bottom-[18%] end-0 w-px opacity-[0.12] pointer-events-none z-[1]"
      style={{ background: 'linear-gradient(180deg, transparent, #AEB5BC 20%, #FF5A00 50%, #AEB5BC 80%, transparent)' }}
      aria-hidden
    />
  </>
);

/**
 * Premium architectural hero atmosphere:
 * uses the supplied welcome background image behind the kiosk content.
 */
export const WelcomeAtmosphere: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
    {/* Actual supplied architectural background */}
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: "url('/brand/welcome-background.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: 0.45,
      }}
    />

    {/* Minimal white overlay for foreground readability */}
    <div
      className="absolute inset-0"
      style={{
        backgroundColor: 'rgba(255,255,255,0.12)',
      }}
    />

    <ArchitecturalPattern />
    <EdgeRibs />
  </div>
);

export default WelcomeAtmosphere;
