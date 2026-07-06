import React from 'react';

interface GeometricStripProps {
  variant?: 'full' | 'compact' | 'thin';
  className?: string;
}

export const GeometricStrip: React.FC<GeometricStripProps> = ({
  variant = 'full',
  className = '',
}) => {
  const heights = {
    full: 'h-16',
    compact: 'h-8',
    thin: 'h-4',
  };

  return (
    <div className={`w-full overflow-hidden ${heights[variant]} ${className}`}>
      <div
        className="h-full w-full"
        style={{
          background: `repeating-linear-gradient(
            45deg,
            #FF5A00,
            #FF5A00 15px,
            #AEB5BC 15px,
            #AEB5BC 30px
          )`,
        }}
      />
    </div>
  );
};

interface GeometricPatternProps {
  opacity?: number;
  className?: string;
}

export const GeometricBackground: React.FC<GeometricPatternProps> = ({
  opacity = 0.05,
  className = '',
}) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        opacity,
        background: `repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 20px,
          rgba(255, 90, 0, 0.1) 20px,
          rgba(255, 90, 0, 0.1) 40px
        )`,
      }}
    />
  );
};

export const GeometricSidePattern: React.FC<{ position?: 'left' | 'right' }> = ({
  position = 'right',
}) => {
  const positionStyles = position === 'right' ? 'right-0' : 'left-0';

  return (
    <div
      className={`absolute top-0 bottom-0 w-24 ${positionStyles} pointer-events-none overflow-hidden`}
      style={{
        opacity: 0.1,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(
            45deg,
            #FF5A00,
            #FF5A00 10px,
            transparent 10px,
            transparent 20px
          )`,
        }}
      />
    </div>
  );
};

export const GeometricCorner: React.FC<{ position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' }> = ({
  position = 'top-right',
}) => {
  const positionStyles = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
  };

  return (
    <div
      className={`absolute w-32 h-32 ${positionStyles[position]} pointer-events-none overflow-hidden`}
      style={{ opacity: 0.15 }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(
            45deg,
            #FF5A00,
            #FF5A00 12px,
            #AEB5BC 12px,
            #AEB5BC 24px
          )`,
          transform: position.includes('left') ? 'scaleX(-1)' : 'none',
        }}
      />
    </div>
  );
};

interface DividerWithPatternProps {
  className?: string;
}

export const DividerWithPattern: React.FC<DividerWithPatternProps> = ({
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex-1 h-px bg-brand-gray/30" />
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-brand-orange rotate-45" />
        <div className="w-2 h-2 bg-brand-gray rotate-45" />
        <div className="w-2 h-2 bg-brand-orange rotate-45" />
      </div>
      <div className="flex-1 h-px bg-brand-gray/30" />
    </div>
  );
};

export const GeometricLoadingPattern: React.FC = () => {
  return (
    <div className="relative w-full h-2 overflow-hidden rounded-full bg-brand-gray/20">
      <div
        className="absolute inset-0 animate-shimmer"
        style={{
          background: `linear-gradient(
            90deg,
            transparent 0%,
            #FF5A00 50%,
            transparent 100%
          )`,
          backgroundSize: '200% 100%',
        }}
      />
    </div>
  );
};

export const PatternDecoration: React.FC<{ variant?: 'circle' | 'diamond' }> = ({
  variant = 'diamond',
}) => {
  if (variant === 'circle') {
    return (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-brand-orange" />
        <div className="w-2 h-2 rounded-full bg-brand-gray" />
        <div className="w-1 h-1 rounded-full bg-brand-orange/50" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 bg-brand-orange rotate-45" />
      <div className="w-2 h-2 bg-brand-gray rotate-45" />
      <div className="w-1 h-1 bg-brand-orange/50 rotate-45" />
    </div>
  );
};
