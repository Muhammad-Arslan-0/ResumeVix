import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { arrayMove } from '@dnd-kit/sortable';
import {
  AIConfig,
  CustomSection,
  ResumeData,
  SectionConfig,
  TemplateConfig,
  TemplateStyleTokens,
} from '@/types';
import {
  ACADEMIC_CV_PRESET,
  DEFAULT_TEMPLATE_CONFIG,
  TECH_RESUME_PRESET,
} from '@/data/presets';
import { AIDesignPatch } from '@/lib/ai/schemas';
import { getTemplateMeta } from '@/templates/registry';

interface HistorySnapshot {
  resume: ResumeData;
  template: TemplateConfig;
}

export type EditorTab = 'content' | 'design' | 'ai';
export type SyncStatus = 'guest' | 'saved' | 'saving' | 'unsaved' | 'error';

export interface AuthUserSummary {
  id: string;
  email: string;
  fullName?: string;
}

interface ResumeStoreState {
  resume: ResumeData;
  template: TemplateConfig;
  aiConfig: AIConfig;
  editorTheme: 'light' | 'dark';
  activeTab: EditorTab;
  previewZoom: number;
  past: HistorySnapshot[];
  future: HistorySnapshot[];

  // Cloud Sync & Auth
  authUser: AuthUserSummary | null;
  authChecking: boolean;
  activeResumeId: string | null;
  syncStatus: SyncStatus;
  lastSavedAt: string | null;
  hasLocalEdits: boolean;

  setAuthUser: (user: AuthUserSummary | null) => void;
  setAuthChecking: (checking: boolean) => void;
  setSyncState: (status: SyncStatus, lastSavedAt?: string | null) => void;
  loadCloudResume: (id: string, resume: ResumeData, template: TemplateConfig) => void;
  markLocalDirty: () => void;

  // Actions
  setActiveTab: (tab: EditorTab) => void;
  toggleEditorTheme: () => void;
  setPreviewZoom: (zoom: number) => void;
  loadPreset: (preset: 'tech' | 'academic') => void;
  importResumeBundle: (resume: ResumeData, template?: TemplateConfig) => void;

  updateProfile: (patch: Partial<ResumeData['profile']>) => void;
  updateSummary: (summary: string) => void;
  updateResumeTitle: (title: string) => void;

  // Generic item CRUD
  addExperience: () => void;
  updateExperience: (id: string, patch: Partial<ResumeData['experience'][number]>) => void;
  removeExperience: (id: string) => void;

  addEducation: () => void;
  updateEducation: (id: string, patch: Partial<ResumeData['education'][number]>) => void;
  removeEducation: (id: string) => void;

  addPublication: () => void;
  updatePublication: (id: string, patch: Partial<ResumeData['publications'][number]>) => void;
  removePublication: (id: string) => void;

  addProject: () => void;
  updateProject: (id: string, patch: Partial<ResumeData['projects'][number]>) => void;
  removeProject: (id: string) => void;

  addSkillGroup: () => void;
  updateSkillGroup: (id: string, patch: Partial<ResumeData['skills'][number]>) => void;
  removeSkillGroup: (id: string) => void;

  addCustomSection: (title: string) => void;
  removeCustomSection: (sectionId: string) => void;
  addCustomEntry: (sectionId: string) => void;
  updateCustomEntry: (
    sectionId: string,
    entryId: string,
    patch: Partial<CustomSection['entries'][number]>
  ) => void;
  removeCustomEntry: (sectionId: string, entryId: string) => void;

  // DnD & Section Config
  reorderSections: (activeId: string, overId: string) => void;
  toggleSectionVisibility: (sectionId: string) => void;
  renameSection: (sectionId: string, title: string) => void;
  setSectionColumn: (sectionId: string, column: 'main' | 'sidebar') => void;
  addPageBreak: () => void;
  removeSection: (sectionId: string) => void;
  reorderItems: (sectionKey: string, activeId: string, overId: string) => void;

  // Template & Style
  switchTemplate: (templateId: string, applyTemplateDefaults?: boolean) => void;
  setPageSize: (pageSize: TemplateConfig['pageSize']) => void;
  updateStyleConfig: (patch: Partial<TemplateStyleTokens>) => void;

  // AI
  setAIConfig: (patch: Partial<AIConfig>) => void;
  applyAIDesignPatch: (patch: AIDesignPatch) => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;
}

const MAX_HISTORY = 30;

function pushHistory(state: ResumeStoreState) {
  const snapshot: HistorySnapshot = {
    resume: JSON.parse(JSON.stringify(state.resume)),
    template: JSON.parse(JSON.stringify(state.template)),
  };
  state.past.push(snapshot);
  if (state.past.length > MAX_HISTORY) {
    state.past.shift();
  }
  state.future = [];
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useResumeStore = create<ResumeStoreState>()(
  persist(
    immer((set) => ({
      resume: TECH_RESUME_PRESET,
      template: DEFAULT_TEMPLATE_CONFIG,
      aiConfig: {
        provider: 'gemini',
        apiKey: '',
        model: 'gemini-3.8-flash',
        persistKeyInLocalStorage: true,
        useServerProxyForCors: true,
      },
      editorTheme: 'light',
      activeTab: 'content',
      previewZoom: 0.85,
      past: [],
      future: [],

      authUser: null,
      authChecking: true,
      activeResumeId: null,
      syncStatus: 'guest',
      lastSavedAt: null,
      hasLocalEdits: false,

      setAuthUser: (user) =>
        set((state) => {
          state.authUser = user;
          if (!user) {
            state.activeResumeId = null;
            state.syncStatus = 'guest';
          }
        }),

      setAuthChecking: (checking) =>
        set((state) => {
          state.authChecking = checking;
        }),

      setSyncState: (status, lastSavedAt) =>
        set((state) => {
          state.syncStatus = status;
          if (lastSavedAt !== undefined) {
            state.lastSavedAt = lastSavedAt;
          }
        }),

      loadCloudResume: (id, resume, template) =>
        set((state) => {
          const normalizedTemplateId =
            template.templateId === 'flowcv-classic'
              ? 'vix-classic'
              : template.templateId === 'flowcv-modern-teal'
                ? 'vix-modern-teal'
                : template.templateId;
          state.activeResumeId = id;
          state.resume = resume;
          state.template = { ...template, templateId: normalizedTemplateId };
          state.hasLocalEdits = false;
          state.past = [];
          state.future = [];
          state.syncStatus = 'saved';
        }),

      markLocalDirty: () =>
        set((state) => {
          if (!state.authUser) state.hasLocalEdits = true;
        }),

      setActiveTab: (tab) =>
        set((state) => {
          state.activeTab = tab;
        }),

      toggleEditorTheme: () =>
        set((state) => {
          state.editorTheme = state.editorTheme === 'light' ? 'dark' : 'light';
        }),

      setPreviewZoom: (zoom) =>
        set((state) => {
          state.previewZoom = Math.min(1.4, Math.max(0.45, zoom));
        }),

      loadPreset: (preset) =>
        set((state) => {
          pushHistory(state);
          if (preset === 'academic') {
            state.resume = JSON.parse(JSON.stringify(ACADEMIC_CV_PRESET));
            state.template.templateId = 'academic-cv';
            state.template.style.fontFamily = 'Merriweather';
            state.template.style.headingFontFamily = 'Merriweather';
            state.template.sections = [
              { id: 'summary', type: 'summary', title: 'Research Profile', visible: true, order: 0 },
              { id: 'education', type: 'education', title: 'Education', visible: true, order: 1 },
              { id: 'publications', type: 'publications', title: 'Publications', visible: true, order: 2 },
              { id: 'experience', type: 'experience', title: 'Research & Academic Experience', visible: true, order: 3 },
              { id: 'custom_grants', type: 'custom', title: 'Grants, Fellowships & Honors', visible: true, order: 4 },
              { id: 'skills', type: 'skills', title: 'Technical & Lab Skills', visible: true, order: 5 },
              { id: 'projects', type: 'projects', title: 'Projects', visible: false, order: 6 },
            ];
          } else {
            state.resume = JSON.parse(JSON.stringify(TECH_RESUME_PRESET));
            state.template = JSON.parse(JSON.stringify(DEFAULT_TEMPLATE_CONFIG));
          }
        }),

      importResumeBundle: (resume, template) =>
        set((state) => {
          pushHistory(state);
          state.resume = resume;
          if (template) {
            state.template = template;
          }
        }),

      updateProfile: (patch) =>
        set((state) => {
          Object.assign(state.resume.profile, patch);
          state.resume.updatedAt = new Date().toISOString();
        }),

      updateSummary: (summary) =>
        set((state) => {
          state.resume.summary = summary;
          state.resume.updatedAt = new Date().toISOString();
        }),

      updateResumeTitle: (title) =>
        set((state) => {
          state.resume.title = title;
        }),

      addExperience: () =>
        set((state) => {
          pushHistory(state);
          state.resume.experience.unshift({
            id: uid('exp'),
            company: 'New Company',
            role: 'Role Title',
            location: '',
            startDate: '2025-01',
            endDate: 'Present',
            current: true,
            bullets: ['Delivered measurable impact by...'],
            visible: true,
          });
        }),

      updateExperience: (id, patch) =>
        set((state) => {
          const item = state.resume.experience.find((e) => e.id === id);
          if (item) Object.assign(item, patch);
          state.resume.updatedAt = new Date().toISOString();
        }),

      removeExperience: (id) =>
        set((state) => {
          pushHistory(state);
          state.resume.experience = state.resume.experience.filter((e) => e.id !== id);
        }),

      addEducation: () =>
        set((state) => {
          pushHistory(state);
          state.resume.education.unshift({
            id: uid('edu'),
            institution: 'University Name',
            degree: 'Degree',
            startDate: '2020-09',
            endDate: '2024-05',
            visible: true,
          });
        }),

      updateEducation: (id, patch) =>
        set((state) => {
          const item = state.resume.education.find((e) => e.id === id);
          if (item) Object.assign(item, patch);
          state.resume.updatedAt = new Date().toISOString();
        }),

      removeEducation: (id) =>
        set((state) => {
          pushHistory(state);
          state.resume.education = state.resume.education.filter((e) => e.id !== id);
        }),

      addPublication: () =>
        set((state) => {
          pushHistory(state);
          state.resume.publications.unshift({
            id: uid('pub'),
            title: 'Paper Title',
            authors: [state.resume.profile.fullName || 'Author'],
            venue: 'Journal or Conference',
            year: '2026',
            type: 'journal',
            visible: true,
          });
        }),

      updatePublication: (id, patch) =>
        set((state) => {
          const item = state.resume.publications.find((p) => p.id === id);
          if (item) Object.assign(item, patch);
          state.resume.updatedAt = new Date().toISOString();
        }),

      removePublication: (id) =>
        set((state) => {
          pushHistory(state);
          state.resume.publications = state.resume.publications.filter((p) => p.id !== id);
        }),

      addProject: () =>
        set((state) => {
          pushHistory(state);
          state.resume.projects.unshift({
            id: uid('proj'),
            name: 'New Project',
            technologies: ['TypeScript'],
            bullets: ['Built and deployed...'],
            visible: true,
          });
        }),

      updateProject: (id, patch) =>
        set((state) => {
          const item = state.resume.projects.find((p) => p.id === id);
          if (item) Object.assign(item, patch);
          state.resume.updatedAt = new Date().toISOString();
        }),

      removeProject: (id) =>
        set((state) => {
          pushHistory(state);
          state.resume.projects = state.resume.projects.filter((p) => p.id !== id);
        }),

      addSkillGroup: () =>
        set((state) => {
          pushHistory(state);
          state.resume.skills.push({
            id: uid('skill'),
            category: 'New Category',
            items: ['Skill 1', 'Skill 2'],
            visible: true,
          });
        }),

      updateSkillGroup: (id, patch) =>
        set((state) => {
          const item = state.resume.skills.find((s) => s.id === id);
          if (item) Object.assign(item, patch);
          state.resume.updatedAt = new Date().toISOString();
        }),

      removeSkillGroup: (id) =>
        set((state) => {
          pushHistory(state);
          state.resume.skills = state.resume.skills.filter((s) => s.id !== id);
        }),

      addCustomSection: (title) =>
        set((state) => {
          pushHistory(state);
          const id = uid('custom');
          state.resume.customSections[id] = {
            id,
            title,
            entries: [
              {
                id: uid('entry'),
                title: 'New Entry',
                bullets: ['Details...'],
                visible: true,
              },
            ],
          };
          const maxOrder = state.template.sections.reduce(
            (max, s) => Math.max(max, s.order),
            -1
          );
          state.template.sections.push({
            id,
            type: 'custom',
            title,
            visible: true,
            order: maxOrder + 1,
          });
        }),

      removeCustomSection: (sectionId) =>
        set((state) => {
          pushHistory(state);
          delete state.resume.customSections[sectionId];
          state.template.sections = state.template.sections.filter((s) => s.id !== sectionId);
        }),

      addCustomEntry: (sectionId) =>
        set((state) => {
          const sec = state.resume.customSections[sectionId];
          if (!sec) return;
          pushHistory(state);
          sec.entries.unshift({
            id: uid('entry'),
            title: 'New Entry',
            bullets: ['Details...'],
            visible: true,
          });
        }),

      updateCustomEntry: (sectionId, entryId, patch) =>
        set((state) => {
          const entry = state.resume.customSections[sectionId]?.entries.find(
            (e) => e.id === entryId
          );
          if (entry) Object.assign(entry, patch);
        }),

      removeCustomEntry: (sectionId, entryId) =>
        set((state) => {
          const sec = state.resume.customSections[sectionId];
          if (!sec) return;
          pushHistory(state);
          sec.entries = sec.entries.filter((e) => e.id !== entryId);
        }),

      reorderSections: (activeId, overId) =>
        set((state) => {
          if (activeId === overId) return;
          const sorted = [...state.template.sections].sort((a, b) => a.order - b.order);
          const oldIndex = sorted.findIndex((s) => s.id === activeId);
          const newIndex = sorted.findIndex((s) => s.id === overId);
          if (oldIndex === -1 || newIndex === -1) return;
          pushHistory(state);
          const moved = arrayMove(sorted, oldIndex, newIndex).map((s, idx) => ({
            ...s,
            order: idx,
          }));
          state.template.sections = moved;
        }),

      toggleSectionVisibility: (sectionId) =>
        set((state) => {
          const sec = state.template.sections.find((s) => s.id === sectionId);
          if (sec) {
            pushHistory(state);
            sec.visible = !sec.visible;
          }
        }),

      renameSection: (sectionId, title) =>
        set((state) => {
          const sec = state.template.sections.find((s) => s.id === sectionId);
          if (sec) sec.title = title;
          if (state.resume.customSections[sectionId]) {
            state.resume.customSections[sectionId].title = title;
          }
        }),

      setSectionColumn: (sectionId, column) =>
        set((state) => {
          const sec = state.template.sections.find((s) => s.id === sectionId);
          if (sec) {
            pushHistory(state);
            sec.column = column;
          }
        }),

      addPageBreak: () =>
        set((state) => {
          pushHistory(state);
          const maxOrder = state.template.sections.reduce(
            (max, s) => Math.max(max, s.order),
            -1
          );
          state.template.sections.push({
            id: uid('pagebreak'),
            type: 'page_break',
            title: 'Page break',
            visible: true,
            order: maxOrder + 1,
          });
        }),

      removeSection: (sectionId) =>
        set((state) => {
          pushHistory(state);
          state.template.sections = state.template.sections.filter((s) => s.id !== sectionId);
        }),

      reorderItems: (sectionKey, activeId, overId) =>
        set((state) => {
          if (activeId === overId) return;
          const list =
            sectionKey === 'experience'
              ? state.resume.experience
              : sectionKey === 'education'
                ? state.resume.education
                : sectionKey === 'publications'
                  ? state.resume.publications
                  : sectionKey === 'projects'
                    ? state.resume.projects
                    : sectionKey === 'skills'
                      ? state.resume.skills
                      : state.resume.customSections[sectionKey]?.entries;

          if (!list) return;
          const oldIndex = list.findIndex((i) => i.id === activeId);
          const newIndex = list.findIndex((i) => i.id === overId);
          if (oldIndex === -1 || newIndex === -1) return;
          pushHistory(state);
          const reordered = arrayMove(list as { id: string }[], oldIndex, newIndex);
          if (sectionKey === 'experience') state.resume.experience = reordered as typeof state.resume.experience;
          else if (sectionKey === 'education') state.resume.education = reordered as typeof state.resume.education;
          else if (sectionKey === 'publications') state.resume.publications = reordered as typeof state.resume.publications;
          else if (sectionKey === 'projects') state.resume.projects = reordered as typeof state.resume.projects;
          else if (sectionKey === 'skills') state.resume.skills = reordered as typeof state.resume.skills;
          else if (state.resume.customSections[sectionKey]) {
            state.resume.customSections[sectionKey].entries = reordered as CustomSection['entries'];
          }
        }),

      switchTemplate: (templateId, applyTemplateDefaults = true) =>
        set((state) => {
          pushHistory(state);
          state.template.templateId = templateId;
          if (applyTemplateDefaults) {
            const meta = getTemplateMeta(templateId);
            if (meta?.defaultStyle) {
              Object.assign(state.template.style, meta.defaultStyle);
            }
          }
        }),

      setPageSize: (pageSize) =>
        set((state) => {
          state.template.pageSize = pageSize;
        }),

      updateStyleConfig: (patch) =>
        set((state) => {
          Object.assign(state.template.style, patch);
          if (patch.density) {
            if (patch.density === 'compact') {
              state.template.style.fontSizePt = patch.fontSizePt ?? 9.5;
              state.template.style.lineHeight = patch.lineHeight ?? 1.28;
              state.template.style.sectionSpacingPx = patch.sectionSpacingPx ?? 10;
              state.template.style.marginMm = patch.marginMm ?? 11;
            } else if (patch.density === 'spacious') {
              state.template.style.fontSizePt = patch.fontSizePt ?? 10.5;
              state.template.style.lineHeight = patch.lineHeight ?? 1.5;
              state.template.style.sectionSpacingPx = patch.sectionSpacingPx ?? 18;
              state.template.style.marginMm = patch.marginMm ?? 18;
            } else {
              state.template.style.fontSizePt = patch.fontSizePt ?? 10;
              state.template.style.lineHeight = patch.lineHeight ?? 1.4;
              state.template.style.sectionSpacingPx = patch.sectionSpacingPx ?? 14;
              state.template.style.marginMm = patch.marginMm ?? 14;
            }
          }
        }),

      setAIConfig: (patch) =>
        set((state) => {
          Object.assign(state.aiConfig, patch);
        }),

      applyAIDesignPatch: (patch) =>
        set((state) => {
          pushHistory(state);
          if (patch.templateId && getTemplateMeta(patch.templateId)) {
            state.template.templateId = patch.templateId;
          }
          if (patch.pageSize) {
            state.template.pageSize = patch.pageSize;
          }
          if (patch.style) {
            Object.assign(state.template.style, patch.style);
          }
          if (patch.sectionVisibility) {
            for (const sec of state.template.sections) {
              if (patch.sectionVisibility[sec.id] !== undefined) {
                sec.visible = patch.sectionVisibility[sec.id];
              }
            }
          }
          if (patch.sectionTitles) {
            for (const sec of state.template.sections) {
              if (patch.sectionTitles[sec.id]) {
                sec.title = patch.sectionTitles[sec.id];
              }
            }
          }
          if (patch.sectionOrder && patch.sectionOrder.length > 0) {
            const orderMap = new Map(patch.sectionOrder.map((id, idx) => [id, idx]));
            const fallbackStart = patch.sectionOrder.length;
            let extraIdx = 0;
            const updated: SectionConfig[] = state.template.sections.map((sec) => ({
              ...sec,
              order: orderMap.has(sec.id) ? orderMap.get(sec.id)! : fallbackStart + extraIdx++,
            }));
            state.template.sections = updated.sort((a, b) => a.order - b.order);
          }
          if (patch.contentUpdates) {
            const cu = patch.contentUpdates;
            if (cu.headline !== undefined) state.resume.profile.headline = cu.headline;
            if (cu.summary !== undefined) state.resume.summary = cu.summary;
            if (cu.skillsToAdd) {
              for (const group of cu.skillsToAdd) {
                const existing = state.resume.skills.find(
                  (s) => s.category.toLowerCase() === group.category.toLowerCase()
                );
                if (existing) {
                  const merged = Array.from(new Set([...existing.items, ...group.items]));
                  existing.items = merged;
                } else {
                  state.resume.skills.push({
                    id: uid('skill'),
                    category: group.category,
                    items: group.items,
                    visible: true,
                  });
                }
              }
            }
            if (cu.rewrittenBullets) {
              for (const rw of cu.rewrittenBullets) {
                if (rw.section === 'experience') {
                  const item = state.resume.experience.find((e) => e.id === rw.itemId);
                  if (item) item.bullets = rw.bullets;
                } else if (rw.section === 'projects') {
                  const item = state.resume.projects.find((p) => p.id === rw.itemId);
                  if (item) item.bullets = rw.bullets;
                }
              }
            }
          }
          state.resume.updatedAt = new Date().toISOString();
        }),

      undo: () =>
        set((state) => {
          const previous = state.past.pop();
          if (!previous) return;
          state.future.push({
            resume: JSON.parse(JSON.stringify(state.resume)),
            template: JSON.parse(JSON.stringify(state.template)),
          });
          state.resume = previous.resume;
          state.template = previous.template;
        }),

      redo: () =>
        set((state) => {
          const next = state.future.pop();
          if (!next) return;
          state.past.push({
            resume: JSON.parse(JSON.stringify(state.resume)),
            template: JSON.parse(JSON.stringify(state.template)),
          });
          state.resume = next.resume;
          state.template = next.template;
        }),
    })),
    {
      name: 'resumevix-storage-v1',
      partialize: (state) => ({
        resume: state.resume,
        template: state.template,
        editorTheme: state.editorTheme,
        hasLocalEdits: state.hasLocalEdits,
        aiConfig: state.aiConfig.persistKeyInLocalStorage
          ? state.aiConfig
          : { ...state.aiConfig, apiKey: '' },
      }),
    }
  )
);
