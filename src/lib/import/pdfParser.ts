import { z } from 'zod';
import { AIConfig, ResumeData } from '@/types';
import { executeStructuredAI } from '@/lib/ai/adapter';

export const ParsedResumeSchema = z.object({
  profile: z.object({
    fullName: z.string().default(''),
    headline: z.string().default(''),
    email: z.string().default(''),
    phone: z.string().default(''),
    location: z.string().default(''),
    website: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    orcid: z.string().optional(),
  }),
  summary: z.string().default(''),
  experience: z
    .array(
      z.object({
        company: z.string().default(''),
        role: z.string().default(''),
        location: z.string().optional(),
        startDate: z.string().default(''),
        endDate: z.string().default(''),
        current: z.boolean().default(false),
        bullets: z.array(z.string()).default([]),
      })
    )
    .default([]),
  education: z
    .array(
      z.object({
        institution: z.string().default(''),
        degree: z.string().default(''),
        fieldOfStudy: z.string().optional(),
        location: z.string().optional(),
        startDate: z.string().default(''),
        endDate: z.string().default(''),
        gpa: z.string().optional(),
        thesisTitle: z.string().optional(),
      })
    )
    .default([]),
  publications: z
    .array(
      z.object({
        title: z.string().default(''),
        authors: z.array(z.string()).default([]),
        venue: z.string().default(''),
        year: z.string().default(''),
        doiOrUrl: z.string().optional(),
      })
    )
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string().default(''),
        technologies: z.array(z.string()).default([]),
        bullets: z.array(z.string()).default([]),
        url: z.string().optional(),
      })
    )
    .default([]),
  skills: z
    .array(
      z.object({
        category: z.string().default('Skills'),
        items: z.array(z.string()).default([]),
      })
    )
    .default([]),
});

function uid(prefix: string, idx: number): string {
  return `${prefix}-${Date.now()}-${idx}`;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .filter(Boolean);
    pages.push(strings.join(' '));
  }

  return pages.join('\n\n').trim();
}

export function parseResumeTextHeuristic(rawText: string): ResumeData {
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = rawText.match(/(\+?\d[\d\s\-()]{7,18}\d)/);
  const linkedinMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const githubMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);

  const lines = rawText
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const firstWords = (lines[0] || '').split(/\s+/).slice(0, 4).join(' ');

  return {
    id: `resume-${Date.now()}`,
    title: firstWords ? `${firstWords} CV` : 'Imported CV',
    updatedAt: new Date().toISOString(),
    profile: {
      fullName: firstWords,
      headline: '',
      email: emailMatch?.[0] || '',
      phone: phoneMatch?.[0]?.trim() || '',
      location: '',
      linkedin: linkedinMatch?.[0],
      github: githubMatch?.[0],
    },
    summary: rawText.slice(0, 600),
    experience: [],
    education: [],
    publications: [],
    projects: [],
    skills: [],
    customSections: {},
  };
}

export async function parsePdfToResumeData(
  file: File,
  aiConfig: AIConfig
): Promise<{ data: ResumeData; usedAI: boolean }> {
  const rawText = await extractTextFromPdf(file);
  if (!rawText || rawText.length < 20) {
    throw new Error(
      'Could not extract selectable text from this PDF. Please ensure it is not a scanned image.'
    );
  }

  const systemPrompt = `You are an expert resume & academic CV parser.
Extract structured details from the provided CV text into valid JSON matching:
{
  "profile": { "fullName", "headline", "email", "phone", "location", "website"?, "linkedin"?, "github"?, "orcid"? },
  "summary": string,
  "experience": Array<{ "company", "role", "location"?, "startDate", "endDate", "current": boolean, "bullets": string[] }>,
  "education": Array<{ "institution", "degree", "fieldOfStudy"?, "location"?, "startDate", "endDate", "gpa"?, "thesisTitle"? }>,
  "publications": Array<{ "title", "authors": string[], "venue", "year", "doiOrUrl"? }>,
  "projects": Array<{ "name", "technologies": string[], "bullets": string[], "url"? }>,
  "skills": Array<{ "category", "items": string[] }>
}
Preserve factual details accurately.`;

  try {
    const parsed = (await executeStructuredAI(
      aiConfig,
      systemPrompt,
      rawText.slice(0, 18000),
      ParsedResumeSchema,
      'light'
    )) as z.infer<typeof ParsedResumeSchema>;

    const data: ResumeData = {
      id: `resume-${Date.now()}`,
      title: parsed.profile.fullName ? `${parsed.profile.fullName} — CV` : 'Imported CV',
      updatedAt: new Date().toISOString(),
      profile: {
        fullName: parsed.profile.fullName ?? '',
        headline: parsed.profile.headline ?? '',
        email: parsed.profile.email ?? '',
        phone: parsed.profile.phone ?? '',
        location: parsed.profile.location ?? '',
        website: parsed.profile.website,
        linkedin: parsed.profile.linkedin,
        github: parsed.profile.github,
        orcid: parsed.profile.orcid,
      },
      summary: parsed.summary ?? '',
      experience: (parsed.experience ?? []).map((e, i) => ({
        id: uid('exp', i),
        company: e.company ?? '',
        role: e.role ?? '',
        location: e.location,
        startDate: e.startDate ?? '',
        endDate: e.endDate ?? '',
        current: e.current ?? false,
        bullets: e.bullets ?? [],
        visible: true,
      })),
      education: (parsed.education ?? []).map((e, i) => ({
        id: uid('edu', i),
        institution: e.institution ?? '',
        degree: e.degree ?? '',
        fieldOfStudy: e.fieldOfStudy,
        location: e.location,
        startDate: e.startDate ?? '',
        endDate: e.endDate ?? '',
        gpa: e.gpa,
        thesisTitle: e.thesisTitle,
        visible: true,
      })),
      publications: (parsed.publications ?? []).map((p, i) => ({
        id: uid('pub', i),
        title: p.title ?? '',
        authors: p.authors ?? [],
        venue: p.venue ?? '',
        year: p.year ?? '',
        doiOrUrl: p.doiOrUrl,
        type: 'journal',
        visible: true,
      })),
      projects: (parsed.projects ?? []).map((p, i) => ({
        id: uid('proj', i),
        name: p.name ?? '',
        technologies: p.technologies ?? [],
        bullets: p.bullets ?? [],
        url: p.url,
        visible: true,
      })),
      skills: (parsed.skills ?? []).map((s, i) => ({
        id: uid('skill', i),
        category: s.category ?? 'Skills',
        items: s.items ?? [],
        visible: true,
      })),
      customSections: {},
    };

    return { data, usedAI: true };
  } catch {
    // Fallback to local heuristic extraction if AI key/server is unavailable
    return { data: parseResumeTextHeuristic(rawText), usedAI: false };
  }
}
