import React, { useState } from 'react';
import { Delete, Check } from 'lucide-react';

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  maxLength?: number;
  placeholder?: string;
  className?: string;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  value,
  onChange,
  onSubmit,
  maxLength = 15,
  placeholder = '0',
  className = '',
}) => {
  const handleKeyPress = (key: string) => {
    if (key === 'delete') {
      onChange(value.slice(0, -1));
    } else if (key === 'clear') {
      onChange('');
    } else if (value.length < maxLength) {
      onChange(value + key);
    }
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['delete', '0', 'clear'],
  ];

  return (
    <div className={`w-full max-w-sm mx-auto ${className}`}>
      <div className="bg-brand-light rounded-2xl p-4 mb-4 text-center">
        <div className="text-4xl font-bold text-brand-dark min-h-[56px] flex items-center justify-center text-left direction-ltr">
          {value || <span className="text-brand-gray text-2xl">{placeholder}</span>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {keys.map((row, rowIndex) =>
          row.map((key) => (
            <button
              key={key}
              onClick={() => handleKeyPress(key)}
              className={`
                min-h-touch rounded-xl font-bold text-2xl
                transition-all duration-200 active:scale-95
                ${key === 'delete'
                  ? 'bg-brand-gray/20 text-brand-gray hover:bg-brand-gray/30'
                  : key === 'clear'
                    ? 'bg-red-100 text-red-500 hover:bg-red-200'
                    : 'bg-white text-brand-dark hover:bg-brand-light border-2 border-brand-gray/20 shadow'
                }
              `}
            >
              {key === 'delete' ? (
                <Delete className="w-6 h-6 mx-auto" />
              ) : key === 'clear' ? (
                'مسح'
              ) : (
                key
              )}
            </button>
          ))
        )}
      </div>

      {onSubmit && (
        <button
          onClick={onSubmit}
          disabled={!value}
          className={`
            w-full mt-4 min-h-touch rounded-xl font-bold text-xl
            transition-all duration-200
            ${value
              ? 'bg-brand-orange-gradient text-white hover:shadow-lg'
              : 'bg-brand-gray/20 text-brand-gray cursor-not-allowed'
            }
          `}
        >
          <Check className="w-6 h-6 mx-auto" />
        </button>
      )}
    </div>
  );
};

export default NumericKeypad;
