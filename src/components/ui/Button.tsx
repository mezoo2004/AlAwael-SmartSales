import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'lg',
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'start',
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center justify-center gap-3
    rounded-xl font-bold
    transition-all duration-300
    focus:outline-none focus:ring-4 focus:ring-brand-orange/20
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
  `;

  const variants = {
    primary: `
      bg-brand-orange-gradient text-white
      shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
    `,
    secondary: `
      bg-white text-brand-dark border-2 border-brand-gray/40
      hover:border-brand-orange hover:text-brand-orange
    `,
    ghost: `
      bg-transparent text-brand-gray
      hover:text-brand-orange hover:bg-brand-orange/5
    `,
    outline: `
      bg-transparent text-brand-orange border-2 border-brand-orange
      hover:bg-brand-orange hover:text-white
    `,
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm min-h-[40px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[60px]',
    xl: 'px-10 py-5 text-xl min-h-[70px]',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'start' && icon}
          {children}
          {icon && iconPosition === 'end' && icon}
        </>
      )}
    </button>
  );
};

export default Button;
