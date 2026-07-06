import React from 'react';

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
  className?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'جاري التحميل...',
  submessage,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] ${className}`}>
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-brand-gray/20" />
        <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-brand-orange border-t-transparent animate-spin" />
      </div>
      <p className="text-xl font-bold text-brand-dark mt-6">{message}</p>
      {submessage && (
        <p className="text-sm text-brand-gray mt-2">{submessage}</p>
      )}
    </div>
  );
};

interface LoadingDotsProps {
  className?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({ className = '' }) => {
  return (
    <div className={`flex gap-2 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-3 h-3 rounded-full bg-brand-orange animate-pulse"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
};

interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  rounded = 'lg',
  className = '',
}) => {
  const roundedStyles = {
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  return (
    <div
      className={`bg-brand-light animate-pulse ${roundedStyles[rounded]} ${className}`}
      style={{ width, height }}
    />
  );
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'حدث خطأ',
  message = 'لم نتمكن من إكمال العملية. يرجى المحاولة مرة أخرى.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-brand-dark mb-2">{title}</h3>
      <p className="text-brand-gray text-lg mb-6 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-primary"
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      {icon && (
        <div className="w-20 h-20 rounded-full bg-brand-light flex items-center justify-center mb-6">
          {icon}
        </div>
      )}
      <h3 className="text-2xl font-bold text-brand-dark mb-2">{title}</h3>
      {message && (
        <p className="text-brand-gray text-lg mb-6 max-w-md">{message}</p>
      )}
      {action}
    </div>
  );
};

export default LoadingScreen;
