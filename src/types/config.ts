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
  headerConfig?: {
    textAlign?: 'left' | 'center';
    detailsLayout?: 'inline' | 'grid';
    detailsSeparator?: 'icon' | 'bullet' | 'bar';
    iconStyle?:
      | 'plain'
      | 'filled-circle'
      | 'filled-rounded'
      | 'filled-square'
      | 'outline-circle'
      | 'outline-rounded'
      | 'outline-square';
    nameBold?: boolean;
    titleItalic?: boolean;
    titlePosition?: 'below' | 'same-line';
  };
  footerConfig?: {
    showPageNumbers?: boolean;
    showEmail?: boolean;
    showName?: boolean;
    customEnabled?: boolean;
    leftText?: string;
    centerText?: string;
    rightText?: string;
  };
  sectionCustomizations?: {
    showSummaryHeading?: boolean;
    experienceTitleOrder?: 'role-first' | 'company-first';
    educationTitleOrder?: 'degree-first' | 'school-first';
    skillsLayout?: 'grid' | 'rows' | 'compact' | 'bubble';
    skillsGridCols?: 1 | 2 | 3 | 4;
  };
  documentLanguage?: 'en-US' | 'en-GB' | 'de' | 'fr' | 'es';
  dateFormat?: 'YYYY/MM' | 'YYYY/MM/DD' | 'MM/YYYY' | 'MMM YYYY' | 'YYYY';
  fontOffsets?: {
    fullNamePt?: number;
    titlePt?: number;
    sectionHeadingPt?: number;
    entryHeaderPt?: number;
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
