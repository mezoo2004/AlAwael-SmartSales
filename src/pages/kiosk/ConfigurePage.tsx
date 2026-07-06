import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { KioskLayout } from '../../components/layout';
import { QuestionScreen } from '../../components/kiosk';
import { useSession } from '../../context/SessionContext';
import { getQuestionsByDepartment } from '../../data';
import { Question, DepartmentId } from '../../types';

const ConfigurePage: React.FC = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const { session, setAnswer, getAnswer } = useSession();
  const [currentIndex, setCurrentIndex] = useState(0);

  const questions = useMemo(() => {
    return departmentId ? getQuestionsByDepartment(departmentId as DepartmentId) : [];
  }, [departmentId]);

  // Filter questions based on conditional logic
  const visibleQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (!q.conditional) return true;

      const parentAnswer = getAnswer(q.conditional.questionId);
      if (parentAnswer === undefined) return true;

      switch (q.conditional.operator) {
        case 'equals':
          return parentAnswer === q.conditional.value;
        case 'not-equals':
          return parentAnswer !== q.conditional.value;
        case 'greater-than':
          return typeof parentAnswer === 'number' && typeof q.conditional.value === 'number'
            ? parentAnswer > q.conditional.value
            : parseFloat(String(parentAnswer)) > parseFloat(String(q.conditional.value));
        case 'less-than':
          return typeof parentAnswer === 'number' && typeof q.conditional.value === 'number'
            ? parentAnswer < q.conditional.value
            : parseFloat(String(parentAnswer)) < parseFloat(String(q.conditional.value));
        case 'contains':
          return Array.isArray(parentAnswer)
            ? parentAnswer.includes(q.conditional.value as string)
            : false;
        default:
          return true;
      }
    });
  }, [questions, getAnswer]);

  // Recalculate when answers change
  useEffect(() => {
    // This effect will re-run visibleQuestions calculation when answers change
  }, [session?.answers]);

  const currentQuestion = visibleQuestions[currentIndex];

  const handleNext = () => {
    if (currentIndex < visibleQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigate('/kiosk/review');
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      navigate('/kiosk/departments');
    }
  };

  // Calculate step for progress
  const getStepFromQuestionType = (question: Question | undefined): number => {
    if (!question) return 0;
    if (question.id === 'measurements' || question.id === 'unknown_measurements' || question.id === 'measurement_visit') {
      return 2;
    }
    if (question.id === 'budget' || question.id === 'implementation_date' || question.id === 'notes') {
      return 3;
    }
    if (question.id === 'site_image' || question.id === 'inspiration_images') {
      return 3;
    }
    return 1;
  };

  if (!currentQuestion) {
    return (
      <KioskLayout currentStep={1}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-brand-dark mb-4">لا توجد أسئلة متاحة</h2>
            <button onClick={() => navigate('/kiosk/departments')} className="btn btn-primary">
              العودة للأقسام
            </button>
          </div>
        </div>
      </KioskLayout>
    );
  }

  return (
    <KioskLayout currentStep={getStepFromQuestionType(currentQuestion)}>
      {currentQuestion && (
        <QuestionScreen
          question={currentQuestion}
          value={getAnswer(currentQuestion.id)}
          onChange={(value) => setAnswer(currentQuestion.id, value)}
          onNext={handleNext}
          onBack={handleBack}
          isFirstQuestion={currentIndex === 0}
          isLastQuestion={currentIndex === visibleQuestions.length - 1}
        />
      )}

      {/* Question Counter */}
      <div className="fixed bottom-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow text-sm text-brand-gray">
        {currentIndex + 1} / {visibleQuestions.length}
      </div>
    </KioskLayout>
  );
};

export default ConfigurePage;
