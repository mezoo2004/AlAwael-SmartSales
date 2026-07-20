import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bath, DoorOpen, Gem, LayoutGrid, Square, ArrowRight } from 'lucide-react';
import { KioskLayout } from '../../components/layout';
import { departments } from '../../data';
import { useSession } from '../../context/SessionContext';
import { DepartmentId } from '../../types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  bath: Bath,
  'door-open': DoorOpen,
  gem: Gem,
  'layout-grid': LayoutGrid,
  square: Square,
};

const DepartmentSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { session, setDepartment, isHydrated } = useSession();

  useEffect(() => {
    if (!isHydrated) return;
    if (!session?.contactInfo) {
      navigate('/kiosk/contact', { replace: true });
    }
  }, [isHydrated, session, navigate]);

  const handleSelect = (departmentId: DepartmentId) => {
    setDepartment(departmentId);
    navigate('/kiosk/budget');
  };

  return (
    <KioskLayout currentStep={1}>
      <div className="flex-1 flex flex-col p-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-brand-dark mb-4">
            اختر القسم
          </h1>
          <p className="text-xl text-brand-gray">
            اختر القسم المناسب لبدء تصميم طلبك
          </p>
        </div>

        {/* Department Grid */}
        <div className="flex-1 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((department) => {
              const IconComponent = iconMap[department.icon] || Bath;

              return (
                <div
                  key={department.id}
                  onClick={() => handleSelect(department.id)}
                  className="group cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-3xl bg-white shadow-lg border-2 border-transparent hover:border-brand-orange/30 hover:shadow-xl transition-all duration-300">
                    {/* Image */}
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img
                        src={department.image}
                        alt={department.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Icon Badge */}
                      <div className="absolute top-4 right-4 w-14 h-14 bg-white/95 rounded-2xl flex items-center justify-center shadow-lg">
                        <IconComponent className="w-7 h-7 text-brand-orange" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 bg-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-brand-dark mb-2 group-hover:text-brand-orange transition-colors">
                            {department.name}
                          </h3>
                          <p className="text-brand-gray text-sm leading-relaxed">
                            {department.description}
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-brand-orange/10 flex items-center justify-center group-hover:bg-brand-orange transition-colors">
                          <ArrowRight className="w-6 h-6 text-brand-orange group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Coming Soon Placeholder */}
            <div className="relative overflow-hidden rounded-3xl bg-brand-gray/10 border-2 border-dashed border-brand-gray/30 opacity-60 cursor-not-allowed">
              <div className="aspect-[4/3] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl text-brand-gray">+</span>
                  </div>
                  <p className="text-brand-gray font-medium">قسم جديد قريبًا</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </KioskLayout>
  );
};

export default DepartmentSelectionPage;
