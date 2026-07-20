import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Button, TextArea, Input, NumericKeypad, ImageUpload, MultiImageUpload } from '../ui';
import { Question, Measurement } from '../../types';

interface QuestionScreenProps {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  onNext: () => void;
  onBack: () => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  currentQuestionIndex: number;
  totalQuestions: number;
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
  const questionVisual = getQuestionVisual(question);

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
    <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4 md:px-6 py-6 md:py-8">
      <div key={question.id} className="question-card-enter bg-white rounded-[24px] shadow-[0_26px_80px_rgba(41,45,50,0.12)] border border-brand-gray/10 p-5 md:p-9 lg:p-11 mb-7 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_34px_90px_rgba(41,45,50,0.14)]">
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-10">
          <div className="mx-auto mb-5 h-[72px] w-[72px] rounded-[22px] bg-brand-light shadow-[0_16px_34px_rgba(41,45,50,0.12)] overflow-hidden ring-1 ring-brand-gray/10">
            <img
              src={questionVisual}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-brand-dark mb-3 leading-tight">
            {question.title}
          </h2>
          <p className="text-base md:text-xl text-brand-gray leading-relaxed">
            {getHelperText(question)}
          </p>
        </div>

        <div className="min-h-[240px] flex flex-col justify-center">
          {renderQuestionContent()}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pb-8">
        <Button
          variant="secondary"
          size="lg"
          onClick={onBack}
          disabled={isFirstQuestion}
          className="min-w-[180px]"
        >
          <ArrowRight className="w-5 h-5 ml-2" />
          السابق
        </Button>
        <Button
          size="lg"
          onClick={handleNext}
          disabled={isRequired && !hasValue}
          className="min-w-[220px]"
        >
          {isLastQuestion ? 'مراجعة الطلب' : 'التالي'}
          {!isLastQuestion && <ArrowLeft className="w-5 h-5 mr-2" />}
        </Button>
      </div>

      <style>{`
        @keyframes question-card-in {
          from { opacity: 0; transform: translateY(14px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .question-card-enter {
          animation: question-card-in 360ms ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .question-card-enter {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

// Question Type Components
const hashKey = (value: string): number => (
  value.split('').reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0, 7)
);

const getQuestionnaireImagePath = (key: string): string => {
  const slug = key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `/images/questionnaire/${hashKey(key).toString(36)}-${slug}.svg`;
};

const getQuestionImageKey = (question: Question): string => {
  const query = QUESTION_QUERIES[question.id] || `${DEPARTMENT_QUERIES[question.departmentId]} ${question.title}`;
  return `question:${question.departmentId}:${question.id}:${hashKey(query)}`;
};

const getOptionImageKey = (question: Question, optionValue: string): string => {
  const optionKey = `${question.id}:${optionValue}`;
  const scopedOptionKey = `${question.departmentId}:${question.id}:${optionValue}`;
  const query =
    OPTION_QUERIES[scopedOptionKey] ||
    OPTION_QUERIES[optionKey] ||
    `${QUESTION_QUERIES[question.id] || DEPARTMENT_QUERIES[question.departmentId]} ${optionValue}`;

  return `option:${question.departmentId}:${question.id}:${optionValue}:${hashKey(query)}`;
};

const DEPARTMENT_QUERIES: Record<Question['departmentId'], string> = {
  washbasins: 'designer wash basin luxury bathroom',
  'wpc-doors': 'luxury interior doors showroom',
  marble: 'natural marble slabs stone showroom',
  aluminum: 'modern aluminum windows architecture',
  glass: 'luxury glass facade architecture',
};

const QUESTION_QUERIES: Record<string, string> = {
  service_type: 'luxury bathroom vanity service',
  installation_location: 'premium bathroom interior location',
  basin_count: 'designer double wash basin',
  arrangement: 'custom bathroom vanity arrangement',
  installation_type: 'wall mounted luxury wash basin',
  shape: 'curved designer vanity shape',
  dimensions_known: 'premium measuring decision interior site',
  measurements: 'architect measuring interior space',
  unknown_measurements: 'measuring tape interior planning',
  measurement_visit: 'site measurement visit interior design',
  design_style: 'modern classic luxury interior styles',
  marble_color: 'marble color palette slabs',
  marble_pattern: 'marble veining pattern slab',
  cabinet_config: 'luxury bathroom vanity cabinets',
  cabinet_color: 'cabinet color material palette',
  mirror_type: 'luxury bathroom mirror design',
  mirror_lighting: 'backlit led bathroom mirror',
  faucet_type: 'designer bathroom faucet',
  accessories_finish: 'premium metal hardware finishes',
  general_lighting: 'luxury led bathroom lighting',
  budget: 'minimal financial planning desk',
  implementation_date: 'luxury project calendar planning',
  notes: 'interior design notes notebook',
  site_image: 'home renovation site photo',
  inspiration_images: 'interior moodboard inspiration',
  project_type: 'luxury villa apartment office exterior',
  door_type: 'luxury entrance and interior doors',
  door_count: 'row of modern interior doors',
  opening_direction: 'modern door opening direction',
  door_mechanism: 'sliding folding hinged door mechanism',
  door_design: 'premium decorative door design',
  door_color: 'door wood color samples',
  frame_type: 'modern door frame detail',
  frame_color: 'metal door frame finish samples',
  handle_type: 'luxury door handle styles',
  handle_finish: 'premium door handle finish',
  sound_insulation: 'quiet acoustic interior room',
  moisture_resistance: 'waterproof bathroom door',
  lock_type: 'smart digital door lock',
  usage: 'marble floor wall stairs interior',
  stone_type: 'natural engineered stone slabs',
  color: 'elegant marble color palette',
  veining: 'dramatic marble veins slab',
  finish: 'polished honed marble surface',
  thickness: 'thick marble slab edge',
  location: 'indoor outdoor stone installation',
  product_type: 'aluminum windows doors facade',
  glass_type: 'clear tinted double glass samples',
  insulation: 'thermal insulated aluminum window',
  opening_method: 'sliding folding fixed aluminum window',
  glass_thickness: 'thick tempered glass edge',
  glass_finish: 'clear frosted smoky glass samples',
  hardware_finish: 'glass hardware metal finishes',
  privacy_level: 'privacy frosted glass panel',
};

const OPTION_QUERIES: Record<string, string> = {
  'dimensions_known:known': 'premium measuring tape blueprint dimensions',
  'dimensions_known:unknown': 'location pin site measurement visit',
  'service_type:new': 'new luxury wash basin vanity',
  'service_type:renewal': 'renovated luxury bathroom vanity',
  'service_type:marble-only': 'marble vanity countertop replacement',
  'service_type:cabinets-only': 'premium bathroom vanity cabinets',
  'service_type:full-design': 'complete luxury bathroom design',
  'installation_location:main-bathroom': 'luxury master bathroom',
  'installation_location:guest-bathroom': 'premium guest bathroom',
  'installation_location:bedroom': 'bedroom vanity wash basin',
  'installation_location:majlis': 'luxury majlis wash basin',
  'installation_location:restaurant': 'restaurant bathroom vanity',
  'installation_location:commercial': 'commercial restroom vanity',
  'basin_count:1': 'single designer wash basin',
  'basin_count:2': 'double designer wash basin',
  'basin_count:3': 'triple commercial wash basin',
  'basin_count:4+': 'multiple luxury wash basins',
  'arrangement:connected': 'connected double vanity unit',
  'arrangement:separate': 'separate bathroom vanities',
  'installation_type:wall-mounted': 'wall mounted wash basin',
  'installation_type:floor': 'floor standing vanity basin',
  'installation_type:marble-surface': 'marble countertop vanity basin',
  'installation_type:above-counter': 'above counter vessel sink',
  'installation_type:undermount': 'undermount designer basin',
  'installation_type:hotel': 'hotel luxury bathroom vanity',
  'shape:straight': 'straight linear bathroom vanity',
  'shape:corner': 'corner bathroom vanity unit',
  'shape:curved': 'curved designer vanity',
  'shape:custom': 'custom sculptural vanity design',
  'design_style:modern': 'modern luxury interior',
  'design_style:luxury': 'opulent luxury interior',
  'design_style:minimal': 'minimal clean interior design',
  'design_style:hotel': 'five star hotel bathroom',
  'design_style:modern-classic': 'modern classic interior',
  'design_style:industrial': 'industrial bathroom interior',
  'design_style:natural': 'natural stone wood bathroom',
  'design_style:saudi-contemporary': 'contemporary arabic interior',
  'marble_color:white': 'white marble slab palette',
  'marble_color:black': 'black marble slab palette',
  'marble_color:gray': 'gray marble slab palette',
  'marble_color:beige': 'beige marble slab palette',
  'marble_color:green': 'green marble slab palette',
  'marble_pattern:solid': 'solid marble slab',
  'marble_pattern:light-veins': 'light vein marble slab',
  'marble_pattern:bold-veins': 'bold vein marble slab',
  'marble_pattern:strong-natural': 'dramatic natural marble slab',
  'cabinet_config:no-cabinets': 'floating basin no cabinet',
  'cabinet_config:wall-cabinets': 'wall mounted bathroom cabinet',
  'cabinet_config:floor-cabinets': 'floor standing vanity cabinet',
  'cabinet_config:drawers': 'bathroom vanity drawers',
  'cabinet_config:doors': 'bathroom vanity cabinet doors',
  'cabinet_config:drawers-doors': 'vanity drawers and doors',
  'cabinet_color:white': 'white cabinet material palette',
  'cabinet_color:black': 'black cabinet material palette',
  'cabinet_color:gray': 'gray cabinet material palette',
  'cabinet_color:light-wood': 'light wood cabinet texture',
  'cabinet_color:dark-wood': 'dark wood cabinet texture',
  'cabinet_color:beige': 'beige cabinet material palette',
  'mirror_type:none': 'minimal wall without mirror',
  'mirror_type:large': 'large luxury bathroom mirror',
  'mirror_type:two-separate': 'two separate bathroom mirrors',
  'mirror_type:framed': 'framed bathroom mirror',
  'mirror_type:frameless': 'frameless bathroom mirror',
  'mirror_type:round': 'round bathroom mirror',
  'mirror_type:rectangular': 'rectangular bathroom mirror',
  'mirror_type:extended': 'wide extended bathroom mirror',
  'mirror_lighting:none': 'bathroom mirror without lighting',
  'mirror_lighting:led-back': 'backlit led bathroom mirror',
  'mirror_lighting:front': 'front lit bathroom mirror',
  'mirror_lighting:side': 'side sconce mirror lighting',
  'mirror_lighting:hidden': 'hidden led mirror lighting',
  'faucet_type:wall-mounted': 'wall mounted designer faucet',
  'faucet_type:deck': 'deck mounted bathroom faucet',
  'faucet_type:tall': 'tall vessel sink faucet',
  'faucet_type:integrated': 'integrated bathroom faucet',
  'accessories_finish:chrome': 'chrome bathroom hardware finish',
  'accessories_finish:matte-black': 'matte black bathroom hardware',
  'accessories_finish:gold': 'brushed gold bathroom hardware',
  'accessories_finish:copper': 'copper bathroom hardware finish',
  'accessories_finish:metal-gray': 'gunmetal gray hardware finish',
  'general_lighting:warm': 'warm led bathroom lighting',
  'general_lighting:neutral': 'neutral white bathroom lighting',
  'general_lighting:cool': 'cool white bathroom lighting',
  'project_type:villa': 'luxury villa exterior entrance',
  'project_type:apartment': 'modern apartment interior door',
  'project_type:office': 'executive office interior door',
  'project_type:hotel': 'luxury hotel corridor doors',
  'project_type:commercial': 'commercial showroom entrance door',
  'door_type:main-door': 'luxury main entrance door',
  'door_type:bedroom': 'modern bedroom door',
  'door_type:bathroom': 'waterproof bathroom door',
  'door_type:kitchen': 'contemporary kitchen door',
  'door_type:office': 'executive office door',
  'door_type:partition': 'interior partition door',
  'opening_direction:right': 'right hand door swing',
  'opening_direction:left': 'left hand door swing',
  'opening_direction:both': 'double swing doors',
  'door_mechanism:hinged': 'hinged modern door',
  'door_mechanism:sliding': 'sliding interior door',
  'door_mechanism:folding': 'folding interior door',
  'door_design:plain': 'plain minimalist door design',
  'door_design:vertical-lines': 'vertical line door design',
  'door_design:horizontal-lines': 'horizontal line door design',
  'door_design:geometric': 'geometric patterned door',
  'door_design:metal-inserts': 'door with metal inserts',
  'door_design:glass-insert': 'door with glass insert',
  'door_color:white': 'white door finish sample',
  'door_color:black': 'black door finish sample',
  'door_color:gray': 'gray door finish sample',
  'door_color:light-wood': 'light wood door finish',
  'door_color:dark-wood': 'dark wood door finish',
  'frame_type:aluminum': 'aluminum door frame',
  'frame_type:wood': 'wood door frame detail',
  'frame_type:wpc': 'wpc door frame material',
  'frame_type:hidden': 'hidden flush door frame',
  'handle_type:lever': 'lever door handle',
  'handle_type:knob': 'round door knob',
  'handle_type:pull': 'long pull door handle',
  'handle_type:integrated': 'integrated hidden door handle',
  'lock_type:standard': 'standard door lock',
  'lock_type:smart': 'smart door lock',
  'lock_type:digital': 'digital keypad door lock',
  'lock_type:fingerprint': 'fingerprint door lock',
  'usage:floor': 'marble floor interior',
  'usage:wall': 'marble wall cladding',
  'usage:stairs': 'marble staircase',
  'usage:facade': 'stone marble facade',
  'usage:kitchen': 'marble kitchen countertop',
  'usage:vanity': 'marble bathroom vanity',
  'usage:table': 'marble dining table',
  'stone_type:natural': 'natural stone marble slab',
  'stone_type:engineered': 'engineered quartz stone slab',
  'color:white': 'carrara white marble',
  'color:black': 'nero marquina black marble',
  'color:gray': 'gray marble slab',
  'color:beige': 'beige travertine marble',
  'color:cream': 'cream marble slab',
  'color:gold': 'calacatta gold marble',
  'color:green': 'green marble slab',
  'veining:none': 'plain marble slab no veins',
  'veining:light': 'light veined carrara marble',
  'veining:medium': 'medium veined marble slab',
  'veining:bold': 'bold veined marble slab',
  'veining:dramatic': 'dramatic calacatta marble veins',
  'finish:polished': 'polished glossy marble surface',
  'finish:honed': 'honed matte marble surface',
  'finish:leathered': 'leathered textured stone surface',
  'finish:brushed': 'brushed stone finish texture',
  'finish:flamed': 'flamed granite stone texture',
  'thickness:1cm': 'thin marble slab edge',
  'thickness:2cm': 'two centimeter marble slab edge',
  'thickness:3cm': 'thick marble slab edge',
  'location:indoor': 'indoor marble installation',
  'location:outdoor': 'outdoor stone installation',
  'location:both': 'indoor outdoor stone design',
  'product_type:windows': 'modern aluminum windows',
  'product_type:doors': 'aluminum glass doors',
  'product_type:facades': 'aluminum glass facade',
  'product_type:partitions': 'aluminum glass partitions',
  'product_type:kitchens': 'aluminum kitchen cabinets',
  'glass_type:clear': 'clear glass window',
  'glass_type:tinted': 'tinted glass window',
  'glass_type:reflective': 'reflective glass facade',
  'glass_type:low-e': 'low e insulated glass',
  'glass_type:double': 'double glazed window',
  'glass_type:triple': 'triple glazed window',
  'insulation:thermal-break': 'thermal break aluminum window',
  'insulation:standard': 'standard aluminum window frame',
  'opening_method:sliding': 'sliding aluminum window',
  'opening_method:hinged': 'hinged aluminum window',
  'opening_method:tilt': 'tilt aluminum window',
  'opening_method:turn': 'turn aluminum window',
  'opening_method:fixed': 'fixed aluminum window',
  'opening_method:fold': 'folding aluminum windows',
  'product_type:facade': 'luxury glass facade',
  'product_type:shower': 'frameless glass shower door',
  'product_type:railing': 'glass railing staircase',
  'product_type:partition': 'glass office partition',
  'product_type:mirror': 'luxury wall mirror',
  'product_type:door': 'modern glass door',
  'glass_thickness:6mm': 'six millimeter glass edge',
  'glass_thickness:8mm': 'eight millimeter glass edge',
  'glass_thickness:10mm': 'ten millimeter glass edge',
  'glass_thickness:12mm': 'twelve millimeter glass edge',
  'glass_finish:clear': 'clear glass panel',
  'glass_finish:tinted': 'smoky tinted glass',
  'glass_finish:frosted': 'frosted privacy glass',
  'glass_finish:reflective': 'reflective mirror glass',
  'glass_finish:textured': 'textured decorative glass',
  'hardware_finish:chrome': 'chrome glass hardware',
  'hardware_finish:matte-black': 'matte black glass hardware',
  'hardware_finish:gold': 'gold glass hardware',
  'hardware_finish:brushed-steel': 'brushed steel hardware',
  'privacy_level:full': 'full privacy frosted glass',
  'privacy_level:partial': 'partial privacy glass panel',
  'privacy_level:none': 'clear transparent glass panel',
};

const getQuestionVisual = (question: Question): string => {
  return getQuestionnaireImagePath(getQuestionImageKey(question));
};

const getOptionVisual = (question: Question, optionValue: string): string => {
  return getQuestionnaireImagePath(getOptionImageKey(question, optionValue));
};

const getHelperText = (question: Question): string => {
  if (question.subtitle) return question.subtitle.split(/[.؟!]/)[0];
  if (question.required) return 'اختر الخيار الأقرب لطلبك للمتابعة.';
  return 'يمكنك إضافة هذه التفاصيل الآن أو لاحقًا.';
};

const getOptionDescription = (title: string, description?: string): string => {
  if (!description) return `اختيار ${title} بتفاصيل مناسبة.`;
  return description.split(/\s+/).slice(0, 8).join(' ');
};

const PremiumOptionCard: React.FC<{
  title: string;
  description?: string;
  image: string;
  selected: boolean;
  onClick: () => void;
  multiple?: boolean;
  preview?: React.ReactNode;
}> = ({ title, description, image, selected, onClick, multiple = false, preview }) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      group text-right bg-white rounded-[24px] border-2 shadow-[0_12px_34px_rgba(41,45,50,0.07)]
      transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(41,45,50,0.13)]
      focus:outline-none focus:ring-4 focus:ring-brand-orange/10
      ${selected
        ? 'border-brand-orange ring-4 ring-brand-orange/10 shadow-[0_22px_60px_rgba(255,90,0,0.16)]'
        : 'border-brand-gray/20 hover:border-brand-orange/50'
      }
    `}
  >
    <div className="relative flex items-center gap-4 p-4 md:p-5">
      <div className="relative h-[72px] w-[72px] flex-none overflow-hidden rounded-[22px] bg-brand-light shadow-inner ring-1 ring-brand-gray/10">
        {preview || (
          <img
            src={image}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className={`text-xl md:text-2xl font-bold mb-1.5 ${selected ? 'text-brand-orange' : 'text-brand-dark'}`}>
          {title}
        </h3>
        <p className="text-sm md:text-base text-brand-gray leading-relaxed line-clamp-1">
          {getOptionDescription(title, description)}
        </p>
      </div>
      {selected && (
        <div className="absolute top-4 left-4 w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center shadow-lg">
          <Check className="w-5 h-5 text-white" strokeWidth={3} />
        </div>
      )}
      {multiple && (
        <div
          className={`
            absolute top-4 right-4 w-7 h-7 rounded-lg border-2 bg-white/90 flex items-center justify-center
            ${selected ? 'border-brand-orange bg-brand-orange' : 'border-brand-gray/30'}
          `}
        >
          {selected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
        </div>
      )}
    </div>
  </button>
);

const VisualCardsQuestion: React.FC<{
  question: Question;
  value: string | undefined;
  onChange: (value: unknown) => void;
}> = ({ question, value, onChange }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
    {question.options?.map((option) => (
      <PremiumOptionCard
        key={option.id}
        image={getOptionVisual(question, option.value)}
        title={option.label}
        description={option.description}
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
      {question.options?.map((option) => (
        <PremiumOptionCard
          key={option.id}
          image={getOptionVisual(question, option.value)}
          title={option.label}
          description={option.description}
          selected={selected.includes(option.value)}
          onClick={() => handleChange(option.value)}
          multiple
        />
      ))}
    </div>
  );
};

const ColorSwatchesQuestion: React.FC<{
  question: Question;
  value: string | undefined;
  onChange: (value: unknown) => void;
}> = ({ question, value, onChange }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
    {question.options?.map((option) => (
      <PremiumOptionCard
        key={option.id}
        image={getOptionVisual(question, option.value)}
        title={option.label}
        description={option.description}
        selected={value === option.value}
        onClick={() => onChange(option.value)}
      />
    ))}
  </div>
);

const YesNoQuestion: React.FC<{
  question: Question;
  value: boolean | undefined;
  onChange: (value: unknown) => void;
}> = ({ question, value, onChange }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6 max-w-3xl mx-auto">
    <PremiumOptionCard
      image={getOptionVisual(question, 'yes')}
      title="نعم"
      description="تابع مع هذا الخيار."
      selected={value === true}
      onClick={() => onChange(true)}
    />
    <PremiumOptionCard
      image={getOptionVisual(question, 'no')}
      title="لا"
      description="انتقل للخيار البديل."
      selected={value === false}
      onClick={() => onChange(false)}
    />
  </div>
);

const TextQuestion: React.FC<{
  question: Question;
  value: string | undefined;
  onChange: (value: unknown) => void;
}> = ({ question, value, onChange }) => (
  <div className="max-w-2xl mx-auto w-full bg-brand-light/40 rounded-3xl p-6 md:p-8">
    <Input
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={question.placeholder}
      className="text-2xl py-5"
    />
  </div>
);

const TextAreaQuestion: React.FC<{
  question: Question;
  value: string | undefined;
  onChange: (value: unknown) => void;
}> = ({ question, value, onChange }) => (
  <div className="max-w-3xl mx-auto w-full bg-brand-light/40 rounded-3xl p-6 md:p-8">
    <TextArea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={question.placeholder}
      className="text-xl md:text-2xl"
      rows={5}
    />
  </div>
);

const NumberQuestion: React.FC<{
  question: Question;
  value: number | undefined;
  onChange: (value: unknown) => void;
}> = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState(value?.toString() || '');

  const handleKeypadChange = (val: string) => {
    setInputValue(val);
    onChange(parseInt(val) || undefined);
  };

  return (
    <div className="max-w-md mx-auto w-full bg-brand-light/40 rounded-3xl p-6 md:p-8">
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
  const fields: Array<{ key: 'width' | 'height' | 'depth'; label: string }> = [
    { key: 'width', label: 'العرض' },
    { key: 'height', label: 'الارتفاع' },
  ];

  if (question.departmentId === 'washbasins' || question.departmentId === 'marble') {
    fields.push({ key: 'depth', label: 'الطول' });
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="bg-brand-light/40 rounded-3xl p-6 md:p-8 border border-brand-gray/10">
        <div className={`grid grid-cols-1 ${fields.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6 mb-6`}>
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-lg font-bold text-brand-dark mb-3">{field.label}</label>
              <div className="relative">
                <input
                  type="number"
                  value={value[field.key] || ''}
                  onChange={(e) => updateField(field.key, parseFloat(e.target.value) || 0)}
                  className="input text-2xl text-center py-5"
                  placeholder="0"
                />
              </div>
            </div>
          ))}
        </div>
        <div>
          <label className="block text-lg font-bold text-brand-dark mb-3">وحدة القياس</label>
          <div className="flex gap-4">
            {['cm', 'm', 'inches'].map((unit) => (
              <button
                key={unit}
                onClick={() => updateField('unit', unit)}
                className={`
                  flex-1 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:-translate-y-0.5
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
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
    {question.options?.map((option) => (
      <PremiumOptionCard
        key={option.id}
        image={getOptionVisual(question, option.value)}
        title={option.label}
        description={option.description}
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
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
    {question.options?.map((option) => (
      <PremiumOptionCard
        key={option.id}
        image={getOptionVisual(question, option.value)}
        title={option.label}
        description={option.description}
        selected={value === option.value}
        onClick={() => onChange(option.value)}
      />
    ))}
  </div>
);

const DateInputQuestion: React.FC<{
  question: Question;
  value: string | undefined;
  onChange: (value: unknown) => void;
}> = ({ question, value, onChange }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
    {question.options?.map((option) => (
      <PremiumOptionCard
        key={option.id}
        image={getOptionVisual(question, option.value)}
        title={option.label}
        description={option.description}
        selected={value === option.value}
        onClick={() => onChange(option.value)}
      />
    ))}
  </div>
);

const ImageUploadQuestion: React.FC<{
  question: Question;
  value: string | undefined;
  onChange: (value: unknown) => void;
}> = ({ question, value, onChange }) => (
  <div className="max-w-3xl mx-auto w-full bg-brand-light/40 rounded-3xl p-6 md:p-8">
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
  <div className="max-w-4xl mx-auto w-full bg-brand-light/40 rounded-3xl p-6 md:p-8">
    <MultiImageUpload
      value={value as string[]}
      onChange={onChange}
      label={question.title}
      description={question.subtitle}
    />
  </div>
);

export default QuestionScreen;
