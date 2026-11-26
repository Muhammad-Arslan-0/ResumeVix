import { DensityLevel, PageSize, SectionType } from './resume';

export interface SectionConfig {
  id: string;
  type: SectionType;
  title: string;
  visible: boolean;
  order: number;
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
