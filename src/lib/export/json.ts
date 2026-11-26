import { z } from 'zod';
import { ResumeData, TemplateConfig } from '@/types';

const ExportBundleSchema = z.object({
  version: z.number().optional(),
  exportedAt: z.string().optional(),
  resume: z.object({
    id: z.string(),
    title: z.string(),
    updatedAt: z.string(),
    profile: z.object({
      fullName: z.string(),
      headline: z.string(),
      email: z.string(),
      phone: z.string(),
      location: z.string(),
    }).passthrough(),
    summary: z.string(),
    experience: z.array(z.any()),
    education: z.array(z.any()),
    publications: z.array(z.any()),
    projects: z.array(z.any()),
    skills: z.array(z.any()),
    customSections: z.record(z.string(), z.any()),
  }),
  template: z.any().optional(),
});

export function exportResumeToJson(resume: ResumeData, template: TemplateConfig): void {
  const bundle = {
    version: 1,
    app: 'ResumeVix',
    exportedAt: new Date().toISOString(),
    resume,
    template,
  };
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (resume.profile.fullName || 'resume')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  a.href = url;
  a.download = `${safeName || 'resumevix'}-backup.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function parseImportedJson(
  file: File
): Promise<{ resume: ResumeData; template?: TemplateConfig }> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON file.');
  }
  const result = ExportBundleSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error('JSON file does not match ResumeVix schema.');
  }
  return {
    resume: result.data.resume as ResumeData,
    template: result.data.template as TemplateConfig | undefined,
  };
}
