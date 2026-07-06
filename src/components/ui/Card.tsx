import React from 'react';
import { Check } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  selected = false,
  interactive = false,
  padding = 'md',
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`
        bg-white rounded-2xl
        border-2 transition-all duration-300
        ${paddingStyles[padding]}
        ${selected
          ? 'border-brand-orange ring-4 ring-brand-orange/10 shadow-xl'
          : 'border-brand-light/50 shadow-lg'
        }
        ${interactive && !selected
          ? 'hover:border-brand-orange/30 hover:shadow-xl cursor-pointer'
          : ''
        }
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface ImageCardProps {
  image?: string;
  title: string;
  subtitle?: string;
  selected?: boolean;
  onClick?: () => void;
  showCheckMark?: boolean;
  className?: string;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  image,
  title,
  subtitle,
  selected = false,
  onClick,
  showCheckMark = true,
  className = '',
}) => {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl
        border-2 transition-all duration-300 cursor-pointer
        ${selected
          ? 'border-brand-orange ring-4 ring-brand-orange/10 scale-[1.02]'
          : 'border-brand-light/50 hover:border-brand-orange/40 hover:shadow-lg'
        }
        ${className}
      `}
      onClick={onClick}
    >
      {image && (
        <div className="aspect-[4/3] overflow-hidden bg-brand-light">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500"
            style={{ transform: selected ? 'scale(1.05)' : 'scale(1)' }}
          />
        </div>
      )}

      <div className="p-4 bg-white">
        <h3 className={`
          text-lg font-bold text-brand-dark
          ${selected ? 'text-brand-orange' : ''}
        `}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-brand-gray mt-1">{subtitle}</p>
        )}
      </div>

      {selected && showCheckMark && (
        <div className="absolute top-3 left-3 w-8 h-8 bg-brand-orange rounded-full flex items-center justify-center shadow-lg">
          <Check className="w-5 h-5 text-white" strokeWidth={3} />
        </div>
      )}
    </div>
  );
};

interface ColorSwatchProps {
  label: string;
  color: string;
  selected?: boolean;
  onClick?: () => void;
  hex?: string;
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  label,
  color,
  selected = false,
  onClick,
  hex,
}) => {
  return (
    <div
      className={`
        flex flex-col items-center gap-2 cursor-pointer
        transition-all duration-300 p-3 rounded-xl
        ${selected
          ? 'bg-brand-orange/5 ring-2 ring-brand-orange'
          : 'hover:bg-brand-light'
        }
      `}
      onClick={onClick}
    >
      <div
        className={`
          w-16 h-16 rounded-full shadow-inner border-4
          transition-transform duration-300
          ${selected ? 'scale-110 border-brand-orange' : 'border-white'}
        `}
        style={{
          backgroundColor: hex || color,
          boxShadow: selected ? '0 0 0 4px rgba(255, 90, 0, 0.2)' : 'inset 0 2px 4px rgba(0,0,0,0.1)',
        }}
      />
      <span className={`
        text-sm font-medium
        ${selected ? 'text-brand-orange font-bold' : 'text-brand-gray'}
      `}>
        {label}
      </span>
    </div>
  );
};

export default Card;
