'use client';

import React from 'react';
import { Cloud, CloudOff, Loader2, AlertTriangle, Check } from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';

export const SyncStatusBadge: React.FC = () => {
  const syncStatus = useResumeStore((s) => s.syncStatus);
  const lastSavedAt = useResumeStore((s) => s.lastSavedAt);

  if (syncStatus === 'guest') {
    return (
      <span
        title="Edits are saved locally in your browser. Sign in to sync to cloud."
        className="hidden xl:inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
      >
        <CloudOff className="w-3 h-3" />
        <span>Guest (Local)</span>
      </span>
    );
  }

  if (syncStatus === 'saving') {
    return (
      <span className="hidden xl:inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Saving...</span>
      </span>
    );
  }

  if (syncStatus === 'unsaved') {
    return (
      <span className="hidden xl:inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
        <Cloud className="w-3 h-3" />
        <span>Unsaved...</span>
      </span>
    );
  }

  if (syncStatus === 'error') {
    return (
      <span className="hidden xl:inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300">
        <AlertTriangle className="w-3 h-3" />
        <span>Sync error</span>
      </span>
    );
  }

  return (
    <span
      title={lastSavedAt ? `Last saved at ${new Date(lastSavedAt).toLocaleTimeString()}` : 'Synced'}
      className="hidden xl:inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
    >
      <Check className="w-3 h-3" />
      <span>All changes saved</span>
    </span>
  );
};
