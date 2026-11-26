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
    const lines: string[] = [];
    let currentLine: string[] = [];
    let lastY: number | null = null;

    for (const item of content.items) {
      if (!('str' in item) || !item.str) continue;
      const y = Array.isArray(item.transform) ? item.transform[5] : null;
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
        if (currentLine.length > 0) lines.push(currentLine.join(' ').trim());
        currentLine = [];
      }
      currentLine.push(item.str);
      if (y !== null) lastY = y;
    }
    if (currentLine.length > 0) lines.push(currentLine.join(' ').trim());
    pages.push(lines.filter(Boolean).join('\n'));
  }

  return pages.join('\n').trim();
}

const SECTION_HEADER_PATTERNS: Array<{ key: string; regex: RegExp }> = [
  { key: 'summary', regex: /^(profile|summary|about me|objective)$/i },
  { key: 'experience', regex: /^(professional\s+)?experience|work\s+history|employment$/i },
  { key: 'education', regex: /^education|academic\s+background$/i },
  { key: 'skills', regex: /^(technical\s+)?skills|competencies$/i },
  { key: 'projects', regex: /^(selected\s+)?projects$/i },
  { key: 'languages', regex: /^languages$/i },
  { key: 'publications', regex: /^publications$/i },
];

export function parseResumeTextHeuristic(rawText: string): ResumeData {
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = rawText.match(/(\+?\(?\d{1,4}\)?[\d\s\-()]{6,16}\d)/);
  const linkedinMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const githubMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const buckets: Record<string, string[]> = { header: [] };
  let currentSection = 'header';

  for (const line of lines) {
    const matched = SECTION_HEADER_PATTERNS.find((p) => p.regex.test(line));
    if (matched) {
      currentSection = matched.key;
      if (!buckets[currentSection]) buckets[currentSection] = [];
      continue;
    }
    if (!buckets[currentSection]) buckets[currentSection] = [];
    buckets[currentSection].push(line);
  }

  const headerLines = buckets.header || [];
  const fullName = headerLines[0] || '';
  const headline =
    headerLines[1] && !headerLines[1].includes('@') && !/\d{4,}/.test(headerLines[1])
      ? headerLines[1]
      : '';

  const summaryText = (buckets.summary || []).join(' ').trim();
  const expLines = buckets.experience || [];
  const eduLines = buckets.education || [];
  const skillLines = buckets.skills || [];
  const projectLines = buckets.projects || [];
  const languageLines = buckets.languages || [];

  const experience: ResumeData['experience'] = [];
  if (expLines.length > 0) {
    experience.push({
      id: uid('exp', 0),
      company: '',
      role: expLines[0] || 'Experience',
      startDate: '',
      endDate: '',
      current: false,
      visible: true,
      bullets: expLines
        .slice(1)
        .map((l) => l.replace(/^[•\-*]\s*/, ''))
        .filter(Boolean),
    });
  }

  const education: ResumeData['education'] = [];
  if (eduLines.length > 0) {
    education.push({
      id: uid('edu', 0),
      institution: eduLines.slice(1).join(' — ') || '',
      degree: eduLines[0] || 'Education',
      startDate: '',
      endDate: '',
      visible: true,
    });
  }

  const skills: ResumeData['skills'] =
    skillLines.length > 0
      ? [
          {
            id: uid('skill', 0),
            category: 'Skills',
            items: skillLines
              .join(', ')
              .split(/[,•|]+/)
              .map((s) => s.trim())
              .filter(Boolean),
            visible: true,
          },
        ]
      : [];

  const projects: ResumeData['projects'] =
    projectLines.length > 0
      ? [
          {
            id: uid('proj', 0),
            name: projectLines[0].replace(/^[•\-*]\s*/, ''),
            technologies: [],
            bullets: projectLines.slice(1),
            visible: true,
          },
        ]
      : [];

  const customSections: ResumeData['customSections'] = {};
  if (languageLines.length > 0) {
    customSections.custom_languages = {
      id: 'custom_languages',
      title: 'Languages',
      entries: [
        {
          id: uid('lang', 0),
          title: languageLines.join(' • '),
          bullets: [],
          visible: true,
        },
      ],
    };
  }

  return {
    id: `resume-${Date.now()}`,
    title: fullName ? `${fullName} — CV` : 'Imported CV',
    updatedAt: new Date().toISOString(),
    profile: {
      fullName,
      headline,
      email: emailMatch?.[0] || '',
      phone: phoneMatch?.[0]?.trim() || '',
      location: '',
      linkedin: linkedinMatch?.[0],
      github: githubMatch?.[0],
    },
    summary: summaryText || (!expLines.length ? rawText.slice(0, 600) : ''),
    experience,
    education,
    publications: [],
    projects,
    skills,
    customSections,
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
