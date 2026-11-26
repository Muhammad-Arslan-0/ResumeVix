'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Loader2, Palette, Wand2 } from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import { TopToolbar } from '@/components/toolbar/TopToolbar';
import { ContentEditor } from '@/components/editor/ContentEditor';
import { DesignPanel } from '@/components/design/DesignPanel';
import { DesignBySelfPanel } from '@/components/ai/DesignBySelfPanel';
import { PreviewCanvas } from '@/components/preview/PreviewCanvas';
import { AISettingsModal } from '@/components/modals/AISettingsModal';
import { AuthModal } from '@/components/modals/AuthModal';
import { AuthGate } from '@/components/auth/AuthGate';
import { useCloudAutoSave } from '@/hooks/useCloudAutoSave';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export default function ResumeVixWorkspace() {
  useCloudAutoSave();

  const authUser = useResumeStore((s) => s.authUser);
  const authChecking = useResumeStore((s) => s.authChecking);
  const editorTheme = useResumeStore((s) => s.editorTheme);
  const activeTab = useResumeStore((s) => s.activeTab);
  const setActiveTab = useResumeStore((s) => s.setActiveTab);

  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  useEffect(() => {
    const root = document.documentElement;
    if (editorTheme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [editorTheme]);

  if (authChecking) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  if (isSupabaseConfigured() && !authUser) {
    return <AuthGate />;
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      <TopToolbar
        onOpenAISettings={() => setAiSettingsOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        mobileView={mobileView}
        onToggleMobileView={setMobileView}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Editor Sidebar */}
        <aside
          className={`no-print w-full lg:w-[440px] xl:w-[480px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col ${
            mobileView === 'editor' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Navigation Tabs */}
          <nav
            aria-label="Editor sections"
            className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-800 p-1.5 gap-1 bg-slate-50/70 dark:bg-slate-950/50 shrink-0"
          >
            <button
              type="button"
              onClick={() => setActiveTab('content')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'content'
                  ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Content</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('design')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'design'
                  ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Templates</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'ai'
                  ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Design by Self</span>
            </button>
          </nav>

          {/* Active Tab Panel */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'content' && (
              <ContentEditor onOpenSettings={() => setAiSettingsOpen(true)} />
            )}
            {activeTab === 'design' && <DesignPanel />}
            {activeTab === 'ai' && (
              <DesignBySelfPanel onOpenSettings={() => setAiSettingsOpen(true)} />
            )}
          </div>
        </aside>

        {/* Right Live Preview Canvas */}
        <main
          className={`flex-1 flex overflow-hidden print-container ${
            mobileView === 'preview' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <PreviewCanvas />
        </main>
      </div>

      <AISettingsModal open={aiSettingsOpen} onClose={() => setAiSettingsOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
