'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Archive,
  Copy,
  FilePlus2,
  Loader2,
  LogOut,
  Trash2,
} from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import { useCloudAutoSave } from '@/hooks/useCloudAutoSave';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { AuthGate } from '@/components/auth/AuthGate';
import { getTemplateMeta } from '@/templates/registry';
import {
  CloudResumeRecord,
  createCloudResume,
  deleteCloudResume,
  listCloudResumes,
  setCloudResumeArchived,
} from '@/lib/sync/resumes';

export default function DashboardPage() {
  useCloudAutoSave();

  const router = useRouter();
  const authUser = useResumeStore((s) => s.authUser);
  const authChecking = useResumeStore((s) => s.authChecking);
  const resume = useResumeStore((s) => s.resume);
  const template = useResumeStore((s) => s.template);
  const loadCloudResume = useResumeStore((s) => s.loadCloudResume);

  const [cloudResumes, setCloudResumes] = useState<CloudResumeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const refreshCloud = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !authUser) return;
    setLoading(true);
    try {
      const list = await listCloudResumes(supabase, authUser.id);
      setCloudResumes(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCloud();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  const handleDuplicate = async (item: CloudResumeRecord) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !authUser) return;
    await createCloudResume(
      supabase,
      authUser.id,
      { ...item.resume_data, title: `${item.title} (Copy)` },
      item.template_config,
      `${item.title} (Copy)`
    );
    await refreshCloud();
  };

  const handleArchiveToggle = async (item: CloudResumeRecord) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await setCloudResumeArchived(supabase, item.id, !item.is_archived);
    await refreshCloud();
  };

  const handleDelete = async (id: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await deleteCloudResume(supabase, id);
    await refreshCloud();
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

  const visibleResumes = cloudResumes.filter((r) => (showArchived ? true : !r.is_archived));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 sm:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/icon.png"
              alt="ResumeVix"
              className="w-9 h-9 rounded-xl object-cover shadow-sm"
            />
            <div>
              <h1 className="text-lg font-bold tracking-tight">My Resumes & CVs</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {authUser ? `Signed in as ${authUser.email}` : 'Guest Mode (Local Draft)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {authUser && (
              <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="accent-teal-600"
                />
                <span>Show archived</span>
              </label>
            )}
            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>New Resume</span>
            </Link>
            {authUser && (
              <button
                type="button"
                onClick={async () => {
                  const sb = getSupabaseBrowserClient();
                  if (sb) await sb.auth.signOut();
                  router.replace('/');
                }}
                title="Sign Out"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {!authUser ? (
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-sm">{resume.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Template: {template.templateId} • Local Browser Storage
              </p>
            </div>
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-medium"
            >
              Open in Editor
            </Link>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 gap-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading cloud resumes...</span>
          </div>
        ) : visibleResumes.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center space-y-3">
            <h2 className="font-semibold text-sm">No saved resumes yet</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Create your first ATS resume or academic CV from 21+ customizable templates.
            </p>
            <div>
              <Link
                href="/create"
                className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
              >
                <FilePlus2 className="w-4 h-4" />
                <span>Create Your First Resume</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleResumes.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-sm line-clamp-1">{item.title}</h2>
                    {item.is_archived && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        Archived
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Template: <span className="font-medium">{getTemplateMeta(item.template_id).name}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Updated {new Date(item.updated_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      loadCloudResume(item.id, item.resume_data, item.template_config);
                      router.push('/');
                    }}
                    className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    Open Editor
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDuplicate(item)}
                      title="Duplicate"
                      className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArchiveToggle(item)}
                      title={item.is_archived ? 'Unarchive' : 'Archive'}
                      className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      title="Delete"
                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
