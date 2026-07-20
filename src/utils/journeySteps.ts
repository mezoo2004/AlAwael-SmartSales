export const journeyStepLabels: Record<string, string> = {
  started: 'بداية الجلسة',
  customer_information_completed: 'اكتملت بيانات التواصل',
  department_selected: 'تم اختيار القسم',
  questionnaire_in_progress: 'جاري الاستبيان',
  review: 'مراجعة الإجابات',
  designs_generated: 'تم إنشاء التصاميم',
  design_selected: 'تم اختيار تصميم',
  final_review: 'المراجعة النهائية',
  request_submitted: 'تم إرسال الطلب',
};

export function getJourneyStepLabel(step: string): string {
  return journeyStepLabels[step] || step;
}
