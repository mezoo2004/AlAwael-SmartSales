import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  icon,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-lg font-bold text-brand-dark mb-3">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-gray">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full min-h-touch px-6 py-4 rounded-xl
            border-2 bg-white text-brand-dark text-lg
            transition-all duration-300
            focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 outline-none
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-brand-gray/30'}
            ${icon ? 'pr-14' : ''}
            ${className}
          `}
          dir="rtl"
          {...props}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-500 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-brand-gray">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-lg font-bold text-brand-dark mb-3">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full min-h-[140px] px-6 py-4 rounded-xl
          border-2 bg-white text-brand-dark text-lg
          transition-all duration-300 resize-none
          focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 outline-none
          ${error ? 'border-red-500' : 'border-brand-gray/30'}
          ${className}
        `}
        dir="rtl"
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm text-red-500 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-brand-gray">{helperText}</p>
      )}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-lg font-bold text-brand-dark mb-3">
          {label}
        </label>
      )}
      <select
        className={`
          w-full min-h-touch px-6 py-4 rounded-xl
          border-2 bg-white text-brand-dark text-lg
          transition-all duration-300 cursor-pointer
          focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 outline-none
          ${error ? 'border-red-500' : 'border-brand-gray/30'}
          ${className}
        `}
        dir="rtl"
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-2 text-sm text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
};

export default Input;
