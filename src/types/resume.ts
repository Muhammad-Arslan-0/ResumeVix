export type PageSize = 'A4' | 'LETTER';
export type TemplateCategory = 'ats' | 'academic' | 'executive' | 'creative';
export type DensityLevel = 'compact' | 'standard' | 'spacious';

export type SectionType =
  | 'summary'
  | 'experience'
  | 'education'
  | 'publications'
  | 'projects'
  | 'skills'
  | 'custom';

export interface ProfileData {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
  orcid?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
  visible: boolean;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  location?: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  thesisTitle?: string;
  advisor?: string;
  honors?: string[];
  visible: boolean;
}

export interface PublicationItem {
  id: string;
  title: string;
  authors: string[];
  venue: string;
  year: string;
  doiOrUrl?: string;
  summary?: string;
  type: 'journal' | 'conference' | 'preprint' | 'book' | 'thesis';
  visible: boolean;
}

export interface ProjectItem {
  id: string;
  name: string;
  role?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  technologies: string[];
  bullets: string[];
  visible: boolean;
}

export interface SkillGroup {
  id: string;
  category: string;
  items: string[];
  visible: boolean;
}

export interface CustomEntry {
  id: string;
  title: string;
  subtitle?: string;
  dateRange?: string;
  location?: string;
  bullets: string[];
  visible: boolean;
}

export interface CustomSection {
  id: string;
  title: string;
  entries: CustomEntry[];
}

export interface ResumeData {
  id: string;
  title: string;
  updatedAt: string;
  profile: ProfileData;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  publications: PublicationItem[];
  projects: ProjectItem[];
  skills: SkillGroup[];
  customSections: Record<string, CustomSection>;
}
