'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, FilePlus2, Loader2 } from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import { useCloudAutoSave } from '@/hooks/useCloudAutoSave';
import { isSupabaseConfigured, getSupabaseBrowserClient } from '@/lib/supabase/client';
import { AuthGate } from '@/components/auth/AuthGate';
import { TEMPLATE_REGISTRY, getTemplateMeta } from '@/templates/registry';
import {
  ACADEMIC_CV_PRESET,
  DEFAULT_TEMPLATE_CONFIG,
  TECH_RESUME_PRESET,
} from '@/data/presets';
import { createCloudResume } from '@/lib/sync/resumes';
import { PageSize, ResumeData, TemplateConfig } from '@/types';

type StartingPreset = 'tech' | 'academic' | 'blank';

export default function CreateResumePage() {
  useCloudAutoSave();

  const router = useRouter();
  const authUser = useResumeStore((s) => s.authUser);
  const authChecking = useResumeStore((s) => s.authChecking);
  const loadCloudResume = useResumeStore((s) => s.loadCloudResume);
  const importResumeBundle = useResumeStore((s) => s.importResumeBundle);

  const [title, setTitle] = useState('My New Resume');
  const [preset, setPreset] = useState<StartingPreset>('tech');
  const [templateId, setTemplateId] = useState('ats-minimal');
  const [pageSize, setPageSize] = useState<PageSize>('A4');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const baseResume: ResumeData =
        preset === 'academic'
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

      baseResume.id = `resume-${Date.now()}`;
      baseResume.title = title.trim() || 'Untitled Resume';
      baseResume.updatedAt = new Date().toISOString();

      const meta = getTemplateMeta(templateId);
      const baseConfig: TemplateConfig = {
        ...JSON.parse(JSON.stringify(DEFAULT_TEMPLATE_CONFIG)),
        templateId,
        pageSize,
      };
      if (meta?.defaultStyle) {
        Object.assign(baseConfig.style, meta.defaultStyle);
      }
      if (preset === 'academic') {
        const pubSec = baseConfig.sections.find((s) => s.id === 'publications');
        if (pubSec) pubSec.visible = true;
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create resume');
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
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
            </div>
          </div>

          {/* Template Picker */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              2. Choose Template ({TEMPLATE_REGISTRY.length} available)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {TEMPLATE_REGISTRY.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateId(t.id)}
                  className={`text-left p-3 rounded-xl border text-xs transition ${
                    templateId === t.id
                      ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/30 ring-1 ring-teal-600'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 font-semibold">
                    <span>{t.name}</span>
                    {templateId === t.id && <Check className="w-3.5 h-3.5 text-teal-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {t.description}
                  </p>
                </button>
              ))}
            </div>
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
