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
    let currentLine = '';
    let lastY: number | null = null;
    let lastEndX: number | null = null;

    for (const item of content.items) {
      if (!('str' in item) || !item.str) continue;
      const x = Array.isArray(item.transform) ? item.transform[4] : null;
      const y = Array.isArray(item.transform) ? item.transform[5] : null;
      const itemWidth = 'width' in item && typeof item.width === 'number' ? item.width : 0;

      if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
        if (currentLine.trim()) lines.push(currentLine.trim());
        currentLine = item.str;
        lastEndX = x !== null ? x + itemWidth : null;
      } else {
        if (currentLine) {
          const gap = x !== null && lastEndX !== null ? x - lastEndX : 0;
          currentLine += gap > 18 ? `\t${item.str}` : ` ${item.str}`;
        } else {
          currentLine = item.str;
        }
        if (x !== null) {
          lastEndX = x + itemWidth;
        }
      }
      if (y !== null) lastY = y;
    }
    if (currentLine.trim()) lines.push(currentLine.trim());
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
    const cleanLine = line.replace(/\t+/g, ' ').trim();
    const matched = SECTION_HEADER_PATTERNS.find((p) => p.regex.test(cleanLine));
    if (matched) {
      currentSection = matched.key;
      if (!buckets[currentSection]) buckets[currentSection] = [];
      continue;
    }
    if (!buckets[currentSection]) buckets[currentSection] = [];
    buckets[currentSection].push(
      currentSection === 'skills' || currentSection === 'education' ? line : cleanLine
    );
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

  // Parse Education entries (supports single-column, 2-column tab-rail, and multiple degrees)
  const education: ResumeData['education'] = [];
  if (eduLines.length > 0) {
    const DEGREE_RE =
      /\b(B\.?S\.?|B\.?A\.?|B\.?Sc\.?|B\.?E\.?|B\.?Tech|M\.?S\.?|M\.?A\.?|M\.?Sc\.?|M\.?Tech|MBA|Ph\.?D\.?|Doctorate|Bachelor|Master|Associate|Diploma|Certificate|High\s+School|Intermediate|F\.?Sc|Matric)\b/i;
    const INST_RE =
      /\b(University|College|Institute|School|Academy|Polytechnic|Faculty|Campus)\b/i;
    const INLINE_DATE_RE =
      /(\d{4}(?:\/\d{2}|-\d{2})?|\d{2}\/\d{4})\s*[–-]\s*(\d{4}(?:\/\d{2}|-\d{2})?|\d{2}\/\d{4}|Present|Current)/i;
    const GPA_RE =
      /\b(?:C?GPA)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?(?:\s*\/\s*[0-9]+(?:\.[0-9]+)?)?)/i;

    const flatEduTokens = eduLines
      .flatMap((l) => l.split('\t'))
      .map((t) => t.trim())
      .filter(Boolean);

    type DraftEdu = {
      startDate: string;
      endDate: string;
      location: string;
      degree: string;
      institution: string;
      gpa: string;
      thesisTitle: string;
      extraNotes: string[];
    };

    let currentEdu: DraftEdu | null = null;

    const createDraftEdu = (): DraftEdu => ({
      startDate: '',
      endDate: '',
      location: '',
      degree: '',
      institution: '',
      gpa: '',
      thesisTitle: '',
      extraNotes: [],
    });

    const flushEdu = () => {
      if (!currentEdu) return;
      if (currentEdu.degree || currentEdu.institution) {
        education.push({
          id: uid('edu', education.length),
          institution: currentEdu.institution,
          degree: currentEdu.degree || currentEdu.institution,
          location: currentEdu.location || undefined,
          startDate: currentEdu.startDate,
          endDate: currentEdu.endDate,
          gpa: currentEdu.gpa || undefined,
          thesisTitle: currentEdu.thesisTitle || undefined,
          description:
            currentEdu.extraNotes.length > 0
              ? currentEdu.extraNotes.join('\n')
              : undefined,
          visible: true,
        });
      }
      currentEdu = null;
    };

    for (const rawToken of flatEduTokens) {
      let token = rawToken;
      const dateMatch = token.match(INLINE_DATE_RE);
      if (dateMatch) {
        if (currentEdu && (currentEdu.degree || currentEdu.institution)) {
          flushEdu();
        }
        if (!currentEdu) currentEdu = createDraftEdu();
        currentEdu.startDate = dateMatch[1];
        currentEdu.endDate = dateMatch[2];
        token = token.replace(dateMatch[0], '').replace(/^[\s,|–-]+|[\s,|–-]+$/g, '').trim();
        if (!token) continue;
      }

      if (!currentEdu) currentEdu = createDraftEdu();

      if (GPA_RE.test(token)) {
        const gm = token.match(GPA_RE);
        if (gm) currentEdu.gpa = gm[1].replace(/\s+/g, '');
        continue;
      }

      if (/^Thesis\s*[:\-]/i.test(token)) {
        currentEdu.thesisTitle = token.replace(/^Thesis\s*[:\-]\s*/i, '').trim();
        continue;
      }

      const hasDegree = DEGREE_RE.test(token);
      const hasInst = INST_RE.test(token);

      if (hasDegree || hasInst) {
        if ((hasDegree && currentEdu.degree) || (hasInst && currentEdu.institution)) {
          flushEdu();
          currentEdu = createDraftEdu();
        }
        if (hasDegree && hasInst) {
          const parts = token.split(/\s*[,|•–—]\s*|\s+at\s+/i).map((p) => p.trim()).filter(Boolean);
          const degPart = parts.find((p) => DEGREE_RE.test(p)) || parts[0] || '';
          const instPart = parts.find((p) => p !== degPart && INST_RE.test(p)) || parts.slice(1).join(', ');
          currentEdu.degree = degPart;
          currentEdu.institution = instPart;
        } else if (hasDegree) {
          currentEdu.degree = token;
        } else {
          currentEdu.institution = token;
        }
        continue;
      }

      if (!currentEdu.location && token.length <= 45 && /,/.test(token)) {
        currentEdu.location = token;
        continue;
      }

      if (!currentEdu.degree) {
        currentEdu.degree = token;
      } else if (!currentEdu.institution) {
        currentEdu.institution = token;
      } else {
        currentEdu.extraNotes.push(token);
      }
    }
    flushEdu();
  }

  // Parse Skills (supports multi-column tab grids, "Category: items", and stacked category/items)
  const splitSkillTokens = (raw: string): string[] => {
    const tokens: string[] = [];
    let buf = '';
    let depth = 0;
    for (const ch of raw) {
      if (ch === '(') depth++;
      else if (ch === ')' && depth > 0) depth--;
      if ((ch === ',' || ch === '•' || ch === '|') && depth === 0) {
        if (buf.trim()) tokens.push(buf.trim());
        buf = '';
      } else {
        buf += ch;
      }
    }
    if (buf.trim()) tokens.push(buf.trim());
    return tokens;
  };

  const skills: ResumeData['skills'] = [];
  if (skillLines.length > 0) {
    const hasTabs = skillLines.some((l) => l.includes('\t'));

    if (hasTabs) {
      let activeRowGroups: Array<{ category: string; rawItems: string }> = [];
      for (const line of skillLines) {
        const cells = line
          .split('\t')
          .map((c) => c.trim())
          .filter(Boolean);
        if (cells.length === 0) continue;

        const looksLikeHeaderRow =
          cells.length >= 2 &&
          cells.every((c) => !c.includes(',') && c.length <= 36);

        if (looksLikeHeaderRow) {
          for (const g of activeRowGroups) {
            skills.push({
              id: uid('skill', skills.length),
              category: g.category,
              items: splitSkillTokens(g.rawItems),
              visible: true,
            });
          }
          activeRowGroups = cells.map((c) => ({ category: c, rawItems: '' }));
        } else if (activeRowGroups.length > 0) {
          if (cells.length === 1 && activeRowGroups[activeRowGroups.length - 1].rawItems.trim().endsWith(',')) {
            const last = activeRowGroups[activeRowGroups.length - 1];
            last.rawItems = `${last.rawItems} ${cells[0]}`.trim();
          } else {
            cells.forEach((cell, idx) => {
              const target = activeRowGroups[idx] || activeRowGroups[activeRowGroups.length - 1];
              target.rawItems = target.rawItems ? `${target.rawItems}, ${cell}` : cell;
            });
          }
        }
      }
      for (const g of activeRowGroups) {
        skills.push({
          id: uid('skill', skills.length),
          category: g.category,
          items: splitSkillTokens(g.rawItems),
          visible: true,
        });
      }
    } else if (skillLines.some((l) => /^[^:]{2,40}:\s*.+/.test(l))) {
      for (const line of skillLines) {
        const match = line.match(/^([^:]{2,40}):\s*(.+)$/);
        if (match) {
          skills.push({
            id: uid('skill', skills.length),
            category: match[1].trim(),
            items: splitSkillTokens(match[2]),
            visible: true,
          });
        } else if (skills.length > 0) {
          skills[skills.length - 1].items.push(...splitSkillTokens(line));
        }
      }
    } else {
      // Check stacked Category -> comma-separated items pattern
      let idx = 0;
      const stackedGroups: ResumeData['skills'] = [];
      while (idx < skillLines.length) {
        const line = skillLines[idx];
        const next = skillLines[idx + 1];
        if (!line.includes(',') && line.length <= 40 && next && next.includes(',')) {
          let rawItems = next;
          idx += 2;
          while (idx < skillLines.length && rawItems.trim().endsWith(',')) {
            rawItems = `${rawItems} ${skillLines[idx]}`;
            idx++;
          }
          stackedGroups.push({
            id: uid('skill', stackedGroups.length),
            category: line,
            items: splitSkillTokens(rawItems),
            visible: true,
          });
        } else {
          idx++;
        }
      }

      if (stackedGroups.length > 0) {
        skills.push(...stackedGroups);
      } else {
        skills.push({
          id: uid('skill', 0),
          category: 'Skills',
          items: splitSkillTokens(skillLines.join(', ')),
          visible: true,
        });
      }
    }
  }

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

export async function parseExtractedResumeText(
  rawText: string,
  links: string[],
  aiConfig: AIConfig
): Promise<{ data: ResumeData; usedAI: boolean }> {
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
  return parseExtractedResumeText(rawText, links, aiConfig);
}
