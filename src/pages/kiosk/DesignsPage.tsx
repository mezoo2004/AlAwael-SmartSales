import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, Maximize2, Edit2 } from 'lucide-react';
import { KioskLayout } from '../../components/layout';
import { Button, Modal } from '../../components/ui';
import { useSession } from '../../context/SessionContext';
import { GeneratedDesign, ModificationRequest } from '../../types';

const DesignsPage: React.FC = () => {
  const navigate = useNavigate();
  const { session, selectDesign, addModification } = useSession();
  const [designs] = useState(session?.generatedDesigns || []);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewingDesign, setViewingDesign] = useState<GeneratedDesign | null>(null);
  const [showModifyPanel, setShowModifyPanel] = useState(false);
  const [modifyingDesign, setModifyingDesign] = useState<GeneratedDesign | null>(null);

  const handleSelectDesign = (designId: string) => {
    setSelectedDesignId(designId);
    selectDesign(designId);
  };

  const handleViewFullscreen = (design: GeneratedDesign) => {
    setViewingDesign(design);
    setShowImageViewer(true);
  };

  const handleRequestModification = (design: GeneratedDesign) => {
    setModifyingDesign(design);
    setShowModifyPanel(true);
  };

  const handleConfirmSelection = () => {
    if (selectedDesignId) {
      navigate('/kiosk/final-review');
    }
  };

  return (
    <KioskLayout currentStep={4}>
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-brand-dark mb-4">
              التصاميم المنشأة
            </h1>
            <p className="text-xl text-brand-gray">
              اختر التصميم الذي يعجبك، أو اطلب تعديلات
            </p>
          </div>

          {/* Design Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {designs.map((design, index) => (
              <div
                key={design.id}
                className={`
                  relative rounded-3xl overflow-hidden transition-all duration-300
                  ${selectedDesignId === design.id
                    ? 'ring-4 ring-brand-orange shadow-2xl scale-[1.02]'
                    : 'shadow-xl hover:shadow-2xl'
                  }
                `}
              >
                {/* Image */}
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img
                    src={design.imageUrl}
                    alt={design.title}
                    className={`w-full h-full object-cover transition-transform duration-500
                      ${selectedDesignId === design.id ? 'scale-105' : ''}
                    `}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Number Badge */}
                  <div className="absolute top-4 right-4 w-12 h-12 bg-white/95 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-brand-orange">{index + 1}</span>
                  </div>

                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-2xl font-bold mb-2">{design.title}</h3>
                    <p className="text-white/80 mb-3">{design.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {design.materials.map((material, i) => (
                        <span key={i} className="px-3 py-1 bg-white/20 rounded-full text-sm">
                          {material}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-white flex gap-3">
                  <Button
                    variant={selectedDesignId === design.id ? 'primary' : 'secondary'}
                    fullWidth
                    onClick={() => handleSelectDesign(design.id)}
                    icon={selectedDesignId === design.id ? <Check className="w-5 h-5" /> : undefined}
                  >
                    {selectedDesignId === design.id ? 'تم الاختيار' : 'اختيار'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleViewFullscreen(design)}
                    icon={<Maximize2 className="w-5 h-5" />}
                  />
                  <Button
                    variant="ghost"
                    onClick={() => handleRequestModification(design)}
                    icon={<Edit2 className="w-5 h-5" />}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Confirm Button */}
          <div className="flex justify-center gap-6">
            <Button
              variant="secondary"
              size="xl"
              onClick={() => navigate('/kiosk/review')}
            >
              <ArrowRight className="w-5 h-5 ml-2" />
              العودة للمراجعة
            </Button>
            <Button
              size="xl"
              onClick={handleConfirmSelection}
              disabled={!selectedDesignId}
              className="px-12"
            >
              تأكيد والمتابعة
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Viewer */}
      <Modal
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        size="full"
        showCloseButton={true}
      >
        {viewingDesign && (
          <div className="min-h-[80vh] flex items-center justify-center">
            <img
              src={viewingDesign.imageUrl}
              alt={viewingDesign.title}
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        )}
      </Modal>

      {/* Modification Panel */}
      <Modal
        isOpen={showModifyPanel}
        onClose={() => setShowModifyPanel(false)}
        title="طلب تعديل التصميم"
        size="lg"
      >
        {modifyingDesign && (
          <div className="space-y-6">
            <div className="flex gap-6">
              <div className="w-1/3">
                <img
                  src={modifyingDesign.thumbnailUrl}
                  alt={modifyingDesign.title}
                  className="w-full rounded-xl"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-brand-dark mb-2">
                  {modifyingDesign.title}
                </h3>
                <p className="text-brand-gray">{modifyingDesign.description}</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="text-lg font-bold text-brand-dark mb-4">ما التعديلات المطلوبة؟</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'color', label: 'تغيير اللون' },
                  { id: 'marble', label: 'تغيير الرخام' },
                  { id: 'cabinets', label: 'تغيير الخزائن' },
                  { id: 'mirror', label: 'تغيير المرآة' },
                  { id: 'lighting', label: 'تغيير الإضاءة' },
                  { id: 'moreLuxury', label: 'زيادة الفخامة' },
                  { id: 'simpler', label: 'تبسيط التصميم' },
                  { id: 'custom', label: 'تعديل مخصص' },
                ].map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => {
                      const modification: ModificationRequest = {
                        type: mod.id,
                        details: mod.id === 'custom' ? 'تعديل مخصص' : mod.label,
                      };
                      addModification(modification);
                      setShowModifyPanel(false);
                      // In a real app, this would regenerate the design
                    }}
                    className="p-4 text-right bg-brand-light rounded-xl hover:bg-brand-orange/10 hover:text-brand-orange transition-all font-medium"
                  >
                    {mod.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </KioskLayout>
  );
};

export default DesignsPage;
