import { TemplateCategory, TemplateStyleTokens } from '@/types';

export type LayoutArchitecture =
  | 'single-column'
  | 'two-column-left'
  | 'two-column-right'
  | 'banner-header';

export interface TemplateDefinition {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  layout: LayoutArchitecture;
  atsScore: 'Strict ATS' | 'ATS Friendly' | 'Visual';
  defaultStyle: Partial<TemplateStyleTokens>;
  variant:
    | 'ats-minimal'
    | 'academic-ruled'
    | 'modern-accent'
    | 'executive-bold'
    | 'creative-pill'
    | 'editorial-banner';
  headerStyle?: 'left' | 'centered' | 'banner' | 'split' | 'icon-centered';
  entryLayout?: 'stacked' | 'date-left-rail';
  sidebarRatio?: string; // e.g. "32% 1fr"
}

export const TEMPLATE_REGISTRY: TemplateDefinition[] = [
  // --- RESUMEVIX SIGNATURE & ATS-COMPLIANT (8) ---
  {
    id: 'vix-classic',
    name: 'Vix Classic Editorial',
    category: 'ats',
    description:
      'Centered serif header with contact icons, tinted section banners, 2-column date/location entries, and 3-column skills.',
    layout: 'single-column',
    atsScore: 'Strict ATS',
    variant: 'editorial-banner',
    headerStyle: 'icon-centered',
    entryLayout: 'date-left-rail',
    defaultStyle: {
      fontFamily: 'Lora',
      headingFontFamily: 'Lora',
      accentColor: '#111827',
      density: 'standard',
      marginMm: 14,
    },
  },
  {
    id: 'vix-modern-teal',
    name: 'Vix Modern Teal',
    category: 'executive',
    description:
      'Crisp sans-serif ResumeVix layout with soft teal section bars and 2-column timeline entries.',
    layout: 'single-column',
    atsScore: 'Strict ATS',
    variant: 'editorial-banner',
    headerStyle: 'icon-centered',
    entryLayout: 'date-left-rail',
    defaultStyle: {
      fontFamily: 'Plus Jakarta Sans',
      headingFontFamily: 'Plus Jakarta Sans',
      accentColor: '#0f766e',
      density: 'standard',
      marginMm: 14,
    },
  },
  {
    id: 'ats-minimal',
    name: 'ATS Minimalist',
    category: 'ats',
    description: 'Strict single-column layout engineered for 100% ATS parser accuracy.',
    layout: 'single-column',
    atsScore: 'Strict ATS',
    variant: 'ats-minimal',
    headerStyle: 'left',
    defaultStyle: {
      fontFamily: 'Inter',
      headingFontFamily: 'Inter',
      accentColor: '#111827',
      density: 'standard',
      marginMm: 14,
    },
  },
  {
    id: 'ats-classic-serif',
    name: 'Classic Serif ATS',
    category: 'ats',
    description: 'Traditional centered header with crisp serif typography and clean rules.',
    layout: 'single-column',
    atsScore: 'Strict ATS',
    variant: 'ats-minimal',
    headerStyle: 'centered',
    defaultStyle: {
      fontFamily: 'Merriweather',
      headingFontFamily: 'Merriweather',
      accentColor: '#1e293b',
      density: 'standard',
      marginMm: 15,
    },
  },
  {
    id: 'ats-tech-compact',
    name: 'Tech Compact ATS',
    category: 'ats',
    description: 'High-density single-column layout ideal for engineering & product roles.',
    layout: 'single-column',
    atsScore: 'Strict ATS',
    variant: 'ats-minimal',
    headerStyle: 'left',
    defaultStyle: {
      fontFamily: 'IBM Plex Sans',
      headingFontFamily: 'IBM Plex Sans',
      accentColor: '#0f766e',
      density: 'compact',
      fontSizePt: 9.5,
      lineHeight: 1.3,
      marginMm: 11,
    },
  },
  {
    id: 'ats-clean-slate',
    name: 'Clean Slate',
    category: 'ats',
    description: 'Balanced whitespace with subtle slate dividers and clear hierarchy.',
    layout: 'single-column',
    atsScore: 'Strict ATS',
    variant: 'modern-accent',
    headerStyle: 'left',
    defaultStyle: {
      fontFamily: 'Source Sans 3',
      headingFontFamily: 'Source Sans 3',
      accentColor: '#334155',
      density: 'standard',
      marginMm: 14,
    },
  },
  {
    id: 'ats-federal',
    name: 'Federal / Policy Standard',
    category: 'ats',
    description: 'Structured, parser-safe format for government, legal, and policy roles.',
    layout: 'single-column',
    atsScore: 'Strict ATS',
    variant: 'ats-minimal',
    headerStyle: 'centered',
    defaultStyle: {
      fontFamily: 'Lora',
      headingFontFamily: 'Lora',
      accentColor: '#1e3a8a',
      density: 'standard',
      marginMm: 16,
    },
  },
  {
    id: 'ats-entry-level',
    name: 'Graduate ATS',
    category: 'ats',
    description: 'Clean single-column layout highlighting education, projects, and skills.',
    layout: 'single-column',
    atsScore: 'Strict ATS',
    variant: 'modern-accent',
    headerStyle: 'split',
    defaultStyle: {
      fontFamily: 'Plus Jakarta Sans',
      headingFontFamily: 'Plus Jakarta Sans',
      accentColor: '#0284c7',
      density: 'standard',
      marginMm: 14,
    },
  },

  // --- EDUCATION / ACADEMIC SPECIAL (5) ---
  {
    id: 'academic-cv',
    name: 'Academic CV Classic',
    category: 'academic',
    description: 'Multi-page academic CV highlighting publications, thesis, ORCID, and grants.',
    layout: 'single-column',
    atsScore: 'Strict ATS',
    variant: 'academic-ruled',
    headerStyle: 'centered',
    defaultStyle: {
      fontFamily: 'Merriweather',
      headingFontFamily: 'Merriweather',
      accentColor: '#7c2d12',
      density: 'standard',
      marginMm: 15,
    },
  },
  {
    id: 'academic-research-two-col',
    name: 'Research Fellow Split',
    category: 'academic',
    description: 'Two-column academic layout pairing research profile/skills with publications.',
    layout: 'two-column-left',
    atsScore: 'ATS Friendly',
    variant: 'academic-ruled',
    headerStyle: 'left',
    sidebarRatio: '31% 1fr',
    defaultStyle: {
      fontFamily: 'Source Serif 4',
      headingFontFamily: 'Source Serif 4',
      accentColor: '#1e3a8a',
      density: 'standard',
      marginMm: 13,
    },
  },
  {
    id: 'academic-fellowship',
    name: 'Grant & Fellowship CV',
    category: 'academic',
    description: 'Clean scholarly typography tailored for postdoc and grant applications.',
    layout: 'single-column',
    atsScore: 'Strict ATS',
    variant: 'academic-ruled',
    headerStyle: 'left',
    defaultStyle: {
      fontFamily: 'Lora',
      headingFontFamily: 'Lora',
      accentColor: '#065f46',
      density: 'spacious',
      marginMm: 16,
    },
  },
  {
    id: 'academic-teaching',
    name: 'Faculty & Teaching CV',
    category: 'academic',
    description: 'Structured layout for teaching portfolios, mentorship, and peer-reviewed work.',
    layout: 'single-column',
    atsScore: 'Strict ATS',
    variant: 'academic-ruled',
    headerStyle: 'split',
    defaultStyle: {
      fontFamily: 'Crimson Pro',
      headingFontFamily: 'Crimson Pro',
      accentColor: '#4338ca',
      density: 'standard',
      marginMm: 15,
    },
  },
  {
    id: 'academic-stem-mono',
    name: 'STEM & Lab Technical CV',
    category: 'academic',
    description: 'Precision sans/mono pairing for computational biology, ML, and physics CVs.',
    layout: 'single-column',
    atsScore: 'Strict ATS',
    variant: 'modern-accent',
    headerStyle: 'left',
    defaultStyle: {
      fontFamily: 'IBM Plex Sans',
      headingFontFamily: 'JetBrains Mono',
      accentColor: '#0f766e',
      density: 'compact',
      marginMm: 12,
    },
  },

  // --- EXECUTIVE / MODERN (5) ---
  {
    id: 'exec-boardroom',
    name: 'Executive Boardroom',
    category: 'executive',
    description: 'Commanding banner header and refined serif/sans contrast for leadership roles.',
    layout: 'banner-header',
    atsScore: 'ATS Friendly',
    variant: 'executive-bold',
    headerStyle: 'banner',
    defaultStyle: {
      fontFamily: 'Inter',
      headingFontFamily: 'Playfair Display',
      accentColor: '#0f172a',
      density: 'spacious',
      marginMm: 15,
    },
  },
  {
    id: 'modern-split-sidebar',
    name: 'Modern Split Sidebar',
    category: 'executive',
    description: 'Clean left sidebar for contact, skills, and education with wide experience column.',
    layout: 'two-column-left',
    atsScore: 'ATS Friendly',
    variant: 'modern-accent',
    headerStyle: 'left',
    sidebarRatio: '32% 1fr',
    defaultStyle: {
      fontFamily: 'Plus Jakarta Sans',
      headingFontFamily: 'Plus Jakarta Sans',
      accentColor: '#0d9488',
      density: 'standard',
      marginMm: 12,
    },
  },
  {
    id: 'modern-teal-accent',
    name: 'Modern Teal Accent',
    category: 'executive',
    description: 'Crisp single-column modern layout with vibrant teal section accents.',
    layout: 'single-column',
    atsScore: 'Strict ATS',
    variant: 'modern-accent',
    headerStyle: 'split',
    defaultStyle: {
      fontFamily: 'Inter',
      headingFontFamily: 'Inter',
      accentColor: '#0f766e',
      density: 'standard',
      marginMm: 14,
    },
  },
  {
    id: 'modern-chronological',
    name: 'Modern Chronological',
    category: 'executive',
    description: 'Right-aligned sidebar layout emphasizing career progression and impact.',
    layout: 'two-column-right',
    atsScore: 'ATS Friendly',
    variant: 'modern-accent',
    headerStyle: 'left',
    sidebarRatio: '1fr 30%',
    defaultStyle: {
      fontFamily: 'DM Sans',
      headingFontFamily: 'DM Sans',
      accentColor: '#2563eb',
      density: 'standard',
      marginMm: 13,
    },
  },
  {
    id: 'exec-metrics-first',
    name: 'Executive Impact',
    category: 'executive',
    description: 'Bold section headers and generous spacing tailored for VP/Director profiles.',
    layout: 'single-column',
    atsScore: 'Strict ATS',
    variant: 'executive-bold',
    headerStyle: 'centered',
    defaultStyle: {
      fontFamily: 'Source Sans 3',
      headingFontFamily: 'Merriweather',
      accentColor: '#991b1b',
      density: 'spacious',
      marginMm: 16,
    },
  },

  // --- CREATIVE / PORTFOLIO (5) ---
  {
    id: 'creative-editorial',
    name: 'Editorial Magazine',
    category: 'creative',
    description: 'High-contrast editorial typography with refined hairline rules.',
    layout: 'banner-header',
    atsScore: 'Visual',
    variant: 'executive-bold',
    headerStyle: 'banner',
    defaultStyle: {
      fontFamily: 'DM Sans',
      headingFontFamily: 'Playfair Display',
      accentColor: '#be185d',
      density: 'spacious',
      marginMm: 15,
    },
  },
  {
    id: 'creative-studio-grid',
    name: 'Studio Two-Column',
    category: 'creative',
    description: 'Asymmetric studio layout with pill-styled skill tags and project focus.',
    layout: 'two-column-left',
    atsScore: 'Visual',
    variant: 'creative-pill',
    headerStyle: 'left',
    sidebarRatio: '34% 1fr',
    defaultStyle: {
      fontFamily: 'Space Grotesk',
      headingFontFamily: 'Space Grotesk',
      accentColor: '#7c3aed',
      density: 'standard',
      marginMm: 12,
    },
  },
  {
    id: 'creative-monochrome-bold',
    name: 'Monochrome Bold',
    category: 'creative',
    description: 'Stark black-and-white contrast with oversized typographic header.',
    layout: 'single-column',
    atsScore: 'ATS Friendly',
    variant: 'creative-pill',
    headerStyle: 'left',
    defaultStyle: {
      fontFamily: 'Space Grotesk',
      headingFontFamily: 'Space Grotesk',
      accentColor: '#18181b',
      density: 'standard',
      marginMm: 14,
    },
  },
  {
    id: 'creative-product-lead',
    name: 'Product & Design Lead',
    category: 'creative',
    description: 'Modern right-rail layout showcasing projects, skills, and leadership.',
    layout: 'two-column-right',
    atsScore: 'Visual',
    variant: 'creative-pill',
    headerStyle: 'split',
    sidebarRatio: '1fr 32%',
    defaultStyle: {
      fontFamily: 'Plus Jakarta Sans',
      headingFontFamily: 'Plus Jakarta Sans',
      accentColor: '#ea580c',
      density: 'standard',
      marginMm: 13,
    },
  },
  {
    id: 'creative-architect',
    name: 'Architect Grid',
    category: 'creative',
    description: 'Minimalist Swiss-inspired grid with monospace accents and crisp alignment.',
    layout: 'banner-header',
    atsScore: 'Visual',
    variant: 'creative-pill',
    headerStyle: 'banner',
    defaultStyle: {
      fontFamily: 'IBM Plex Sans',
      headingFontFamily: 'JetBrains Mono',
      accentColor: '#0369a1',
      density: 'compact',
      marginMm: 13,
    },
  },
];

export function getTemplateMeta(id: string): TemplateDefinition {
  return TEMPLATE_REGISTRY.find((t) => t.id === id) ?? TEMPLATE_REGISTRY[0];
}
