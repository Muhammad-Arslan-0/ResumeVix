'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  FileJson,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  FileUp,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import { useCloudAutoSave } from '@/hooks/useCloudAutoSave';
import { isSupabaseConfigured, getSupabaseBrowserClient } from '@/lib/supabase/client';
import { AuthGate } from '@/components/auth/AuthGate';
import { getTemplateMeta } from '@/templates/registry';
import {
  ACADEMIC_CV_PRESET,
  DEFAULT_TEMPLATE_CONFIG,
  TECH_RESUME_PRESET,
} from '@/data/presets';
import { createCloudResume } from '@/lib/sync/resumes';
import { parsePdfToResumeData } from '@/lib/import/pdfParser';
import { parseWordToResumeData } from '@/lib/import/wordParser';
import { parseImportedJson } from '@/lib/export/json';
import { PageSize, ResumeData, TemplateConfig } from '@/types';

type StartingPreset = 'tech' | 'academic' | 'blank' | 'pdf';

export default function CreateResumePage() {
  useCloudAutoSave();

  const router = useRouter();
  const authUser = useResumeStore((s) => s.authUser);
  const authChecking = useResumeStore((s) => s.authChecking);
  const aiConfig = useResumeStore((s) => s.aiConfig);
  const loadCloudResume = useResumeStore((s) => s.loadCloudResume);
  const importResumeBundle = useResumeStore((s) => s.importResumeBundle);

  const [title, setTitle] = useState('My New Resume');
  const [preset, setPreset] = useState<StartingPreset>('tech');
  const [pageSize, setPageSize] = useState<PageSize>('A4');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const wordInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const importMenuRef = useRef<HTMLDivElement>(null);
  const [importMenuOpen, setImportMenuOpen] = useState(false);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [importedResume, setImportedResume] = useState<ResumeData | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  useEffect(() => {
    if (!importMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (importMenuRef.current && !importMenuRef.current.contains(e.target as Node)) {
        setImportMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setImportMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [importMenuOpen]);

  const createAndOpenStudio = async (
    baseResume: ResumeData,
    chosenTitle: string,
    chosenPreset: StartingPreset,
    overrideTemplate?: TemplateConfig
  ) => {
    baseResume.id = `resume-${Date.now()}`;
    baseResume.title = chosenTitle.trim() || 'Untitled Resume';
    baseResume.updatedAt = new Date().toISOString();

    const chosenTemplateId = chosenPreset === 'academic' ? 'academic-cv' : 'ats-minimal';
    const meta = getTemplateMeta(chosenTemplateId);
    const baseConfig: TemplateConfig = overrideTemplate
      ? JSON.parse(JSON.stringify(overrideTemplate))
      : {
          ...JSON.parse(JSON.stringify(DEFAULT_TEMPLATE_CONFIG)),
          templateId: chosenTemplateId,
          pageSize,
        };
    if (!overrideTemplate && meta?.defaultStyle) {
      Object.assign(baseConfig.style, meta.defaultStyle);
    }
    if (chosenPreset === 'academic') {
      const pubSec = baseConfig.sections.find((s) => s.id === 'publications');
      if (pubSec) pubSec.visible = true;
    }
    if (baseResume.languages && baseResume.languages.length > 0) {
      const langSec = baseConfig.sections.find((s) => s.id === 'languages');
      if (langSec) langSec.visible = true;
    }

    const supabase = getSupabaseBrowserClient();
    if (supabase && authUser) {
      const record = await createCloudResume(
        supabase,
        authUser.id,
        baseResume,
        baseConfig,
        baseResume.title
      );
      loadCloudResume(record.id, record.resume_data, record.template_config);
    } else {
      importResumeBundle(baseResume, baseConfig);
    }

    router.push('/');
  };

  const handleImportUpload = async (
    kind: 'pdf' | 'word' | 'json',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfParsing(true);
    setError(null);
    setImportSummary(null);
    try {
      if (kind === 'json') {
        const { resume: jsonResume, template: jsonTemplate } =
          await parseImportedJson(file);
        setImportedResume(jsonResume);
        setPreset('pdf');
        const finalTitle =
          title === 'My New Resume' && jsonResume.title ? jsonResume.title : title;
        setTitle(finalTitle);
        await createAndOpenStudio(jsonResume, finalTitle, 'pdf', jsonTemplate);
      } else {
        const { data } =
          kind === 'pdf'
            ? await parsePdfToResumeData(file, aiConfig)
            : await parseWordToResumeData(file, aiConfig);
        setImportedResume(data);
        setPreset('pdf');
        const finalTitle = title === 'My New Resume' && data.title ? data.title : title;
        setTitle(finalTitle);
        await createAndOpenStudio(data, finalTitle, 'pdf');
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message || `Failed to import ${kind.toUpperCase()}`;
      setError(msg);
      setPdfParsing(false);
    } finally {
      e.target.value = '';
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  if (isSupabaseConfigured() && !authUser) {
    return <AuthGate />;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      if (preset === 'pdf' && !importedResume) {
        throw new Error('Please upload a PDF CV first or choose another starting option.');
      }

      const baseResume: ResumeData =
        preset === 'pdf' && importedResume
          ? JSON.parse(JSON.stringify(importedResume))
          : preset === 'academic'
            ? JSON.parse(JSON.stringify(ACADEMIC_CV_PRESET))
            : preset === 'tech'
              ? JSON.parse(JSON.stringify(TECH_RESUME_PRESET))
              : {
                id: `resume-${Date.now()}`,
                title: title.trim() || 'Untitled Resume',
                updatedAt: new Date().toISOString(),
                profile: {
                  fullName: authUser?.fullName || '',
                  headline: '',
                  email: authUser?.email || '',
                  phone: '',
                  location: '',
                },
                summary: '',
                experience: [],
                education: [],
                publications: [],
                projects: [],
                skills: [],
                customSections: {},
              };

      await createAndOpenStudio(baseResume, title, preset);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message || 'Failed to create resume';
      setError(msg);
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 sm:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Resumes</span>
            </Link>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Create New Resume / CV</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose a starting structure and template to open in the studio.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Title & Page Size */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1.5">Resume Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Senior Backend Engineer — 2026"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1.5">Page Format</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as PageSize)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
              >
                <option value="A4">A4 (210 × 297 mm)</option>
                <option value="LETTER">US Letter (8.5 × 11 in)</option>
              </select>
            </div>
          </div>

          {/* Starting Content Preset */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              1. Starting Content
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {(
                [
                  {
                    id: 'tech',
                    label: 'Tech ATS Sample',
                    desc: 'Pre-filled with engineering experience, projects, and skills.',
                  },
                  {
                    id: 'academic',
                    label: 'Academic CV Sample',
                    desc: 'Includes publications, thesis, ORCID, and grants sections.',
                  },
                  {
                    id: 'blank',
                    label: 'Blank Canvas',
                    desc: 'Start completely fresh with your name and email.',
                  },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPreset(item.id)}
                  className={`text-left p-3.5 rounded-xl border transition ${
                    preset === item.id
                      ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/30 ring-1 ring-teal-600'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold flex items-center justify-between">
                    <span>{item.label}</span>
                    {preset === item.id && <Check className="w-3.5 h-3.5 text-teal-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {item.desc}
                  </p>
                </button>
              ))}

              {/* Import Previous CV (PDF / Word / JSON) */}
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => handleImportUpload('pdf', e)}
                className="hidden"
              />
              <input
                ref={wordInputRef}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => handleImportUpload('word', e)}
                className="hidden"
              />
              <input
                ref={jsonInputRef}
                type="file"
                accept="application/json,.json"
                onChange={(e) => handleImportUpload('json', e)}
                className="hidden"
              />
              <div ref={importMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setImportMenuOpen((prev) => !prev)}
                  disabled={pdfParsing}
                  aria-haspopup="menu"
                  aria-expanded={importMenuOpen}
                  className={`w-full h-full text-left p-3.5 rounded-xl border transition ${
                    preset === 'pdf'
                      ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/30 ring-1 ring-teal-600'
                      : 'border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500'
                  }`}
                >
                  <div className="font-semibold flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5">
                      {pdfParsing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                      ) : (
                        <FileUp className="w-3.5 h-3.5 text-teal-600" />
                      )}
                      <span>Import CV</span>
                    </span>
                    {preset === 'pdf' ? (
                      <Check className="w-3.5 h-3.5 text-teal-600" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {pdfParsing
                      ? 'Extracting & autofilling details...'
                      : 'Import from PDF, Word (.docx), or JSON.'}
                  </p>
                </button>

                {importMenuOpen && (
                  <div
                    role="menu"
                    aria-label="Import CV options"
                    className="absolute left-0 right-0 mt-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1.5 z-40"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setImportMenuOpen(false);
                        pdfInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                      <div>
                        <div className="font-medium">From PDF</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Extract & autofill (.pdf)
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setImportMenuOpen(false);
                        wordInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <div>
                        <div className="font-medium">From Word</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Word document (.docx)
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setImportMenuOpen(false);
                        jsonInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <FileJson className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                      <div>
                        <div className="font-medium">From JSON</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          ResumeVix backup (.json)
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {importSummary && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-teal-800 dark:text-teal-200">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>{importSummary}</span>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FilePlus2 className="w-4 h-4" />
              )}
              <span>Create & Open Studio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
