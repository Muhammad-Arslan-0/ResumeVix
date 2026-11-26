import { SupabaseClient } from '@supabase/supabase-js';
import { ResumeData, TemplateConfig } from '@/types';

export interface CloudResumeRecord {
  id: string;
  user_id: string;
  title: string;
  template_id: string;
  resume_data: ResumeData;
  template_config: TemplateConfig;
  is_archived: boolean;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export async function listCloudResumes(
  supabase: SupabaseClient,
  userId: string
): Promise<CloudResumeRecord[]> {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CloudResumeRecord[];
}

export async function createCloudResume(
  supabase: SupabaseClient,
  userId: string,
  resume: ResumeData,
  template: TemplateConfig,
  titleOverride?: string
): Promise<CloudResumeRecord> {
  const { data, error } = await supabase
    .from('resumes')
    .insert({
      user_id: userId,
      title: titleOverride ?? resume.title ?? 'Untitled Resume',
      template_id: template.templateId,
      resume_data: resume,
      template_config: template,
    })
    .select()
    .single();
  if (error) throw error;
  return data as CloudResumeRecord;
}

export async function updateCloudResume(
  supabase: SupabaseClient,
  resumeId: string,
  resume: ResumeData,
  template: TemplateConfig
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('resumes')
    .update({
      title: resume.title,
      template_id: template.templateId,
      resume_data: resume,
      template_config: template,
      last_synced_at: now,
      updated_at: now,
    })
    .eq('id', resumeId);
  if (error) throw error;
}

export async function deleteCloudResume(
  supabase: SupabaseClient,
  resumeId: string
): Promise<void> {
  const { error } = await supabase.from('resumes').delete().eq('id', resumeId);
  if (error) throw error;
}

export async function setCloudResumeArchived(
  supabase: SupabaseClient,
  resumeId: string,
  isArchived: boolean
): Promise<void> {
  const { error } = await supabase
    .from('resumes')
    .update({ is_archived: isArchived, updated_at: new Date().toISOString() })
    .eq('id', resumeId);
  if (error) throw error;
}

/**
 * Conflict-free Guest-to-Cloud migration:
 * If the guest has unsynced local edits, insert their draft as a new cloud resume
 * rather than overwriting existing cloud drafts.
 */
export async function migrateGuestDraftToCloud(
  supabase: SupabaseClient,
  userId: string,
  localResume: ResumeData,
  localTemplate: TemplateConfig,
  hasLocalEdits: boolean
): Promise<CloudResumeRecord | null> {
  const existing = await listCloudResumes(supabase, userId);

  if (hasLocalEdits || existing.length === 0) {
    const title =
      existing.length > 0 ? `${localResume.title || 'Resume'} (Local Draft)` : localResume.title;
    return await createCloudResume(supabase, userId, localResume, localTemplate, title);
  }

  return existing[0] ?? null;
}
