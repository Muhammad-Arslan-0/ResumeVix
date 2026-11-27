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
  languages: z
    .array(
      z.object({
        language: z.string().default(''),
        level: z.string().default(''),
        additionalInfo: z.string().optional(),
      })
    )
    .default([]),
});

function uid(prefix: string, idx: number): string {
  return `${prefix}-${Date.now()}-${idx}`;
}

export interface ExtractedPdfContent {
  text: string;
  links: string[];
}

export async function extractTextFromPdf(file: File): Promise<ExtractedPdfContent> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  const links: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const [content, annotations] = await Promise.all([
      page.getTextContent(),
      page.getAnnotations().catch(() => []),
    ]);

    for (const annot of annotations as Array<{ url?: string }>) {
      if (annot?.url && typeof annot.url === 'string') {
        links.push(annot.url);
      }
    }

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

  return {
    text: pages.join('\n').trim(),
    links: Array.from(new Set(links)),
  };
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

const DATE_RANGE_REGEX =
  /^(\d{4}(?:\/\d{2}|-\d{2})?)\s*[–-]\s*(\d{4}(?:\/\d{2}|-\d{2})?|Present|Current)$/i;

function joinWrappedBullets(lines: string[]): string[] {
  const bullets: string[] = [];
  for (const line of lines) {
    if (/^[•\-*]\s*/.test(line)) {
      bullets.push(line.replace(/^[•\-*]\s*/, '').trim());
    } else if (bullets.length > 0) {
      bullets[bullets.length - 1] = `${bullets[bullets.length - 1]} ${line}`.trim();
    } else {
      bullets.push(line);
    }
  }
  return bullets.filter(Boolean);
}

export function parseResumeTextHeuristic(
  rawText: string,
  extractedLinks: string[] = []
): ResumeData {
  const combinedForLinks = `${rawText}\n${extractedLinks.join('\n')}`;
  const emailMatch = combinedForLinks.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = rawText.match(/(\+?\(?\d{1,4}\)?[\d\s\-()]{6,16}\d)/);

  const linkedinLink =
    extractedLinks.find((l) => /linkedin\.com\/in\//i.test(l)) ||
    rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i)?.[0];
  const githubLink =
    extractedLinks.find((l) => /github\.com\//i.test(l)) ||
    rawText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i)?.[0];
  const websiteLink =
    extractedLinks.find(
      (l) =>
        !/mailto:|linkedin\.com|github\.com/i.test(l) &&
        /^https?:\/\//i.test(l)
    ) ||
    rawText.match(
      /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.(?:web\.app|vercel\.app|netlify\.app|github\.io|dev|io)\b(?:\/[^\s]*)?/i
    )?.[0];

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

  // Try to detect location like "Lahore, Pakistan" or "San Francisco, CA" in header
  const locationLine = headerLines
    .slice(2)
    .join(' ')
    .match(/\b([A-Z][a-zA-Z\s]+,\s*(?:[A-Z]{2}|[A-Z][a-zA-Z]+))\b/)?.[1];

  const summaryText = (buckets.summary || []).join(' ').trim();
  const expLines = buckets.experience || [];
  const eduLines = buckets.education || [];
  const skillLines = buckets.skills || [];
  const projectLines = buckets.projects || [];
  const languageLines = buckets.languages || [];

  // Parse multiple Experience entries split by date ranges
  const experience: ResumeData['experience'] = [];
  if (expLines.length > 0) {
    let currentExp: ResumeData['experience'][number] | null = null;
    let pendingBullets: string[] = [];

    const flushExp = () => {
      if (!currentExp) return;
      currentExp.bullets = joinWrappedBullets(pendingBullets);
      experience.push(currentExp);
      pendingBullets = [];
    };

    for (const line of expLines) {
      const dateMatch = line.match(DATE_RANGE_REGEX);
      if (dateMatch) {
        flushExp();
        currentExp = {
          id: uid('exp', experience.length),
          company: '',
          role: '',
          startDate: dateMatch[1],
          endDate: dateMatch[2],
          current: /present|current/i.test(dateMatch[2]),
          bullets: [],
          visible: true,
        };
        continue;
      }
      if (!currentExp) {
        currentExp = {
          id: uid('exp', 0),
          company: '',
          role: line,
          startDate: '',
          endDate: '',
          current: false,
          bullets: [],
          visible: true,
        };
        continue;
      }
      if (!currentExp.role && !/^[•\-*]/.test(line)) {
        if (line.includes(',')) {
          const [rolePart, ...compParts] = line.split(',');
          currentExp.role = rolePart.trim();
          currentExp.company = compParts.join(',').trim();
        } else {
          currentExp.role = line;
        }
      } else if (!currentExp.location && pendingBullets.length === 0 && !/^[•\-*]/.test(line) && line.length < 45) {
        currentExp.location = line;
      } else {
        pendingBullets.push(line);
      }
    }
    flushExp();
  }

  // Parse Education entries
  const education: ResumeData['education'] = [];
  if (eduLines.length > 0) {
    let startDate = '';
    let endDate = '';
    let location = '';
    let degree = '';
    let institution = '';
    let gpa = '';

    for (const line of eduLines) {
      const dateMatch = line.match(DATE_RANGE_REGEX);
      if (dateMatch) {
        startDate = dateMatch[1];
        endDate = dateMatch[2];
      } else if (/^GPA:/i.test(line)) {
        gpa = line.replace(/^GPA:\s*/i, '').trim();
      } else if (!degree && !/^[•\-*]/.test(line)) {
        if (line.includes(',')) {
          const [deg, ...inst] = line.split(',');
          degree = deg.trim();
          institution = inst.join(',').trim();
        } else {
          degree = line;
        }
      } else if (!location && line.length < 40) {
        location = line;
      }
    }

    education.push({
      id: uid('edu', 0),
      institution: institution || location,
      degree: degree || eduLines[0],
      location: institution ? location : undefined,
      startDate,
      endDate,
      gpa: gpa || undefined,
      visible: true,
    });
  }

  // Parse Skills
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

  // Parse multiple Projects (split on `* ProjectName` or `• ProjectName`)
  const projects: ResumeData['projects'] = [];
  if (projectLines.length > 0) {
    let currentProj: ResumeData['projects'][number] | null = null;
    let descLines: string[] = [];

    const flushProj = () => {
      if (!currentProj) return;
      const merged = descLines.join(' ').replace(/\s+/g, ' ').trim();
      currentProj.bullets = merged ? [merged] : [];
      projects.push(currentProj);
      descLines = [];
    };

    for (const line of projectLines) {
      const isHeadingMarker = /^[*•]\s+/.test(line) && line.length < 60;
      if (isHeadingMarker) {
        flushProj();
        const name = line.replace(/^[*•]\s+/, '').trim();
        currentProj = {
          id: uid('proj', projects.length),
          name,
          technologies: [],
          bullets: [],
          visible: true,
        };
      } else if (!currentProj) {
        currentProj = {
          id: uid('proj', 0),
          name: line,
          technologies: [],
          bullets: [],
          visible: true,
        };
      } else {
        descLines.push(line);
      }
    }
    flushProj();
  }

  const languages: NonNullable<ResumeData['languages']> = languageLines.map((line, idx) => {
    const parts = line.split(/\s*[—–-]\s*/);
    return {
      id: uid('lang', idx),
      language: parts[0]?.trim() || line,
      level: parts.slice(1).join(' — ').trim() || 'Proficient',
      visible: true,
    };
  });

  return {
    id: `resume-${Date.now()}`,
    title: fullName ? `${fullName} — CV` : 'Imported CV',
    updatedAt: new Date().toISOString(),
    profile: {
      fullName,
      headline,
      email: emailMatch?.[0] || '',
      phone: phoneMatch?.[0]?.trim() || '',
      location: locationLine || '',
      website: websiteLink,
      linkedin: linkedinLink,
      github: githubLink,
    },
    summary: summaryText || (!expLines.length ? rawText.slice(0, 600) : ''),
    experience,
    education,
    publications: [],
    projects,
    skills,
    languages,
    customSections: {},
  };
}

export async function parsePdfToResumeData(
  file: File,
  aiConfig: AIConfig
): Promise<{ data: ResumeData; usedAI: boolean }> {
  const { text: rawText, links } = await extractTextFromPdf(file);
  if (!rawText || rawText.length < 20) {
    throw new Error(
      'Could not extract selectable text from this PDF. Please ensure it is not a scanned image.'
    );
  }

  const systemPrompt = `You are an expert resume & academic CV parser.
Extract structured details from the provided CV text and embedded links into valid JSON matching:
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

  const aiInput =
    links.length > 0
      ? `${rawText.slice(0, 17000)}\n\nExtracted PDF Links:\n${links.join('\n')}`
      : rawText.slice(0, 18000);

  try {
    const parsed = (await executeStructuredAI(
      aiConfig,
      systemPrompt,
      aiInput,
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
      languages: (parsed.languages ?? []).map((l, i) => ({
        id: uid('lang', i),
        language: l.language ?? '',
        level: l.level ?? '',
        additionalInfo: l.additionalInfo,
        visible: true,
      })),
      customSections: {},
    };

    return { data, usedAI: true };
  } catch {
    return { data: parseResumeTextHeuristic(rawText, links), usedAI: false };
  }
}
