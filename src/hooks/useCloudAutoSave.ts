'use client';

import { useEffect, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useResumeStore } from '@/store/useResumeStore';
import { migrateGuestDraftToCloud, updateCloudResume } from '@/lib/sync/resumes';

const DEBOUNCE_MS = 1000;

export function useCloudAutoSave() {
  const authUser = useResumeStore((s) => s.authUser);
  const activeResumeId = useResumeStore((s) => s.activeResumeId);
  const resume = useResumeStore((s) => s.resume);
  const template = useResumeStore((s) => s.template);
  const syncStatus = useResumeStore((s) => s.syncStatus);

  const setAuthUser = useResumeStore((s) => s.setAuthUser);
  const setSyncState = useResumeStore((s) => s.setSyncState);
  const loadCloudResume = useResumeStore((s) => s.loadCloudResume);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSyncRef = useRef(false);

  // Hydrate Supabase Auth session & run guest-to-cloud migration on login
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const handleSession = async (user: { id: string; email?: string; user_metadata?: Record<string, string> } | null) => {
      if (!user) {
        setAuthUser(null);
        setSyncState('guest', null);
        return;
      }

      setAuthUser({
        id: user.id,
        email: user.email || '',
        fullName: user.user_metadata?.full_name,
      });

      const state = useResumeStore.getState();
      if (!state.activeResumeId) {
        try {
          setSyncState('saving');
          const record = await migrateGuestDraftToCloud(
            supabase,
            user.id,
            state.resume,
            state.template,
            state.hasLocalEdits
          );
          if (record) {
            skipNextSyncRef.current = true;
            loadCloudResume(record.id, record.resume_data, record.template_config);
          }
          setSyncState('saved', new Date().toISOString());
        } catch {
          setSyncState('error');
        }
      }
    };

    supabase.auth.getUser().then(({ data }) => handleSession(data.user));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session?.user ?? null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [setAuthUser, setSyncState, loadCloudResume]);

  // 1000ms debounced cloud auto-save
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !authUser || !activeResumeId) return;

    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    setSyncState('unsaved');
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setSyncState('saving');
      try {
        await updateCloudResume(supabase, activeResumeId, resume, template);
        setSyncState('saved', new Date().toISOString());
      } catch {
        setSyncState('error');
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resume, template, authUser, activeResumeId, setSyncState]);

  // Warn before closing tab if unsaved cloud changes are in flight
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (syncStatus === 'unsaved' || syncStatus === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [syncStatus]);
}
