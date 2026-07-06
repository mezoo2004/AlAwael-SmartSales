import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { KioskLayout } from '../layout';
import { Button, ImageCard, ColorSwatch, TextArea, Input, NumericKeypad, ImageUpload, MultiImageUpload } from '../ui';
import { useSession } from '../../context/SessionContext';
import { getQuestionsByDepartment } from '../../data';
import { Question, QuestionOption, Measurement } from '../../types';

interface QuestionScreenProps {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  onNext: () => void;
  onBack: () => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
}

export const QuestionScreen: React.FC<QuestionScreenProps> = ({
  question,
  value,
  onChange,
  onNext,
  onBack,
  isFirstQuestion,
  isLastQuestion,
}) => {
  const isRequired = question.required;
  const hasValue = value !== undefined && value !== null && value !== '';

  const handleNext = () => {
    if (!isRequired || hasValue) {
      onNext();
    }
  };

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'single-choice':
      case 'visual-cards':
        return (
          <VisualCardsQuestion
            question={question}
            value={value as string | undefined}
            onChange={onChange}
          />
        );

      case 'multiple-choice':
        return (
          <MultipleChoiceQuestion
            question={question}
            value={value as string[] | undefined}
            onChange={onChange}
          />
        );

      case 'color-swatches':
        return (
          <ColorSwatchesQuestion
            question={question}
            value={value as string | undefined}
            onChange={onChange}
          />
        );

      case 'yes-no':
        return (
          <YesNoQuestion
            question={question}
            value={value as boolean | undefined}
            onChange={onChange}
          />
        );

      case 'text-input':
        return (
          <TextQuestion
            question={question}
            value={value as string | undefined}
            onChange={onChange}
          />
        );

      case 'text-area':
        return (
          <TextAreaQuestion
            question={question}
            value={value as string | undefined}
            onChange={onChange}
          />
        );

      case 'number-input':
        return (
          <NumberQuestion
            question={question}
            value={value as number | undefined}
            onChange={onChange}
          />
        );

      case 'measurement-input':
        return (
          <MeasurementQuestion
            question={question}
            value={(value as Measurement) || { unit: 'cm' }}
            onChange={onChange}
          />
        );

      case 'style-selection':
        return (
          <StyleSelectionQuestion
            question={question}
            value={value as string | undefined}
            onChange={onChange}
          />
        );

      case 'budget-range':
        return (
          <BudgetRangeQuestion
            question={question}
            value={value as string | undefined}
            onChange={onChange}
          />
        );

      case 'date-input':
        return (
          <DateInputQuestion
            question={question}
            value={value as string | undefined}
            onChange={onChange}
          />
        );

      case 'image-upload':
        return (
          <ImageUploadQuestion
            question={question}
            value={value as string | undefined}
            onChange={onChange}
          />
        );

      case 'multi-image-upload':
        return (
          <MultiImageUploadQuestion
            question={question}
            value={value as string[] | undefined}
            onChange={onChange}
          />
        );

      default:
        return <div>نوع السؤال غير مدعوم</div>;
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
      {/* Question Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-3">
          {question.title}
        </h2>
        {question.subtitle && (
          <p className="text-xl text-brand-gray">{question.subtitle}</p>
        )}
      </div>

      {/* Question Content */}
      <div className="flex-1 flex flex-col justify-center mb-8">
        {renderQuestionContent()}
      </div>

      {/* Navigation */}
      <div className="flex gap-4 justify-center pb-8">
        {!isFirstQuestion && (
          <Button
            variant="secondary"
            size="lg"
            onClick={onBack}
          >
            <ArrowRight className="w-5 h-5 ml-2" />
            السابق
          </Button>
        )}
        <Button
          size="lg"
          onClick={handleNext}
          disabled={isRequired && !hasValue}
          className="min-w-[200px]"
        >
          {isLastQuestion ? 'مراجعة الطلب' : 'التالي'}
          {!isLastQuestion && <ArrowLeft className="w-5 h-5 mr-2" />}
        </Button>
      </div>
    </div>
  );
};

// Question Type Components
const VisualCardsQuestion: React.FC<{
  question: Question;
  value: string | undefined;
  onChange: (value: unknown) => void;
}> = ({ question, value, onChange }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {question.options?.map((option) => (
      <ImageCard
        key={option.id}
        image={option.image}
        title={option.label}
        subtitle={option.description}
        selected={value === option.value}
        onClick={() => onChange(option.value)}
      />
    ))}
  </div>
);

const MultipleChoiceQuestion: React.FC<{
  question: Question;
  value: string[] | undefined;
  onChange: (value: unknown) => void;
}> = ({ question, value = [], onChange }) => {
  const selected = Array.isArray(value) ? value : [];

  const handleChange = (optionValue: string) => {
    if (selected.includes(optionValue)) {
      onChange(selected.filter(v => v !== optionValue));
    } else {
      onChange([...selected, optionValue]);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {question.options?.map((option) => (
        <div
          key={option.id}
          onClick={() => handleChange(option.value)}
          className={`
            p-6 rounded-2xl cursor-pointer transition-all duration-300
            ${selected.includes(option.value)
              ? 'bg-brand-orange/10 border-2 border-brand-orange'
              : 'bg-white border-2 border-brand-gray/30 hover:border-brand-orange/40'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div className={`
              w-6 h-6 rounded-md border-2 flex items-center justify-center
              ${selected.includes(option.value)
                ? 'bg-brand-orange border-brand-orange'
                : 'border-brand-gray/40'
              }
            `}>
              {selected.includes(option.value) && (
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              )}
            </div>
            <span className="text-lg font-medium text-brand-dark">
              {option.label}
            </span>
          </div>
          {option.description && (
            <p className="text-sm text-brand-gray mt-2">{option.description}</p>
          )}
        </div>
      ))}
    </div>
  );
};

const ColorSwatchesQuestion: React.FC<{
  question: Question;
  value: string | undefined;
  onChange: (value: unknown) => void;
}> = ({ question, value, onChange }) => {
  const colorHexMap: Record<string, string> = {
    white: '#FFFFFF',
    black: '#1A1A1A',
    gray: '#6B7280',
    beige: '#D4B896',
    cream: '#FFFDD0',
    gold: '#FFC107',
    green: '#4CAF50',
    silver: '#C0C0C0',
    chrome: '#DEE1E6',
    'matte-black': '#2D2D2D',
    copper: '#B87333',
    'light-wood': '#DEB887',
    'dark-wood': '#654321',
    'brushed-steel': '#A8A9AD',
    'metal-gray': '#71797E',
    custom: '#FF5A00',
  };

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {question.options?.map((option) => (
        <ColorSwatch
          key={option.id}
          label={option.label}
          color={option.value}
          hex={colorHexMap[option.value] || '#CCCCCC'}
          selected={value === option.value}
          onClick={() => onChange(option.value)}
        />
      ))}
    </div>
  );
};

const YesNoQuestion: React.FC<{
  question: Question;
  value: boolean | undefined;
  onChange: (value: unknown) => void;
}> = ({ question, value, onChange }) => (
  <div className="flex gap-6 justify-center">
    <Button
      variant={value === true ? 'primary' : 'secondary'}
      size="xl"
      onClick={() => onChange(true)}
      className="min-w-[180px]"
    >
      نعم
      {value === true && <Check className="w-5 h-5 mr-2" />}
    </Button>
    <Button
      variant={value === false ? 'primary' : 'secondary'}
      size="xl"
      onClick={() => onChange(false)}
      className="min-w-[180px]"
    >
      لا
      {value === false && <Check className="w-5 h-5 mr-2" />}
    </Button>
  </div>
);

const TextQuestion: React.FC<{
  question: Question;
  value: string | undefined;
  onChange: (value: unknown) => void;
}> = ({ question, value, onChange }) => (
  <div className="max-w-xl mx-auto">
    <Input
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={question.placeholder}
      className="text-2xl"
    />
  </div>
);

const TextAreaQuestion: React.FC<{
  question: Question;
  value: string | undefined;
  onChange: (value: unknown) => void;
}> = ({ question, value, onChange }) => (
  <div className="max-w-2xl mx-auto">
    <TextArea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={question.placeholder}
      className="text-xl"
      rows={4}
    />
  </div>
);

const NumberQuestion: React.FC<{
  question: Question;
  value: number | undefined;
  onChange: (value: unknown) => void;
}> = ({ question, value, onChange }) => {
  const [inputValue, setInputValue] = useState(value?.toString() || '');

  const handleKeypadChange = (val: string) => {
    setInputValue(val);
    onChange(parseInt(val) || undefined);
  };

  return (
    <div className="max-w-md mx-auto">
      <NumericKeypad
        value={inputValue}
        onChange={handleKeypadChange}
        placeholder="0"
      />
    </div>
  );
};

const MeasurementQuestion: React.FC<{
  question: Question;
  value: Measurement;
  onChange: (value: unknown) => void;
}> = ({ question, value, onChange }) => {
  const updateField = (field: keyof Measurement, val: number | string) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-brand-gray/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-lg font-bold text-brand-dark mb-3">العرض</label>
            <div className="relative">
              <input
                type="number"
                value={value.width || ''}
                onChange={(e) => updateField('width', parseFloat(e.target.value) || 0)}
                className="input text-2xl text-center"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-lg font-bold text-brand-dark mb-3">الارتفاع</label>
            <div className="relative">
              <input
                type="number"
                value={value.height || ''}
                onChange={(e) => updateField('height', parseFloat(e.target.value) || 0)}
                className="input text-2xl text-center"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-lg font-bold text-brand-dark mb-3">العمق</label>
            <div className="relative">
              <input
                type="number"
                value={value.depth || ''}
                onChange={(e) => updateField('depth', parseFloat(e.target.value) || 0)}
                className="input text-2xl text-center"
                placeholder="0"
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-lg font-bold text-brand-dark mb-3">وحدة القياس</label>
          <div className="flex gap-4">
            {['cm', 'm', 'inches'].map((unit) => (
              <button
                key={unit}
                onClick={() => updateField('unit', unit)}
                className={`
                  flex-1 py-4 rounded-xl font-bold text-lg transition-all
                  ${value.unit === unit
                    ? 'bg-brand-orange text-white'
                    : 'bg-brand-light text-brand-gray hover:bg-brand-gray/20'
                  }
                `}
              >
                {unit === 'cm' ? 'سنتيمتر' : unit === 'm' ? 'متر' : 'إنش'}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={() => onChange({ unit: 'cm', skip: true })}
            className="text-brand-orange hover:underline font-medium"
          >
            لا أعرف المقاسات
          </button>
        </div>
      </div>
    </div>
  );
};

const StyleSelectionQuestion: React.FC<{
  question: Question;
  value: string | undefined;
  onChange: (value: unknown) => void;
}> = ({ question, value, onChange }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {question.options?.map((option) => (
      <ImageCard
        key={option.id}
        image={option.image}
        title={option.label}
        selected={value === option.value}
        onClick={() => onChange(option.value)}
      />
    ))}
  </div>
);

const BudgetRangeQuestion: React.FC<{
  question: Question;
  value: string | undefined;
  onChange: (value: unknown) => void;
}> = ({ question, value, onChange }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
    {question.options?.map((option) => (
      <div
        key={option.id}
        onClick={() => onChange(option.value)}
        className={`
          p-8 rounded-2xl cursor-pointer transition-all duration-300 text-center
          ${value === option.value
            ? 'bg-brand-orange/10 border-2 border-brand-orange shadow-lg'
            : 'bg-white border-2 border-brand-gray/30 hover:border-brand-orange/40'
          }
        `}
      >
        <h3 className="text-2xl font-bold text-brand-dark mb-2">{option.label}</h3>
        {option.description && (
          <p className="text-brand-gray">{option.description}</p>
        )}
      </div>
    ))}
  </div>
);

const DateInputQuestion: React.FC<{
  question: Question;
  value: string | undefined;
  onChange: (value: unknown) => void;
}> = ({ question, value, onChange }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
    {question.options?.map((option) => (
      <div
        key={option.id}
        onClick={() => onChange(option.value)}
        className={`
          p-6 rounded-2xl cursor-pointer transition-all duration-300 text-center
          ${value === option.value
            ? 'bg-brand-orange/10 border-2 border-brand-orange shadow-lg'
            : 'bg-white border-2 border-brand-gray/30 hover:border-brand-orange/40'
          }
        `}
      >
        <span className="text-xl font-bold text-brand-dark">{option.label}</span>
      </div>
    ))}
  </div>
);

const ImageUploadQuestion: React.FC<{
  question: Question;
  value: string | undefined;
  onChange: (value: unknown) => void;
}> = ({ question, value, onChange }) => (
  <div className="max-w-2xl mx-auto">
    <ImageUpload
      value={value}
      onChange={onChange}
      label={question.title}
      description={question.subtitle}
    />
  </div>
);

const MultiImageUploadQuestion: React.FC<{
  question: Question;
  value: string[] | undefined;
  onChange: (value: unknown) => void;
}> = ({ question, value, onChange }) => (
  <div className="max-w-4xl mx-auto">
    <MultiImageUpload
      value={value as string[]}
      onChange={onChange}
      label={question.title}
      description={question.subtitle}
    />
  </div>
);

export default QuestionScreen;
