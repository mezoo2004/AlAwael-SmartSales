import React, { useCallback, useState } from 'react';
import { Upload, X, Plus } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  description?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label,
  description,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onChange(result);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFileSelect(file);
    };
    input.click();
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-lg font-bold text-brand-dark mb-2">{label}</label>
      )}
      {description && (
        <p className="text-brand-gray mb-4">{description}</p>
      )}

      {value ? (
        <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-brand-gray/30">
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-full object-cover"
          />
          <button
            onClick={() => onChange('')}
            className="absolute top-3 left-3 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div
          className={`
            aspect-video rounded-2xl border-2 border-dashed
            flex flex-col items-center justify-center gap-4 cursor-pointer
            transition-all duration-300
            ${isDragging
              ? 'border-brand-orange bg-brand-orange/5'
              : 'border-brand-gray/40 bg-brand-light hover:border-brand-orange/50'
            }
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          {isUploading ? (
            <div className="w-12 h-12 rounded-full border-4 border-brand-orange border-t-transparent animate-spin" />
          ) : (
            <>
              <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-brand-orange" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-brand-dark">
                  اسحب الصورة هنا
                </p>
                <p className="text-sm text-brand-gray mt-1">
                  أو انقر للاختيار
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

interface MultiImageUploadProps {
  value?: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  description?: string;
  maxImages?: number;
  className?: string;
}

export const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  value = [],
  onChange,
  label,
  description,
  maxImages = 5,
  className = '',
}) => {
  const handleAddImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && value.length < maxImages) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          onChange([...value, result]);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [value, onChange, maxImages]);

  const handleRemoveImage = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-lg font-bold text-brand-dark mb-2">{label}</label>
      )}
      {description && (
        <p className="text-brand-gray mb-4">{description}</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {value.map((url, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-xl overflow-hidden border-2 border-brand-gray/30"
          >
            <img
              src={url}
              alt={`Image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => handleRemoveImage(index)}
              className="absolute top-2 left-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {value.length < maxImages && (
          <button
            onClick={handleAddImage}
            className="aspect-square rounded-xl border-2 border-dashed border-brand-gray/40 bg-brand-light hover:border-brand-orange/50 flex flex-col items-center justify-center gap-2 transition-all"
          >
            <div className="w-12 h-12 bg-brand-orange/10 rounded-full flex items-center justify-center">
              <Plus className="w-6 h-6 text-brand-orange" />
            </div>
            <span className="text-sm text-brand-gray">إضافة صورة</span>
          </button>
        )}
      </div>

      {value.length > 0 && (
        <p className="text-sm text-brand-gray mt-3 text-center">
          {value.length} / {maxImages} صور
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
