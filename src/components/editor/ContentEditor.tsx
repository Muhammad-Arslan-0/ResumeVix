'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Link2,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import { DragHandle, SortableWrapper } from './SortableWrapper';
import { AddSectionModal } from '@/components/modals/AddSectionModal';
import { executeStructuredAI } from '@/lib/ai/adapter';
import {
  buildRefineSummaryPrompts,
  buildRewriteBulletsPrompts,
  buildSuggestSkillsPrompts,
} from '@/lib/ai/prompts';
import {
  AIRewriteResponseSchema,
  AISkillsResponseSchema,
  AISummaryResponseSchema,
} from '@/lib/ai/schemas';
import { SectionConfig } from '@/types';

const inputClass =
  'w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500';

const PERSONAL_DETAIL_OPTIONS: Array<{ key: string; label: string; placeholder: string }> = [
  { key: 'nationality', label: 'Nationality', placeholder: 'e.g. Pakistani' },
  { key: 'dob', label: 'Date of Birth', placeholder: 'e.g. 15 May 1998' },
  { key: 'visa', label: 'Visa', placeholder: 'e.g. Work Permit / Citizen' },
  { key: 'passport', label: 'Passport or Id', placeholder: 'e.g. ID / Passport No.' },
  { key: 'availability', label: 'Availability', placeholder: 'e.g. Immediate / 2 weeks notice' },
  { key: 'gender', label: 'Gender/Pronoun', placeholder: 'e.g. He/Him' },
  { key: 'disability', label: 'Disability', placeholder: 'Optional' },
  { key: 'workMode', label: 'Work mode', placeholder: 'e.g. Remote / Hybrid / On-site' },
  { key: 'relocation', label: 'Relocation', placeholder: 'e.g. Open to relocate' },
  { key: 'expectedSalary', label: 'Expected salary', placeholder: 'e.g. \$90,000 / year' },
  { key: 'secondPhone', label: 'Second phone', placeholder: 'e.g. +1 555 0199' },
  { key: 'drivingLicense', label: 'Driving License', placeholder: 'e.g. Full / Class B' },
  { key: 'securityClearance', label: 'Security clearance', placeholder: 'e.g. Secret' },
  { key: 'maritalStatus', label: 'Marital status', placeholder: 'e.g. Single / Married' },
  { key: 'militaryService', label: 'Military Service', placeholder: 'e.g. Completed / Exempt' },
  { key: 'smoking', label: 'Smoking', placeholder: 'e.g. Non-smoker' },
  { key: 'height', label: 'Height', placeholder: 'e.g. 5\'10"' },
  { key: 'weight', label: 'Weight', placeholder: 'e.g. 72 kg' },
];

const SOCIAL_LINK_OPTIONS: Array<{
  key: string;
  label: string;
  placeholder: string;
  urlPlaceholder: string;
}> = [
  { key: 'threads', label: 'Threads', placeholder: '@username', urlPlaceholder: 'https://threads.net/@username' },
  { key: 'x', label: 'X', placeholder: '@username', urlPlaceholder: 'https://x.com/username' },
  { key: 'discord', label: 'Discord', placeholder: 'username', urlPlaceholder: 'https://discord.com/users/...' },
  { key: 'dribbble', label: 'Dribbble', placeholder: 'dribbble.com/username', urlPlaceholder: 'https://dribbble.com/username' },
  { key: 'behance', label: 'Behance', placeholder: 'behance.net/username', urlPlaceholder: 'https://behance.net/username' },
  { key: 'stackoverflow', label: 'Stack Overflow', placeholder: 'stackoverflow.com/users/...', urlPlaceholder: 'https://stackoverflow.com/users/...' },
  { key: 'gitlab', label: 'GitLab', placeholder: 'gitlab.com/username', urlPlaceholder: 'https://gitlab.com/username' },
  { key: 'quora', label: 'Quora', placeholder: 'quora.com/profile/...', urlPlaceholder: 'https://quora.com/profile/...' },
  { key: 'facebook', label: 'Facebook', placeholder: 'facebook.com/username', urlPlaceholder: 'https://facebook.com/username' },
  { key: 'instagram', label: 'Instagram', placeholder: '@username', urlPlaceholder: 'https://instagram.com/username' },
  { key: 'wechat', label: 'WeChat', placeholder: 'WeChat ID', urlPlaceholder: 'https://wechat.com' },
  { key: 'huggingface', label: 'Hugging Face', placeholder: 'huggingface.co/username', urlPlaceholder: 'https://huggingface.co/username' },
  { key: 'kaggle', label: 'Kaggle', placeholder: 'kaggle.com/username', urlPlaceholder: 'https://kaggle.com/username' },
  { key: 'youtube', label: 'YouTube', placeholder: 'youtube.com/@channel', urlPlaceholder: 'https://youtube.com/@channel' },
  { key: 'tiktok', label: 'TikTok', placeholder: '@username', urlPlaceholder: 'https://tiktok.com/@username' },
  { key: 'signal', label: 'Signal', placeholder: 'Signal handle / number', urlPlaceholder: 'https://signal.me/...' },
  { key: 'telegram', label: 'Telegram', placeholder: '@username', urlPlaceholder: 'https://t.me/username' },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: '+1 555 123 4567', urlPlaceholder: 'https://wa.me/...' },
  { key: 'paypal', label: 'PayPal', placeholder: 'paypal.me/username', urlPlaceholder: 'https://paypal.me/username' },
  { key: 'producthunt', label: 'Product Hunt', placeholder: '@username', urlPlaceholder: 'https://producthunt.com/@username' },
  { key: 'artstation', label: 'ArtStation', placeholder: 'artstation.com/username', urlPlaceholder: 'https://artstation.com/username' },
  { key: 'codepen', label: 'CodePen', placeholder: 'codepen.io/username', urlPlaceholder: 'https://codepen.io/username' },
  { key: 'fiverr', label: 'Fiverr', placeholder: 'fiverr.com/username', urlPlaceholder: 'https://fiverr.com/username' },
  { key: 'hashnode', label: 'Hashnode', placeholder: 'hashnode.com/@username', urlPlaceholder: 'https://hashnode.com/@username' },
  { key: 'pluralsight', label: 'Pluralsight', placeholder: 'Pluralsight profile', urlPlaceholder: 'https://app.pluralsight.com/profile/...' },
  { key: 'medium', label: 'Medium', placeholder: '@username', urlPlaceholder: 'https://medium.com/@username' },
  { key: 'devto', label: 'Dev.to', placeholder: 'dev.to/username', urlPlaceholder: 'https://dev.to/username' },
  { key: 'leetcode', label: 'LeetCode', placeholder: 'leetcode.com/username', urlPlaceholder: 'https://leetcode.com/username' },
  { key: 'scholar', label: 'Google Scholar', placeholder: 'Google Scholar profile', urlPlaceholder: 'https://scholar.google.com/citations?user=...' },
  { key: 'orcid', label: 'ORCID', placeholder: 'e.g. 0000-0002-1825-0097', urlPlaceholder: 'https://orcid.org/0000-0002-1825-0097' },
];

export const ContentEditor: React.FC<{ onOpenSettings: () => void }> = ({
  onOpenSettings,
}) => {
  const resume = useResumeStore((s) => s.resume);
  const sections = useResumeStore((s) => s.template.sections);
  const aiConfig = useResumeStore((s) => s.aiConfig);

  const updateProfile = useResumeStore((s) => s.updateProfile);
  const updateSummary = useResumeStore((s) => s.updateSummary);
  const reorderSections = useResumeStore((s) => s.reorderSections);
  const toggleSectionVisibility = useResumeStore((s) => s.toggleSectionVisibility);
  const renameSection = useResumeStore((s) => s.renameSection);
  const reorderItems = useResumeStore((s) => s.reorderItems);

  const addExperience = useResumeStore((s) => s.addExperience);
  const updateExperience = useResumeStore((s) => s.updateExperience);
  const removeExperience = useResumeStore((s) => s.removeExperience);

  const addEducation = useResumeStore((s) => s.addEducation);
  const updateEducation = useResumeStore((s) => s.updateEducation);
  const removeEducation = useResumeStore((s) => s.removeEducation);

  const addPublication = useResumeStore((s) => s.addPublication);
  const updatePublication = useResumeStore((s) => s.updatePublication);
  const removePublication = useResumeStore((s) => s.removePublication);

  const addProject = useResumeStore((s) => s.addProject);
  const updateProject = useResumeStore((s) => s.updateProject);
  const removeProject = useResumeStore((s) => s.removeProject);

  const addSkillGroup = useResumeStore((s) => s.addSkillGroup);
  const updateSkillGroup = useResumeStore((s) => s.updateSkillGroup);
  const removeSkillGroup = useResumeStore((s) => s.removeSkillGroup);

  const addLanguage = useResumeStore((s) => s.addLanguage);
  const updateLanguage = useResumeStore((s) => s.updateLanguage);
  const removeLanguage = useResumeStore((s) => s.removeLanguage);

  const removeCustomSection = useResumeStore((s) => s.removeCustomSection);
  const addCustomEntry = useResumeStore((s) => s.addCustomEntry);
  const updateCustomEntry = useResumeStore((s) => s.updateCustomEntry);
  const removeCustomEntry = useResumeStore((s) => s.removeCustomEntry);
  const [openLinkField, setOpenLinkField] = useState<
    'linkedin' | 'website' | 'github' | 'orcid' | null
  >(null);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [detailsSearch, setDetailsSearch] = useState('');
  const [openExtraLinkId, setOpenExtraLinkId] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    profile: true,
    summary: true,
    experience: true,
  });
  const [editingLangId, setEditingLangId] = useState<string | null>(null);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  const [openEduLinkId, setOpenEduLinkId] = useState<string | null>(null);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [aiBusyId, setAiBusyId] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sortedSections = [...sections]
    .filter((s) => s.type !== 'page_break')
    .sort((a, b) => a.order - b.order);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderSections(String(active.id), String(over.id));
    }
  };

  const handleItemDragEnd = (sectionKey: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderItems(sectionKey, String(active.id), String(over.id));
    }
  };

  const handleRefineSummary = async () => {
    setAiError(null);
    setAiBusyId('summary');
    try {
      const { systemPrompt, userPrompt } = buildRefineSummaryPrompts(resume);
      const res = await executeStructuredAI(
        aiConfig,
        systemPrompt,
        userPrompt,
        AISummaryResponseSchema
      );
      updateSummary(res.summary);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI summary failed');
    } finally {
      setAiBusyId(null);
    }
  };

  const handleRewriteBullets = async (
    section: 'experience' | 'projects',
    itemId: string,
    title: string,
    bullets: string[]
  ) => {
    setAiError(null);
    setAiBusyId(itemId);
    try {
      const { systemPrompt, userPrompt } = buildRewriteBulletsPrompts(
        title,
        bullets,
        resume.profile.headline
      );
      const res = await executeStructuredAI(
        aiConfig,
        systemPrompt,
        userPrompt,
        AIRewriteResponseSchema
      );
      if (section === 'experience') updateExperience(itemId, { bullets: res.bullets });
      else updateProject(itemId, { bullets: res.bullets });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI rewrite failed');
    } finally {
      setAiBusyId(null);
    }
  };

  const handleSuggestSkills = async () => {
    setAiError(null);
    setAiBusyId('skills');
    try {
      const { systemPrompt, userPrompt } = buildSuggestSkillsPrompts(
        resume,
        resume.profile.headline || 'Software Engineer'
      );
      const res = await executeStructuredAI(
        aiConfig,
        systemPrompt,
        userPrompt,
        AISkillsResponseSchema
      );
      for (const grp of res.groups) {
        const existing = resume.skills.find(
          (s) => s.category.toLowerCase() === grp.category.toLowerCase()
        );
        if (existing) {
          updateSkillGroup(existing.id, {
            items: Array.from(new Set([...existing.items, ...grp.items])),
          });
        } else {
          addSkillGroup();
        }
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI skill suggestion failed');
    } finally {
      setAiBusyId(null);
    }
  };

  const renderSectionBody = (sec: SectionConfig) => {
    switch (sec.type) {
      case 'summary':
        return (
          <div className="space-y-2">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleRefineSummary}
                disabled={aiBusyId === 'summary'}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 dark:text-teal-300 hover:underline disabled:opacity-50"
              >
                {aiBusyId === 'summary' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span>AI Refine Summary</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={resume.summary}
              onChange={(e) => updateSummary(e.target.value)}
              placeholder="Write a concise professional or academic summary..."
              className={inputClass}
            />
          </div>
        );

      case 'experience':
        return (
          <div className="space-y-2.5">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleItemDragEnd('experience')}
            >
              <SortableContext
                items={resume.experience.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                {resume.experience.map((exp) => (
                  <SortableWrapper key={exp.id} id={exp.id}>
                    {(handleProps) => (
                      <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <DragHandle {...handleProps} />
                          <input
                            value={exp.role}
                            onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                            placeholder="Role Title"
                            className={`${inputClass} font-medium`}
                          />
                          <button
                            type="button"
                            onClick={() => removeExperience(exp.id)}
                            aria-label="Remove experience"
                            className="p-1 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={exp.company}
                            onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                            placeholder="Company / Institution"
                            className={inputClass}
                          />
                          <input
                            value={exp.location || ''}
                            onChange={(e) => updateExperience(exp.id, { location: e.target.value })}
                            placeholder="Location"
                            className={inputClass}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={exp.startDate}
                            onChange={(e) =>
                              updateExperience(exp.id, { startDate: e.target.value })
                            }
                            placeholder="Start (e.g. 2022-03)"
                            className={inputClass}
                          />
                          <input
                            value={exp.current ? 'Present' : exp.endDate}
                            disabled={exp.current}
                            onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                            placeholder="End"
                            className={inputClass}
                          />
                        </div>
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                          <input
                            type="checkbox"
                            checked={exp.current}
                            onChange={(e) =>
                              updateExperience(exp.id, { current: e.target.checked })
                            }
                            className="accent-teal-600"
                          />
                          <span>Currently working here</span>
                        </label>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] text-slate-500">
                              Bullet points (one per line)
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleRewriteBullets(
                                  'experience',
                                  exp.id,
                                  `${exp.role} at ${exp.company}`,
                                  exp.bullets
                                )
                              }
                              disabled={aiBusyId === exp.id}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 dark:text-teal-300 hover:underline"
                            >
                              {aiBusyId === exp.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Sparkles className="w-3 h-3" />
                              )}
                              <span>AI Rewrite</span>
                            </button>
                          </div>
                          <textarea
                            rows={3}
                            value={exp.bullets.join('\n')}
                            onChange={(e) =>
                              updateExperience(exp.id, {
                                bullets: e.target.value.split('\n'),
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                      </div>
                    )}
                  </SortableWrapper>
                ))}
              </SortableContext>
            </DndContext>
            <button
              type="button"
              onClick={addExperience}
              className="w-full py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Experience</span>
            </button>
          </div>
        );

      case 'education':
        return (
          <div className="space-y-2.5">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleItemDragEnd('education')}
            >
              <SortableContext
                items={resume.education.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                {resume.education.map((edu) => {
                  const isEditing = editingEduId === edu.id;
                  const isLinkOpen = openEduLinkId === edu.id;
                  const hasUrl = Boolean(edu.institutionUrl?.trim());
                  return (
                    <SortableWrapper key={edu.id} id={edu.id}>
                      {(handleProps) => (
                        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 overflow-hidden">
                          <div className="px-2 py-2 flex items-center gap-1.5">
                            <DragHandle {...handleProps} />
                            <button
                              type="button"
                              onClick={() =>
                                setEditingEduId(isEditing ? null : edu.id)
                              }
                              className={`flex-1 text-left text-xs font-medium truncate ${
                                !edu.visible ? 'opacity-45 text-slate-400' : ''
                              }`}
                            >
                              {edu.degree || 'Degree'}
                              {edu.institution && (
                                <span className="font-normal text-slate-500 ml-1.5">
                                  — {edu.institution}
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateEducation(edu.id, { visible: !edu.visible })
                              }
                              aria-label={edu.visible ? 'Hide education' : 'Show education'}
                              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            >
                              {edu.visible ? (
                                <Eye className="w-3.5 h-3.5 text-teal-600" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5 opacity-45" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeEducation(edu.id)}
                              aria-label="Remove education"
                              className="p-1 text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {isEditing && (
                            <div className="p-3 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5 bg-white dark:bg-slate-950/60">
                              <div>
                                <label className="block text-[11px] font-medium mb-1">
                                  Degree
                                </label>
                                <input
                                  value={edu.degree}
                                  onChange={(e) =>
                                    updateEducation(edu.id, { degree: e.target.value })
                                  }
                                  placeholder="e.g. BS Computer Science"
                                  className={`${inputClass} font-medium`}
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-[11px] font-medium">
                                  School
                                </label>
                                <div className="relative flex items-center">
                                  <input
                                    value={edu.institution}
                                    onChange={(e) =>
                                      updateEducation(edu.id, { institution: e.target.value })
                                    }
                                    placeholder="e.g. University Of Sahiwal"
                                    className={`${inputClass} pr-16`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenEduLinkId(isLinkOpen ? null : edu.id)
                                    }
                                    title={
                                      hasUrl
                                        ? `Linked: ${edu.institutionUrl}`
                                        : 'Add school URL'
                                    }
                                    className={`absolute right-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition ${
                                      isLinkOpen || hasUrl
                                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-teal-400 hover:text-teal-600'
                                    }`}
                                  >
                                    <Link2 className="w-3 h-3" />
                                    <span>Link</span>
                                  </button>
                                </div>
                                {isLinkOpen && (
                                  <div className="flex items-center gap-1.5 pl-2 border-l-2 border-teal-500/60">
                                    <input
                                      type="url"
                                      value={edu.institutionUrl || ''}
                                      onChange={(e) =>
                                        updateEducation(edu.id, {
                                          institutionUrl: e.target.value,
                                        })
                                      }
                                      placeholder="https://university.edu"
                                      className={inputClass}
                                    />
                                    {hasUrl && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateEducation(edu.id, { institutionUrl: '' })
                                        }
                                        title="Clear URL"
                                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-[11px] font-medium mb-1">
                                    Start Date
                                  </label>
                                  <div className="relative flex items-center">
                                    <input
                                      value={edu.startDate}
                                      onChange={(e) =>
                                        updateEducation(edu.id, { startDate: e.target.value })
                                      }
                                      placeholder="2018"
                                      className={`${inputClass} pr-6`}
                                    />
                                    {edu.startDate && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateEducation(edu.id, { startDate: '' })
                                        }
                                        className="absolute right-1.5 text-slate-400 hover:text-slate-700"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-medium mb-1">
                                    End Date
                                  </label>
                                  <div className="relative flex items-center">
                                    <input
                                      value={edu.endDate}
                                      onChange={(e) =>
                                        updateEducation(edu.id, { endDate: e.target.value })
                                      }
                                      placeholder="2022"
                                      className={`${inputClass} pr-6`}
                                    />
                                    {edu.endDate && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateEducation(edu.id, { endDate: '' })
                                        }
                                        className="absolute right-1.5 text-slate-400 hover:text-slate-700"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-medium mb-1">
                                    Location
                                  </label>
                                  <input
                                    value={edu.location || ''}
                                    onChange={(e) =>
                                      updateEducation(edu.id, { location: e.target.value })
                                    }
                                    placeholder="City, Country"
                                    className={inputClass}
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[11px] font-medium mb-1">
                                    GPA / CGPA
                                  </label>
                                  <input
                                    value={edu.gpa || ''}
                                    onChange={(e) =>
                                      updateEducation(edu.id, { gpa: e.target.value })
                                    }
                                    placeholder="e.g. 3.50/4.00"
                                    className={inputClass}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-medium mb-1">
                                    Thesis Title
                                  </label>
                                  <input
                                    value={edu.thesisTitle || ''}
                                    onChange={(e) =>
                                      updateEducation(edu.id, {
                                        thesisTitle: e.target.value,
                                      })
                                    }
                                    placeholder="Optional"
                                    className={inputClass}
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-medium mb-1">
                                  Description
                                </label>
                                <textarea
                                  rows={3}
                                  value={edu.description || ''}
                                  onChange={(e) =>
                                    updateEducation(edu.id, { description: e.target.value })
                                  }
                                  placeholder="Honors, coursework, GPA notes, academic highlights..."
                                  className={inputClass}
                                />
                              </div>

                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingEduId(null)}
                                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition"
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </SortableWrapper>
                  );
                })}
              </SortableContext>
            </DndContext>
            <button
              type="button"
              onClick={addEducation}
              className="w-full py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Entry</span>
            </button>
          </div>
        );

      case 'publications':
        return (
          <div className="space-y-2.5">
            {resume.publications.map((pub) => (
              <div
                key={pub.id}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2"
              >
                <div className="flex items-center gap-1.5">
                  <input
                    value={pub.title}
                    onChange={(e) => updatePublication(pub.id, { title: e.target.value })}
                    placeholder="Paper Title"
                    className={`${inputClass} font-medium`}
                  />
                  <button
                    type="button"
                    onClick={() => removePublication(pub.id)}
                    aria-label="Remove publication"
                    className="p-1 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  value={pub.authors.join(', ')}
                  onChange={(e) =>
                    updatePublication(pub.id, {
                      authors: e.target.value.split(',').map((a) => a.trim()),
                    })
                  }
                  placeholder="Authors (comma-separated)"
                  className={inputClass}
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    value={pub.venue}
                    onChange={(e) => updatePublication(pub.id, { venue: e.target.value })}
                    placeholder="Venue / Journal"
                    className={`col-span-2 ${inputClass}`}
                  />
                  <input
                    value={pub.year}
                    onChange={(e) => updatePublication(pub.id, { year: e.target.value })}
                    placeholder="Year"
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addPublication}
              className="w-full py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Publication</span>
            </button>
          </div>
        );

      case 'projects':
        return (
          <div className="space-y-2.5">
            {resume.projects.map((proj) => (
              <div
                key={proj.id}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2"
              >
                <div className="flex items-center gap-1.5">
                  <input
                    value={proj.name}
                    onChange={(e) => updateProject(proj.id, { name: e.target.value })}
                    placeholder="Project Name"
                    className={`${inputClass} font-medium`}
                  />
                  <button
                    type="button"
                    onClick={() => removeProject(proj.id)}
                    aria-label="Remove project"
                    className="p-1 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  value={proj.technologies.join(', ')}
                  onChange={(e) =>
                    updateProject(proj.id, {
                      technologies: e.target.value.split(',').map((t) => t.trim()),
                    })
                  }
                  placeholder="Technologies (comma-separated)"
                  className={inputClass}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      handleRewriteBullets('projects', proj.id, proj.name, proj.bullets)
                    }
                    disabled={aiBusyId === proj.id}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 dark:text-teal-300 hover:underline"
                  >
                    {aiBusyId === proj.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span>AI Rewrite</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={proj.bullets.join('\n')}
                  onChange={(e) =>
                    updateProject(proj.id, { bullets: e.target.value.split('\n') })
                  }
                  className={inputClass}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addProject}
              className="w-full py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          </div>
        );

      case 'skills': {
        const skillLevels = ['Beginner', 'Amateur', 'Competent', 'Proficient', 'Expert'];
        return (
          <div className="space-y-2.5">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleItemDragEnd('skills')}
            >
              <SortableContext
                items={resume.skills.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {resume.skills.map((grp) => {
                  const isEditing = editingSkillId === grp.id;
                  return (
                    <SortableWrapper key={grp.id} id={grp.id}>
                      {(handleProps) => (
                        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 overflow-hidden">
                          <div className="px-2 py-2 flex items-center gap-1.5">
                            <DragHandle {...handleProps} />
                            <button
                              type="button"
                              onClick={() =>
                                setEditingSkillId(isEditing ? null : grp.id)
                              }
                              className={`flex-1 text-left text-xs font-medium truncate ${
                                !grp.visible ? 'opacity-45 text-slate-400' : ''
                              }`}
                            >
                              {grp.category || 'Skill'}
                              {grp.level && (
                                <span className="font-normal text-slate-500 ml-1.5">
                                  — {grp.level}
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateSkillGroup(grp.id, { visible: !grp.visible })
                              }
                              aria-label={grp.visible ? 'Hide skill' : 'Show skill'}
                              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            >
                              {grp.visible ? (
                                <Eye className="w-3.5 h-3.5 text-teal-600" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5 opacity-45" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeSkillGroup(grp.id)}
                              aria-label="Remove skill"
                              className="p-1 text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {isEditing && (
                            <div className="p-3 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5 bg-white dark:bg-slate-950/60">
                              <div>
                                <label className="block text-[11px] font-medium mb-1">
                                  Skill
                                </label>
                                <input
                                  value={grp.category}
                                  onChange={(e) =>
                                    updateSkillGroup(grp.id, { category: e.target.value })
                                  }
                                  placeholder="e.g. UI Designing"
                                  className={`${inputClass} font-medium`}
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-medium mb-1">
                                  Information / Sub-skills
                                </label>
                                <textarea
                                  rows={2}
                                  value={grp.items.join(', ')}
                                  onChange={(e) =>
                                    updateSkillGroup(grp.id, {
                                      items: e.target.value
                                        .split(',')
                                        .map((s) => s.trim()),
                                    })
                                  }
                                  placeholder="e.g. Material, Cupertino"
                                  className={inputClass}
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-medium mb-1">
                                  Skill level
                                </label>
                                <div className="relative flex items-center">
                                  <select
                                    value={grp.level || ''}
                                    onChange={(e) =>
                                      updateSkillGroup(grp.id, {
                                        level: e.target.value || undefined,
                                      })
                                    }
                                    className={`${inputClass} pr-8`}
                                  >
                                    <option value="">Select level (optional)</option>
                                    {skillLevels.map((lvl) => (
                                      <option key={lvl} value={lvl}>
                                        {lvl}
                                      </option>
                                    ))}
                                  </select>
                                  {grp.level && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateSkillGroup(grp.id, { level: undefined })
                                      }
                                      title="Clear skill level"
                                      className="absolute right-6 p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingSkillId(null)}
                                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition"
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </SortableWrapper>
                  );
                })}
              </SortableContext>
            </DndContext>

            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={addSkillGroup}
                className="flex-1 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Entry</span>
              </button>
              <button
                type="button"
                onClick={handleSuggestSkills}
                disabled={aiBusyId === 'skills'}
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-xs font-medium inline-flex items-center gap-1.5 transition"
              >
                {aiBusyId === 'skills' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>AI Skill Suggestions</span>
              </button>
            </div>
          </div>
        );
      }

      case 'languages': {
        const langs = resume.languages || [];
        const levelPresets = [
          'Basic',
          'Conversational',
          'Proficient',
          'Professional Proficiency',
          'Native/Bilingual',
        ];
        return (
          <div className="space-y-2.5">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleItemDragEnd('languages')}
            >
              <SortableContext
                items={langs.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                {langs.map((lang) => {
                  const isEditing = editingLangId === lang.id;
                  return (
                    <SortableWrapper key={lang.id} id={lang.id}>
                      {(handleProps) => (
                        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 overflow-hidden">
                          <div className="px-2 py-2 flex items-center gap-1.5">
                            <DragHandle {...handleProps} />
                            <button
                              type="button"
                              onClick={() =>
                                setEditingLangId(isEditing ? null : lang.id)
                              }
                              className={`flex-1 text-left text-xs font-medium truncate ${
                                !lang.visible ? 'opacity-45 line-through' : ''
                              }`}
                            >
                              {lang.language || 'Language'}
                              {lang.level && (
                                <span className="font-normal text-slate-500 ml-1.5">
                                  — {lang.level}
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateLanguage(lang.id, { visible: !lang.visible })
                              }
                              aria-label={lang.visible ? 'Hide language' : 'Show language'}
                              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            >
                              {lang.visible ? (
                                <Eye className="w-3.5 h-3.5 text-teal-600" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5 opacity-45" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeLanguage(lang.id)}
                              aria-label="Remove language"
                              className="p-1 text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {isEditing && (
                            <div className="p-3 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5 bg-white dark:bg-slate-950/60">
                              <div>
                                <label className="block text-[11px] font-medium mb-1">
                                  Language
                                </label>
                                <input
                                  value={lang.language}
                                  onChange={(e) =>
                                    updateLanguage(lang.id, { language: e.target.value })
                                  }
                                  placeholder="e.g. English"
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-medium mb-1">
                                  Additional information
                                </label>
                                <input
                                  value={lang.additionalInfo || ''}
                                  onChange={(e) =>
                                    updateLanguage(lang.id, {
                                      additionalInfo: e.target.value,
                                    })
                                  }
                                  placeholder="e.g. C2, 4+, TOEFL, IELTS..."
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-medium mb-1">
                                  Language level
                                </label>
                                <select
                                  value={
                                    levelPresets.includes(lang.level)
                                      ? lang.level
                                      : '__custom__'
                                  }
                                  onChange={(e) => {
                                    if (e.target.value !== '__custom__') {
                                      updateLanguage(lang.id, { level: e.target.value });
                                    }
                                  }}
                                  className={inputClass}
                                >
                                  {levelPresets.map((lv) => (
                                    <option key={lv} value={lv}>
                                      {lv}
                                    </option>
                                  ))}
                                  <option value="__custom__">Custom level text...</option>
                                </select>
                                <input
                                  value={lang.level}
                                  onChange={(e) =>
                                    updateLanguage(lang.id, { level: e.target.value })
                                  }
                                  placeholder="Custom level text"
                                  className={`${inputClass} mt-1.5`}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </SortableWrapper>
                  );
                })}
              </SortableContext>
            </DndContext>
            <button
              type="button"
              onClick={addLanguage}
              className="w-full py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Entry</span>
            </button>
          </div>
        );
      }

      case 'custom': {
        const customSec = resume.customSections[sec.id];
        if (!customSec) return null;
        return (
          <div className="space-y-2.5">
            {customSec.entries.map((entry) => (
              <div
                key={entry.id}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2"
              >
                <div className="flex items-center gap-1.5">
                  <input
                    value={entry.title}
                    onChange={(e) =>
                      updateCustomEntry(sec.id, entry.id, { title: e.target.value })
                    }
                    placeholder="Entry Title"
                    className={`${inputClass} font-medium`}
                  />
                  <button
                    type="button"
                    onClick={() => removeCustomEntry(sec.id, entry.id)}
                    aria-label="Remove entry"
                    className="p-1 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={entry.subtitle || ''}
                    onChange={(e) =>
                      updateCustomEntry(sec.id, entry.id, { subtitle: e.target.value })
                    }
                    placeholder="Subtitle / Organization"
                    className={inputClass}
                  />
                  <input
                    value={entry.dateRange || ''}
                    onChange={(e) =>
                      updateCustomEntry(sec.id, entry.id, { dateRange: e.target.value })
                    }
                    placeholder="Date Range"
                    className={inputClass}
                  />
                </div>
                <textarea
                  rows={2}
                  value={entry.bullets.join('\n')}
                  onChange={(e) =>
                    updateCustomEntry(sec.id, entry.id, {
                      bullets: e.target.value.split('\n'),
                    })
                  }
                  className={inputClass}
                />
              </div>
            ))}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addCustomEntry(sec.id)}
                className="flex-1 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Entry</span>
              </button>
              <button
                type="button"
                onClick={() => removeCustomSection(sec.id)}
                className="px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                Delete Section
              </button>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {aiError && (
        <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex justify-between items-center gap-2">
          <span>{aiError}</span>
          {aiError.toLowerCase().includes('key') && (
            <button type="button" onClick={onOpenSettings} className="underline font-medium shrink-0">
              AI Settings
            </button>
          )}
        </div>
      )}

      {/* Profile Header Accordion */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleExpand('profile')}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold bg-slate-50/70 dark:bg-slate-800/50"
        >
          <span>Personal & Contact Info</span>
          {expanded.profile ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        {expanded.profile && (
          <div className="p-3.5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full name
                </label>
                <input
                  value={resume.profile.fullName}
                  onChange={(e) => updateProfile({ fullName: e.target.value })}
                  placeholder="Full Name"
                  className={`${inputClass} font-medium`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Professional title
                </label>
                <input
                  value={resume.profile.headline}
                  onChange={(e) => updateProfile({ headline: e.target.value })}
                  placeholder="Headline / Target Role"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                value={resume.profile.email}
                onChange={(e) => updateProfile({ email: e.target.value })}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone
                </label>
                <input
                  value={resume.profile.phone}
                  onChange={(e) => updateProfile({ phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Location
                </label>
                <input
                  value={resume.profile.location}
                  onChange={(e) => updateProfile({ location: e.target.value })}
                  placeholder="City, Country"
                  className={inputClass}
                />
              </div>
            </div>

            {(
              [
                {
                  key: 'linkedin',
                  urlKey: 'linkedinUrl',
                  label: 'LinkedIn',
                  placeholder: 'e.g. muhammad-arslan-758490248',
                  urlPlaceholder: 'https://linkedin.com/in/...',
                },
                {
                  key: 'website',
                  urlKey: 'websiteUrl',
                  label: 'Website',
                  placeholder: 'e.g. portfolio-89dbb.web.app',
                  urlPlaceholder: 'https://your-portfolio.com',
                },
                {
                  key: 'github',
                  urlKey: 'githubUrl',
                  label: 'GitHub',
                  placeholder: 'e.g. Muhammad-Arslan-0',
                  urlPlaceholder: 'https://github.com/...',
                },
              ] as const
            ).map((field) => {
              const displayValue = resume.profile[field.key] || '';
              const urlValue = resume.profile[field.urlKey] || '';
              const isOpen = openLinkField === field.key;
              const hasExplicitUrl = Boolean(urlValue.trim());

              return (
                <div key={field.key} className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {field.label}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      value={displayValue}
                      onChange={(e) => updateProfile({ [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className={`${inputClass} pr-16`}
                    />
                    <button
                      type="button"
                      onClick={() => setOpenLinkField(isOpen ? null : field.key)}
                      title={hasExplicitUrl ? `Linked: ${urlValue}` : `Add ${field.label} URL`}
                      className={`absolute right-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition ${
                        isOpen || hasExplicitUrl
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-teal-400 hover:text-teal-600'
                      }`}
                    >
                      <Link2 className="w-3 h-3" />
                      <span>Link</span>
                    </button>
                  </div>

                  {isOpen && (
                    <div className="flex items-center gap-1.5 pl-2 border-l-2 border-teal-500/60">
                      <input
                        type="url"
                        value={urlValue}
                        onChange={(e) => updateProfile({ [field.urlKey]: e.target.value })}
                        placeholder={field.urlPlaceholder}
                        aria-label={`${field.label} URL`}
                        className={inputClass}
                      />
                      {hasExplicitUrl && (
                        <button
                          type="button"
                          onClick={() => updateProfile({ [field.urlKey]: '' })}
                          title="Clear link URL"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Added Extra Personal Details & Social Links */}
            {(resume.profile.extraDetails || []).map((detail) => {
              const isLink = detail.category === 'link';
              const isUrlOpen = openExtraLinkId === detail.id;
              const hasUrl = Boolean(detail.url?.trim());
              const meta = isLink
                ? SOCIAL_LINK_OPTIONS.find((o) => o.key === detail.key)
                : PERSONAL_DETAIL_OPTIONS.find((o) => o.key === detail.key);

              return (
                <div key={detail.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {detail.label}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        updateProfile({
                          extraDetails: (resume.profile.extraDetails || []).filter(
                            (d) => d.id !== detail.id
                          ),
                        })
                      }
                      title={`Remove ${detail.label}`}
                      className="text-slate-400 hover:text-red-500 p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      value={detail.value}
                      onChange={(e) =>
                        updateProfile({
                          extraDetails: (resume.profile.extraDetails || []).map((d) =>
                            d.id === detail.id ? { ...d, value: e.target.value } : d
                          ),
                        })
                      }
                      placeholder={meta?.placeholder || detail.label}
                      className={`${inputClass} ${isLink ? 'pr-16' : ''}`}
                    />
                    {isLink && (
                      <button
                        type="button"
                        onClick={() => setOpenExtraLinkId(isUrlOpen ? null : detail.id)}
                        title={hasUrl ? `Linked: ${detail.url}` : `Add ${detail.label} URL`}
                        className={`absolute right-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition ${
                          isUrlOpen || hasUrl
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-teal-400 hover:text-teal-600'
                        }`}
                      >
                        <Link2 className="w-3 h-3" />
                        <span>Link</span>
                      </button>
                    )}
                  </div>

                  {isLink && isUrlOpen && (
                    <div className="flex items-center gap-1.5 pl-2 border-l-2 border-teal-500/60">
                      <input
                        type="url"
                        value={detail.url || ''}
                        onChange={(e) =>
                          updateProfile({
                            extraDetails: (resume.profile.extraDetails || []).map((d) =>
                              d.id === detail.id ? { ...d, url: e.target.value } : d
                            ),
                          })
                        }
                        placeholder={
                          SOCIAL_LINK_OPTIONS.find((o) => o.key === detail.key)
                            ?.urlPlaceholder || 'https://...'
                        }
                        aria-label={`${detail.label} URL`}
                        className={inputClass}
                      />
                      {hasUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            updateProfile({
                              extraDetails: (resume.profile.extraDetails || []).map((d) =>
                                d.id === detail.id ? { ...d, url: '' } : d
                              ),
                            })
                          }
                          title="Clear link URL"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Details Catalog */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Add details
              </div>

              {(() => {
                const existingKeys = new Set(
                  (resume.profile.extraDetails || []).map((d) => d.key)
                );
                const availablePersonal = PERSONAL_DETAIL_OPTIONS.filter(
                  (o) => !existingKeys.has(o.key)
                );
                const visiblePersonal = showMoreDetails
                  ? availablePersonal
                  : availablePersonal.slice(0, 5);
                const q = detailsSearch.trim().toLowerCase();
                const availableSocial = SOCIAL_LINK_OPTIONS.filter(
                  (o) =>
                    !existingKeys.has(o.key) &&
                    (!q || o.label.toLowerCase().includes(q))
                );

                const addExtraDetail = (
                  key: string,
                  label: string,
                  category: 'personal' | 'link'
                ) => {
                  const id = `${key}-${Date.now()}`;
                  updateProfile({
                    extraDetails: [
                      ...(resume.profile.extraDetails || []),
                      { id, key, label, category, value: '', ...(category === 'link' ? { url: '' } : {}) },
                    ],
                  });
                };

                return (
                  <>
                    {availablePersonal.length > 0 && (
                      <div className="space-y-1.5">
                        {showMoreDetails && (
                          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            Personal details
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {visiblePersonal.map((opt) => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() =>
                                addExtraDetail(opt.key, opt.label, 'personal')
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal-700 dark:hover:text-teal-300 transition"
                            >
                              <Plus className="w-3 h-3 opacity-70" />
                              <span>{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {showMoreDetails && (
                      <div className="space-y-2 pt-1">
                        <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          Links / social profiles
                        </div>
                        <div className="relative flex items-center">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                          <input
                            value={detailsSearch}
                            onChange={(e) => setDetailsSearch(e.target.value)}
                            placeholder="Search"
                            className={`${inputClass} pl-8 bg-slate-50 dark:bg-slate-900`}
                          />
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                          {availableSocial.map((opt) => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() =>
                                addExtraDetail(opt.key, opt.label, 'link')
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal-700 dark:hover:text-teal-300 transition"
                            >
                              <Plus className="w-3 h-3 opacity-70" />
                              <span>{opt.label}</span>
                            </button>
                          ))}
                          {availableSocial.length === 0 && (
                            <span className="text-[11px] text-slate-400">
                              No matching platforms
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowMoreDetails((prev) => !prev)}
                      className="inline-flex items-center px-3 py-1 rounded-md text-[11px] font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      {showMoreDetails ? 'Show Less' : 'Show More'}
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Draggable Sections */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleSectionDragEnd}
      >
        <SortableContext
          items={sortedSections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2.5">
            {sortedSections.map((sec) => (
              <SortableWrapper key={sec.id} id={sec.id}>
                {(handleProps) => (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="px-2.5 py-2 flex items-center gap-1.5 bg-slate-50/70 dark:bg-slate-800/50">
                      <DragHandle {...handleProps} />
                      <input
                        value={sec.title}
                        onChange={(e) => renameSection(sec.id, e.target.value)}
                        aria-label={`Section title for ${sec.id}`}
                        className="flex-1 text-xs font-semibold bg-transparent focus:outline-none focus:bg-white dark:focus:bg-slate-950 px-1.5 py-0.5 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSectionVisibility(sec.id)}
                        aria-label={sec.visible ? 'Hide section' : 'Show section'}
                        title={sec.visible ? 'Hide section' : 'Show section'}
                        className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        {sec.visible ? (
                          <Eye className="w-3.5 h-3.5 text-teal-600" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 opacity-50" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleExpand(sec.id)}
                        aria-label="Toggle section"
                        className="p-1 text-slate-500"
                      >
                        {expanded[sec.id] ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {expanded[sec.id] && <div className="p-3">{renderSectionBody(sec)}</div>}
                  </div>
                )}
              </SortableWrapper>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Content / Section Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setAddSectionOpen(true)}
          className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4 text-teal-600" />
          <span>Add Content / Section</span>
        </button>
      </div>

      <AddSectionModal open={addSectionOpen} onClose={() => setAddSectionOpen(false)} />
    </div>
  );
};
