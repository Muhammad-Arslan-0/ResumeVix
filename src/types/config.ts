import { DensityLevel, PageSize, SectionType } from './resume';

export interface SectionConfig {
  id: string;
  type: SectionType;
  title: string;
  visible: boolean;
  order: number;
  column?: 'main' | 'sidebar';
}

export interface TemplateStyleTokens {
  fontFamily: string;
  headingFontFamily?: string;
  fontSizePt: number;
  lineHeight: number;
  accentColor: string;
  textColor: string;
  mutedColor: string;
  marginMm: number;
  sectionSpacingPx: number;
  density: DensityLevel;
  // Granular Customize overrides
  headingVariant?:
    | 'auto'
    | 'flowcv-banner'
    | 'ats-minimal'
    | 'academic-ruled'
    | 'modern-accent'
    | 'executive-bold'
    | 'creative-pill';
  headerStyleOverride?: 'auto' | 'icon-centered' | 'centered' | 'left' | 'split' | 'banner';
  entryLayoutOverride?: 'auto' | 'stacked' | 'date-left-rail';
  columnLayoutOverride?: 'auto' | 'one' | 'two' | 'mix';
  headingUppercase?: boolean;
  showPageNumbers?: boolean;
  footerText?: string;
  colorTarget?: 'full' | 'header' | 'border';
  pageBgColor?: string;
  accentTargets?: {
    name?: boolean;
    jobTitle?: boolean;
    headings?: boolean;
    headerIcons?: boolean;
    dates?: boolean;
    entryTitle?: boolean;
    entrySubtitle?: boolean;
    linkIcons?: boolean;
  };
}

export interface TemplateConfig {
  templateId: string;
  pageSize: PageSize;
  style: TemplateStyleTokens;
  sections: SectionConfig[];
}

export type AIProviderId =
  | 'gemini'
  | 'openai'
  | 'anthropic'
  | 'openrouter'
  | 'custom';

export interface AIConfig {
  provider: AIProviderId;
  apiKey: string;
  model: string;
  customBaseUrl?: string;
  persistKeyInLocalStorage: boolean;
  useServerProxyForCors: boolean;
}
