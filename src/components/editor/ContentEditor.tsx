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
  Loader2,
  Plus,
  Sparkles,
  Trash2,
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

  const removeCustomSection = useResumeStore((s) => s.removeCustomSection);
  const addCustomEntry = useResumeStore((s) => s.addCustomEntry);
  const updateCustomEntry = useResumeStore((s) => s.updateCustomEntry);
  const removeCustomEntry = useResumeStore((s) => s.removeCustomEntry);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    profile: true,
    summary: true,
    experience: true,
  });
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [aiBusyId, setAiBusyId] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

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
                {resume.education.map((edu) => (
                  <SortableWrapper key={edu.id} id={edu.id}>
                    {(handleProps) => (
                      <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <DragHandle {...handleProps} />
                          <input
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                            placeholder="Degree (e.g. Ph.D. in Computer Science)"
                            className={`${inputClass} font-medium`}
                          />
                          <button
                            type="button"
                            onClick={() => removeEducation(edu.id)}
                            aria-label="Remove education"
                            className="p-1 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={edu.institution}
                            onChange={(e) =>
                              updateEducation(edu.id, { institution: e.target.value })
                            }
                            placeholder="Institution"
                            className={inputClass}
                          />
                          <input
                            value={edu.gpa || ''}
                            onChange={(e) => updateEducation(edu.id, { gpa: e.target.value })}
                            placeholder="GPA (optional)"
                            className={inputClass}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={edu.startDate}
                            onChange={(e) => updateEducation(edu.id, { startDate: e.target.value })}
                            placeholder="Start"
                            className={inputClass}
                          />
                          <input
                            value={edu.endDate}
                            onChange={(e) => updateEducation(edu.id, { endDate: e.target.value })}
                            placeholder="End"
                            className={inputClass}
                          />
                        </div>
                        <input
                          value={edu.thesisTitle || ''}
                          onChange={(e) =>
                            updateEducation(edu.id, { thesisTitle: e.target.value })
                          }
                          placeholder="Thesis Title (academic, optional)"
                          className={inputClass}
                        />
                      </div>
                    )}
                  </SortableWrapper>
                ))}
              </SortableContext>
            </DndContext>
            <button
              type="button"
              onClick={addEducation}
              className="w-full py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Education</span>
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

      case 'skills':
        return (
          <div className="space-y-2.5">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSuggestSkills}
                disabled={aiBusyId === 'skills'}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 dark:text-teal-300 hover:underline"
              >
                {aiBusyId === 'skills' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span>AI Suggest Skills</span>
              </button>
            </div>
            {resume.skills.map((grp) => (
              <div
                key={grp.id}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-1.5"
              >
                <div className="flex items-center gap-1.5">
                  <input
                    value={grp.category}
                    onChange={(e) => updateSkillGroup(grp.id, { category: e.target.value })}
                    placeholder="Category"
                    className={`${inputClass} font-medium`}
                  />
                  <button
                    type="button"
                    onClick={() => removeSkillGroup(grp.id)}
                    aria-label="Remove skill group"
                    className="p-1 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  value={grp.items.join(', ')}
                  onChange={(e) =>
                    updateSkillGroup(grp.id, {
                      items: e.target.value.split(',').map((s) => s.trim()),
                    })
                  }
                  placeholder="Skills (comma-separated)"
                  className={inputClass}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addSkillGroup}
              className="w-full py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Skill Group</span>
            </button>
          </div>
        );

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
          <div className="p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                value={resume.profile.fullName}
                onChange={(e) => updateProfile({ fullName: e.target.value })}
                placeholder="Full Name"
                className={`${inputClass} font-medium`}
              />
              <input
                value={resume.profile.headline}
                onChange={(e) => updateProfile({ headline: e.target.value })}
                placeholder="Headline / Target Role"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={resume.profile.email}
                onChange={(e) => updateProfile({ email: e.target.value })}
                placeholder="Email"
                className={inputClass}
              />
              <input
                value={resume.profile.phone}
                onChange={(e) => updateProfile({ phone: e.target.value })}
                placeholder="Phone"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={resume.profile.location}
                onChange={(e) => updateProfile({ location: e.target.value })}
                placeholder="Location"
                className={inputClass}
              />
              <input
                value={resume.profile.website || ''}
                onChange={(e) => updateProfile({ website: e.target.value })}
                placeholder="Website / Portfolio"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                value={resume.profile.linkedin || ''}
                onChange={(e) => updateProfile({ linkedin: e.target.value })}
                placeholder="LinkedIn"
                className={inputClass}
              />
              <input
                value={resume.profile.github || ''}
                onChange={(e) => updateProfile({ github: e.target.value })}
                placeholder="GitHub"
                className={inputClass}
              />
              <input
                value={resume.profile.orcid || ''}
                onChange={(e) => updateProfile({ orcid: e.target.value })}
                placeholder="ORCID (Academic)"
                className={inputClass}
              />
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

      {/* Add Content / Section Button (FlowCV-style) */}
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
