import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, Home, Printer, ArrowLeft } from 'lucide-react';
import { GeometricStrip, GeometricBackground, GeometricCorner } from '../../components/patterns/GeometricPatterns';
import { Button } from '../../components/ui';
import { useSession } from '../../context/SessionContext';
import { getDepartmentById } from '../../data';

const SuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, resetSession } = useSession();

  const requestNumber = useMemo(() => {
    return (location.state as { requestNumber?: string })?.requestNumber || 'AWA-2026-000000';
  }, [location]);

  const department = session?.departmentId
    ? getDepartmentById(session.departmentId)
    : null;

  const selectedDesign = session?.generatedDesigns.find(
    (d) => d.id === session.selectedDesignId
  );

  const handlePrint = () => {
    window.print();
  };

  const handleFinish = () => {
    resetSession();
    navigate('/kiosk');
  };

  const qrData = JSON.stringify({
    requestNumber,
    department: session?.departmentId,
    timestamp: new Date().toISOString(),
  });

  return (
    <div className="min-h-screen bg-brand-light-gradient flex flex-col relative overflow-hidden">
      {/* Background Pattern */}
      <GeometricBackground opacity={0.03} />

      {/* Top Pattern Strip */}
      <GeometricStrip variant="compact" />

      {/* Corner Decorations */}
      <GeometricCorner position="top-right" />
      <GeometricCorner position="bottom-left" />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          {/* Success Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header with Success Icon */}
            <div className="bg-brand-orange-gradient p-8 text-center">
              <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg">
                <CheckCircle className="w-12 h-12 text-brand-orange" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                تم استلام طلبك بنجاح
              </h1>
              <p className="text-white/80 text-lg">
                سيقوم فريق المبيعات بمراجعة طلبك والتواصل معك في أقرب وقت
              </p>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Request Number */}
              <div className="text-center mb-8">
                <p className="text-brand-gray mb-2">رقم الطلب</p>
                <p className="text-4xl font-bold text-brand-dark tracking-wider">
                  {requestNumber}
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-8">
                <div className="p-6 bg-brand-light rounded-2xl">
                  <QRCodeSVG
                    value={qrData}
                    size={180}
                    level="H"
                    includeMargin
                    bgColor="#F0F2F4"
                    fgColor="#292D32"
                  />
                </div>
              </div>

              {/* Details Summary */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-brand-light rounded-xl">
                  <p className="text-brand-gray text-sm">القسم</p>
                  <p className="font-bold text-brand-dark">{department?.name || '-'}</p>
                </div>
                <div className="p-4 bg-brand-light rounded-xl">
                  <p className="text-brand-gray text-sm">التصميم المختار</p>
                  <p className="font-bold text-brand-dark">{selectedDesign?.title || '-'}</p>
                </div>
              </div>

              {selectedDesign && (
                <div className="mb-8 rounded-xl overflow-hidden">
                  <img
                    src={selectedDesign.thumbnailUrl}
                    alt={selectedDesign.title}
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handlePrint}
                  icon={<Printer className="w-5 h-5" />}
                >
                  طباعة الملخص
                </Button>
                <Button
                  size="lg"
                  onClick={handleFinish}
                  icon={<Home className="w-5 h-5 ml-2" />}
                  iconPosition="start"
                  className="px-8"
                >
                  إنهاء والعودة
                </Button>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <p className="text-center text-brand-gray mt-6">
            احتفظ برقم الطلب للرجوع إليه مستقبلًا
          </p>
        </div>
      </div>

      {/* Bottom Pattern Strip */}
      <GeometricStrip variant="compact" />

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </div>
  );
};

export default SuccessPage;
