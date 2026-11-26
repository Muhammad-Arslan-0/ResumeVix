import { ResumeData, TemplateConfig } from '@/types';
import { TEMPLATE_REGISTRY } from '@/templates/registry';
import { CURATED_FONTS } from '@/lib/fonts';

export function buildDesignBySelfPrompts(
  userInstruction: string,
  resume: ResumeData,
  template: TemplateConfig
) {
  const catalog = TEMPLATE_REGISTRY.map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    layout: t.layout,
    atsScore: t.atsScore,
  }));

  const fontNames = CURATED_FONTS.map((f) => f.name);

  const systemPrompt = `You are ResumeVix's autonomous Design-by-Self engine.
Translate the user's natural-language request into a deterministic JSON patch matching AIDesignPatchSchema:
{
  "rationale": string,
  "templateId"?: string,
  "pageSize"?: "A4" | "LETTER",
  "style"?: {
    "fontFamily"?: string,
    "headingFontFamily"?: string,
    "fontSizePt"?: number,
    "lineHeight"?: number,
    "accentColor"?: "#RRGGBB",
    "density"?: "compact" | "standard" | "spacious",
    "marginMm"?: number
  },
  "sectionOrder"?: string[],
  "sectionVisibility"?: Record<string, boolean>,
  "sectionTitles"?: Record<string, string>,
  "contentUpdates"?: {
    "headline"?: string,
    "summary"?: string,
    "skillsToAdd"?: Array<{ "category": string, "items": string[] }>,
    "rewrittenBullets"?: Array<{ "section": "experience" | "projects", "itemId": string, "bullets": string[] }>
  }
}
Rules:
- templateId MUST be one of the catalog IDs.
- fontFamily MUST be one of: ${fontNames.join(', ')}.
- Only include fields that should change. Preserve factual accuracy.`;

  const compactResume = {
    headline: resume.profile.headline,
    summary: resume.summary,
    experience: resume.experience.map((e) => ({
      id: e.id,
      role: e.role,
      company: e.company,
      bullets: e.bullets,
    })),
    projects: resume.projects.map((p) => ({
      id: p.id,
      name: p.name,
      bullets: p.bullets,
    })),
    skills: resume.skills.map((s) => ({ category: s.category, items: s.items })),
  };

  const userPrompt = JSON.stringify({
    instruction: userInstruction,
    currentTemplateId: template.templateId,
    currentSections: template.sections.map((s) => ({
      id: s.id,
      title: s.title,
      visible: s.visible,
    })),
    availableTemplates: catalog,
    resumeSnapshot: compactResume,
  });

  return { systemPrompt, userPrompt };
}

export function buildRewriteBulletsPrompts(
  roleOrProject: string,
  bullets: string[],
  targetContext?: string
) {
  const systemPrompt = `You are an expert ATS resume writer. Rewrite the provided bullet points using strong action verbs, clear technical/domain context, and measurable outcomes (preserve facts; do not invent fake numbers if none exist, use realistic impact framing). Return JSON: { "bullets": string[] }.`;
  const userPrompt = JSON.stringify({ roleOrProject, bullets, targetContext });
  return { systemPrompt, userPrompt };
}

export function buildRefineSummaryPrompts(resume: ResumeData, targetRole?: string) {
  const systemPrompt = `You are an expert resume & academic CV strategist. Write a crisp, 2-3 sentence professional or academic summary tailored to the candidate's background and target role. Return JSON: { "summary": string }.`;
  const userPrompt = JSON.stringify({
    headline: resume.profile.headline,
    currentSummary: resume.summary,
    experience: resume.experience.slice(0, 3).map((e) => `${e.role} at ${e.company}`),
    education: resume.education.slice(0, 2).map((e) => `${e.degree} - ${e.institution}`),
    publicationsCount: resume.publications.length,
    targetRole,
  });
  return { systemPrompt, userPrompt };
}

export function buildSuggestSkillsPrompts(resume: ResumeData, targetRole: string) {
  const systemPrompt = `Suggest relevant, ATS-friendly skills grouped by category for the target role, avoiding duplicates with existing skills. Return JSON: { "groups": Array<{ "category": string, "items": string[] }> }.`;
  const userPrompt = JSON.stringify({
    targetRole,
    existingSkills: resume.skills.map((s) => ({ category: s.category, items: s.items })),
    headline: resume.profile.headline,
  });
  return { systemPrompt, userPrompt };
}
