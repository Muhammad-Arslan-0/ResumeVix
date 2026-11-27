'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileUp,
  FolderKanban,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  Moon,
  Redo2,
  Sparkles,
  Sun,
  Undo2,
} from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import { exportResumeToJson, parseImportedJson } from '@/lib/export/json';
import { downloadResumePdf } from '@/lib/export/pdf';
import { parsePdfToResumeData } from '@/lib/import/pdfParser';
import { parseWordToResumeData } from '@/lib/import/wordParser';
import { getProviderMeta } from '@/lib/ai/providers';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { SyncStatusBadge } from './SyncStatusBadge';

interface TopToolbarProps {
  onOpenAISettings: () => void;
  onOpenAuth: () => void;
  mobileView: 'editor' | 'preview';
  onToggleMobileView: (view: 'editor' | 'preview') => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  onOpenAISettings,
  onOpenAuth,
  mobileView,
  onToggleMobileView,
}) => {
  const resume = useResumeStore((s) => s.resume);
  const template = useResumeStore((s) => s.template);
  const aiConfig = useResumeStore((s) => s.aiConfig);
  const authUser = useResumeStore((s) => s.authUser);
  const editorTheme = useResumeStore((s) => s.editorTheme);
  const pastCount = useResumeStore((s) => s.past.length);
  const futureCount = useResumeStore((s) => s.future.length);

  const toggleEditorTheme = useResumeStore((s) => s.toggleEditorTheme);
  const updateResumeTitle = useResumeStore((s) => s.updateResumeTitle);
  const setPageSize = useResumeStore((s) => s.setPageSize);
  const loadPreset = useResumeStore((s) => s.loadPreset);
  const importResumeBundle = useResumeStore((s) => s.importResumeBundle);
  const undo = useResumeStore((s) => s.undo);
  const redo = useResumeStore((s) => s.redo);

  const jsonInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const wordInputRef = useRef<HTMLInputElement>(null);
  const importMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importMenuOpen, setImportMenuOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    if (!exportMenuOpen && !importMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
      if (importMenuRef.current && !importMenuRef.current.contains(e.target as Node)) {
        setImportMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExportMenuOpen(false);
        setImportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [exportMenuOpen, importMenuOpen]);

  const providerMeta = getProviderMeta(aiConfig.provider);
  const hasKey = Boolean(aiConfig.apiKey.trim()) || aiConfig.provider === 'custom';

  const handleImportByKind = async (
    kind: 'pdf' | 'word' | 'json',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setIsImporting(true);
    try {
      if (kind === 'json') {
        const { resume: importedResume, template: importedTemplate } =
          await parseImportedJson(file);
        importResumeBundle(importedResume, importedTemplate);
      } else {
        const { data } =
          kind === 'pdf'
            ? await parsePdfToResumeData(file, aiConfig)
            : await parseWordToResumeData(file, aiConfig);

        const nextTemplate =
          data.languages && data.languages.length > 0
            ? {
                ...template,
                sections: template.sections.map((s) =>
                  s.id === 'languages' ? { ...s, visible: true } : s
                ),
              }
            : template;

        importResumeBundle(data, nextTemplate);
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : `Failed to import ${kind.toUpperCase()}`);
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  return (
    <header className="no-print h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 sm:px-5 flex items-center justify-between gap-2 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <img
            src="/icon.png"
            alt="ResumeVix"
            className="w-7 h-7 rounded-lg object-cover shadow-sm"
          />
          <input
            value={resume.title}
            onChange={(e) => updateResumeTitle(e.target.value)}
            aria-label="Resume Title"
            className="hidden sm:block text-xs font-semibold tracking-tight text-slate-900 dark:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-teal-500 rounded px-2 py-1 w-40 md:w-52 truncate"
          />
        </div>

        <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => loadPreset('tech')}
            className="px-2.5 py-1 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
            title="Load Tech ATS Resume Preset"
          >
            Tech ATS
          </button>
          <button
            type="button"
            onClick={() => loadPreset('academic')}
            className="px-2.5 py-1 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
            title="Load Academic CV Preset"
          >
            Academic CV
          </button>
        </div>

        <div className="flex lg:hidden items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => onToggleMobileView('editor')}
            className={`px-2.5 py-1 rounded-md transition ${
              mobileView === 'editor'
                ? 'bg-white dark:bg-slate-700 font-medium shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Editor
          </button>
          <button
            type="button"
            onClick={() => onToggleMobileView('preview')}
            className={`px-2.5 py-1 rounded-md transition ${
              mobileView === 'preview'
                ? 'bg-white dark:bg-slate-700 font-medium shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <SyncStatusBadge />

        {importError && (
          <span className="text-xs text-red-600 dark:text-red-400 hidden xl:inline">
            {importError}
          </span>
        )}

        <Link
          href="/create"
          title="Create New Resume"
          className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <span>+ New</span>
        </Link>

        <Link
          href="/dashboard"
          title="My Resumes Dashboard"
          className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Resumes</span>
        </Link>

        {authUser ? (
          <button
            type="button"
            onClick={async () => {
              const sb = getSupabaseBrowserClient();
              if (sb) await sb.auth.signOut();
            }}
            title={`Signed in as ${authUser.email} (Click to sign out)`}
            className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            title="Sign in or Sign up for Cloud Sync"
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}

        <div className="hidden sm:flex items-center gap-0.5 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
          <button
            type="button"
            onClick={undo}
            disabled={pastCount === 0}
            aria-label="Undo"
            title="Undo"
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={futureCount === 0}
            aria-label="Redo"
            title="Redo"
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <select
          aria-label="Page Size"
          value={template.pageSize}
          onChange={(e) => setPageSize(e.target.value as 'A4' | 'LETTER')}
          className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-800 dark:text-slate-200"
        >
          <option value="A4">A4</option>
          <option value="LETTER">US Letter</option>
        </select>

        <button
          type="button"
          onClick={onOpenAISettings}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition ${
            hasKey
              ? 'border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300'
              : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
          }`}
          title="Configure BYOK AI Provider & Model"
        >
          {hasKey ? <Sparkles className="w-3.5 h-3.5" /> : <KeyRound className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">{providerMeta.label}</span>
        </button>

        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => handleImportByKind('pdf', e)}
          className="hidden"
        />
        <input
          ref={wordInputRef}
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => handleImportByKind('word', e)}
          className="hidden"
        />
        <input
          ref={jsonInputRef}
          type="file"
          accept="application/json,.json"
          onChange={(e) => handleImportByKind('json', e)}
          className="hidden"
        />

        <div ref={importMenuRef} className="relative">
          <button
            type="button"
            disabled={isImporting}
            onClick={() => setImportMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={importMenuOpen}
            title="Import CV from PDF, Word, or JSON"
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60 transition"
          >
            {isImporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileUp className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {isImporting ? 'Importing...' : 'Import CV'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          {importMenuOpen && (
            <div
              role="menu"
              aria-label="Import CV options"
              className="absolute right-0 mt-1.5 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1.5 z-50"
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

        <button
          type="button"
          onClick={toggleEditorTheme}
          aria-label="Toggle editor theme"
          title="Toggle Dark/Light Theme"
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {editorTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div ref={exportMenuRef} className="relative">
          <button
            type="button"
            disabled={isExportingPdf}
            onClick={() => setExportMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={exportMenuOpen}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-70 text-white shadow-sm transition"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isExportingPdf ? 'Exporting...' : 'Export'}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-90" />
          </button>

          {exportMenuOpen && (
            <div
              role="menu"
              aria-label="Export options"
              className="absolute right-0 mt-1.5 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1.5 z-50"
            >
              <button
                type="button"
                role="menuitem"
                onClick={async () => {
                  setExportMenuOpen(false);
                  setIsExportingPdf(true);
                  setImportError(null);
                  try {
                    await downloadResumePdf(
                      template.pageSize,
                      `${resume.profile.fullName || 'ResumeVix'}_CV`,
                      {
                        xMm: template.style.marginXMm ?? template.style.marginMm,
                        yMm: template.style.marginYMm ?? template.style.marginMm,
                      }
                    );
                  } catch (err) {
                    setImportError(
                      err instanceof Error ? err.message : 'Failed to export PDF'
                    );
                  } finally {
                    setIsExportingPdf(false);
                  }
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <div>
                  <div className="font-medium">Save as PDF</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Direct PDF ({template.pageSize === 'A4' ? 'A4' : 'US Letter'})
                  </div>
                </div>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setExportMenuOpen(false);
                  exportResumeToJson(resume, template);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <FileJson className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                <div>
                  <div className="font-medium">Save as JSON</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Portable resume backup
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
