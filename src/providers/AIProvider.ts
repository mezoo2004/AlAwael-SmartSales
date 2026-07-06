import { GeneratedDesign, CustomerSession } from '../types';
import { getDesignsForDepartment } from '../data';

export interface AIGenerationProgress {
  step: number;
  total: number;
  message: string;
}

export type AIProgressCallback = (progress: AIGenerationProgress) => void;

export interface AIImageProvider {
  generateDesigns(
    session: CustomerSession,
    onProgress?: AIProgressCallback
  ): Promise<GeneratedDesign[]>;
  regenerateDesign(
    session: CustomerSession,
    designId: string,
    modifications: Record<string, unknown>
  ): Promise<GeneratedDesign>;
}

const generationSteps = [
  'نحلل اختياراتك',
  'ننسّق الخامات والألوان',
  'نراجع المقاسات والتفاصيل',
  'ننشئ التصورات المناسبة',
  'نجهّز التصاميم للعرض',
];

class DemoAIProvider implements AIImageProvider {
  async generateDesigns(
    session: CustomerSession,
    onProgress?: AIProgressCallback
  ): Promise<GeneratedDesign[]> {
    // Simulate AI generation with progressive updates
    for (let i = 0; i < generationSteps.length; i++) {
      await this.delay(800 + Math.random() * 600);

      if (onProgress) {
        onProgress({
          step: i + 1,
          total: generationSteps.length,
          message: generationSteps[i],
        });
      }
    }

    // Return demo designs based on department
    const departmentId = session.departmentId || 'washbasins';
    const baseDesigns = getDesignsForDepartment(departmentId);

    // Apply session-specific modifications
    return baseDesigns.map((design, index) => ({
      ...design,
      id: `${design.id}-${Date.now()}-${index}`,
      description: this.customizeDescription(design.description, session),
    }));
  }

  async regenerateDesign(
    session: CustomerSession,
    designId: string,
    modifications: Record<string, unknown>
  ): Promise<GeneratedDesign> {
    // Simulate regeneration
    await this.delay(1500);

    const departmentId = session.departmentId || 'washbasins';
    const baseDesigns = getDesignsForDepartment(departmentId);
    const originalDesign = baseDesigns.find(d => designId.includes(d.id)) || baseDesigns[0];

    return {
      ...originalDesign,
      id: `${originalDesign.id}-modified-${Date.now()}`,
      title: `${originalDesign.title} (معدل)`,
      description: this.applyModifications(originalDesign.description, modifications),
      modifications: originalDesign.modifications || [],
    };
  }

  private customizeDescription(baseDescription: string, session: CustomerSession): string {
    const style = session.answers?.design_style;
    const color = session.answers?.marble_color || session.answers?.color;
    const material = session.answers?.marble_pattern;

    let customized = baseDescription;

    if (style && typeof style === 'string') {
      const styleMap: Record<string, string> = {
        modern: 'مودرن',
        luxury: 'فاخر',
        minimal: 'بسيط',
        hotel: 'فندقي',
      };
      if (styleMap[style]) {
        customized = customized.replace(/تصميم \w+/, `تصميم ${styleMap[style]}`);
      }
    }

    return customized;
  }

  private applyModifications(description: string, modifications: Record<string, unknown>): string {
    const modDescriptions: string[] = [];
    if (modifications.color) modDescriptions.push('بتغيير اللون');
    if (modifications.marble) modDescriptions.push('مع رخام مختلف');
    if (modifications.cabinets) modDescriptions.push('بخزائن معدلة');
    if (modifications.mirror) modDescriptions.push('مع مرآة جديدة');
    if (modifications.lighting) modDescriptions.push('بإضاءة مختلفة');
    if (modifications.moreLuxury) modDescriptions.push('بطابع أكثر فخامة');
    if (modifications.simpler) modDescriptions.push('بشكل أبسط');

    const mods = modDescriptions.join('، ');
    return mods ? `${description} - ${mods}` : description;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const aiProvider: AIImageProvider = new DemoAIProvider();

export default aiProvider;
