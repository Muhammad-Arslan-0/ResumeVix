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
  AlignCenter,
  AlignLeft,
  BookOpen,
  Briefcase,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FolderGit2,
  GraduationCap,
  Layers,
  Link2,
  Plus,
  Scissors,
  Sparkles,
  Trash2,
  UserSquare2,
} from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import { TEMPLATE_REGISTRY } from '@/templates/registry';
import { ACCENT_PALETTES, CURATED_FONTS } from '@/lib/fonts';
import { DensityLevel, SectionType, TemplateCategory } from '@/types';
import { DragHandle, SortableWrapper } from '@/components/editor/SortableWrapper';

type CustomizeSection =
  | 'document'
  | 'templates'
  | 'layout'
  | 'font-size'
  | 'spacing'
  | 'entries'
  | 'headings'
  | 'font'
  | 'colors'
  | 'header'
  | 'footer'
  | 'sections';

const NAV_ITEMS: Array<{ id: CustomizeSection; label: string }> = [
  { id: 'document', label: 'Document' },
  { id: 'templates', label: 'Templates' },
  { id: 'layout', label: 'Layout' },
  { id: 'font-size', label: 'Font Size' },
  { id: 'spacing', label: 'Spacing' },
  { id: 'entries', label: 'Entries' },
  { id: 'headings', label: 'Headings' },
  { id: 'font', label: 'Font' },
  { id: 'colors', label: 'Colors' },
  { id: 'header', label: 'Header' },
  { id: 'footer', label: 'Footer' },
  { id: 'sections', label: 'Sections' },
];

const CATEGORIES: { id: TemplateCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ats', label: 'ATS' },
  { id: 'academic', label: 'Academic' },
  { id: 'executive', label: 'Executive' },
  { id: 'creative', label: 'Creative' },
];

function getSectionIcon(type: SectionType) {
  switch (type) {
    case 'summary':
      return UserSquare2;
    case 'experience':
      return Briefcase;
    case 'education':
      return GraduationCap;
    case 'publications':
      return BookOpen;
    case 'projects':
      return FolderGit2;
    case 'skills':
      return Sparkles;
    case 'page_break':
      return Scissors;
    default:
      return Layers;
  }
}

export const DesignPanel: React.FC = () => {
  const template = useResumeStore((s) => s.template);
  const switchTemplate = useResumeStore((s) => s.switchTemplate);
  const setPageSize = useResumeStore((s) => s.setPageSize);
  const updateStyleConfig = useResumeStore((s) => s.updateStyleConfig);
  const toggleSectionVisibility = useResumeStore((s) => s.toggleSectionVisibility);
  const reorderSections = useResumeStore((s) => s.reorderSections);
  const setSectionColumn = useResumeStore((s) => s.setSectionColumn);
  const addPageBreak = useResumeStore((s) => s.addPageBreak);
  const removeSection = useResumeStore((s) => s.removeSection);

  const [activeNav, setActiveNav] = useState<CustomizeSection>('document');
  const [category, setCategory] = useState<TemplateCategory | 'all'>('all');
  const [headerAdvancedOpen, setHeaderAdvancedOpen] = useState(false);
  const [footerAdvancedOpen, setFooterAdvancedOpen] = useState(false);
  const [entryAdvancedOpen, setEntryAdvancedOpen] = useState(false);
  const [focusedFooterCol, setFocusedFooterCol] = useState<'leftText' | 'centerText' | 'rightText'>(
    'leftText'
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filteredTemplates =
    category === 'all'
      ? TEMPLATE_REGISTRY
      : TEMPLATE_REGISTRY.filter((t) => t.category === category);

  const sortedSections = [...template.sections].sort((a, b) => a.order - b.order);
  const colMode = template.style.columnLayoutOverride || 'auto';
  const showColumnBadges = colMode === 'two' || colMode === 'mix';

  const handleLayoutDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderSections(String(active.id), String(over.id));
    }
  };

  return (
    <div className="flex gap-3 h-full min-h-[420px]">
      {/* Left FlowCV-style Customize Sub-Navigation Rail */}
      <nav
        aria-label="Customize sections"
        className="w-24 shrink-0 border-r border-slate-200 dark:border-slate-800 pr-2 space-y-0.5 text-[11px]"
      >
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveNav(item.id)}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${
              activeNav === item.id
                ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-semibold border-l-2 border-teal-600'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Right Active Customize Card */}
      <div className="flex-1 overflow-y-auto pr-1 pb-8 space-y-4 text-xs">
        {activeNav === 'document' && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="font-semibold text-sm">Document Settings</h3>
            <div>
              <label className="block font-medium mb-1">Language</label>
              <select
                value={template.style.documentLanguage || 'en-US'}
                onChange={(e) =>
                  updateStyleConfig({
                    documentLanguage: e.target.value as NonNullable<
                      typeof template.style.documentLanguage
                    >,
                  })
                }
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Date Format</label>
              <select
                value={template.style.dateFormat || 'YYYY/MM'}
                onChange={(e) =>
                  updateStyleConfig({
                    dateFormat: e.target.value as NonNullable<typeof template.style.dateFormat>,
                  })
                }
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
              >
                <option value="YYYY/MM">YYYY/MM (2024/01)</option>
                <option value="YYYY/MM/DD">YYYY/MM/DD (2024/01/01)</option>
                <option value="MM/YYYY">MM/YYYY (01/2024)</option>
                <option value="MMM YYYY">MMM YYYY (Jan 2024)</option>
                <option value="YYYY">YYYY (2024)</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Page Format</label>
              <select
                value={template.pageSize}
                onChange={(e) => setPageSize(e.target.value as 'A4' | 'LETTER')}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
              >
                <option value="A4">A4</option>
                <option value="LETTER">US Letter</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Layout Density</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['compact', 'standard', 'spacious'] as DensityLevel[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => updateStyleConfig({ density: d })}
                    className={`py-1.5 rounded-lg border capitalize transition ${
                      template.style.density === d
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-medium'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeNav === 'templates' && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full border transition ${
                    category === cat.id
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {filteredTemplates.map((t) => {
                const isActive = template.templateId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => switchTemplate(t.id)}
                    className={`w-full text-left p-3 rounded-xl border transition ${
                      isActive
                        ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/30 ring-1 ring-teal-600'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 font-semibold">
                      <span>{t.name}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {t.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeNav === 'layout' && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
            {/* Columns: One / Two / Mix */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Columns</h3>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'one', label: 'One' },
                    { id: 'two', label: 'Two' },
                    { id: 'mix', label: 'Mix' },
                  ] as const
                ).map((col) => {
                  const active = colMode === col.id || (colMode === 'auto' && col.id === 'one');
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => updateStyleConfig({ columnLayoutOverride: col.id })}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                        active
                          ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="w-8 h-6 rounded border border-current/30 flex gap-0.5 p-0.5">
                        {col.id === 'one' ? (
                          <div className="w-full h-full bg-current/25 rounded-[1px]" />
                        ) : col.id === 'two' ? (
                          <>
                            <div className="w-1/3 h-full bg-current/30 rounded-[1px]" />
                            <div className="w-2/3 h-full bg-current/20 rounded-[1px]" />
                          </>
                        ) : (
                          <>
                            <div className="w-1/2 h-full bg-current/30 rounded-[1px]" />
                            <div className="w-1/2 h-full bg-current/20 rounded-[1px]" />
                          </>
                        )}
                      </div>
                      <span>{col.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Change Section Layout (FlowCV-style) */}
            <div className="space-y-2.5">
              <h3 className="font-semibold text-sm">Change Section Layout</h3>

              {/* Personal Details Header Card */}
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 flex flex-col items-center justify-center gap-1 text-slate-700 dark:text-slate-200">
                <FileSpreadsheet className="w-5 h-5 text-slate-500" />
                <span className="font-semibold text-xs">Personal Details</span>
              </div>

              {/* Draggable Section Pills */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleLayoutDragEnd}
              >
                <SortableContext
                  items={sortedSections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1.5">
                    {sortedSections.map((sec) => {
                      const Icon = getSectionIcon(sec.type);
                      const isBreak = sec.type === 'page_break';
                      return (
                        <SortableWrapper key={sec.id} id={sec.id}>
                          {(handleProps) => (
                            <div
                              className={`px-2 py-2 rounded-xl flex items-center gap-2 ${
                                isBreak
                                  ? 'border border-dashed border-slate-300 dark:border-slate-700 bg-transparent'
                                  : 'bg-slate-100/90 dark:bg-slate-800/80'
                              }`}
                            >
                              <DragHandle {...handleProps} />
                              <Icon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0" />
                              <span
                                className={`flex-1 font-medium truncate ${
                                  !sec.visible ? 'opacity-45 line-through' : ''
                                }`}
                              >
                                {sec.title}
                              </span>

                              {showColumnBadges && !isBreak && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSectionColumn(
                                      sec.id,
                                      sec.column === 'sidebar' ? 'main' : 'sidebar'
                                    )
                                  }
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                                  title="Toggle Left / Right Column"
                                >
                                  {sec.column === 'sidebar' ? 'Left' : 'Right'}
                                </button>
                              )}

                              {isBreak ? (
                                <button
                                  type="button"
                                  onClick={() => removeSection(sec.id)}
                                  aria-label="Remove page break"
                                  className="p-1 text-slate-400 hover:text-red-500"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => toggleSectionVisibility(sec.id)}
                                  aria-label={sec.visible ? 'Hide section' : 'Show section'}
                                  className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                >
                                  {sec.visible ? (
                                    <Eye className="w-3.5 h-3.5 text-teal-600" />
                                  ) : (
                                    <EyeOff className="w-3.5 h-3.5 opacity-45" />
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </SortableWrapper>
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Add Page Break Button */}
              <button
                type="button"
                onClick={addPageBreak}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 text-slate-600 dark:text-slate-300 font-medium flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Page break</span>
              </button>
            </div>
          </div>
        )}

        {activeNav === 'entries' && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
            <h3 className="font-semibold text-sm">Entry Layout</h3>

            {/* Structure: Full Width | Columns */}
            <div className="space-y-2">
              <div className="font-semibold">Structure</div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'full-width', label: 'Full Width' },
                    { id: 'columns', label: 'Columns' },
                  ] as const
                ).map((st) => {
                  const active = (template.style.entryConfig?.structure || 'columns') === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() =>
                        updateStyleConfig({
                          entryConfig: { ...template.style.entryConfig, structure: st.id },
                          entryLayoutOverride: st.id === 'columns' ? 'date-left-rail' : 'stacked',
                        })
                      }
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                        active
                          ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="w-8 h-5 flex gap-1 items-center justify-center">
                        {st.id === 'full-width' ? (
                          <div className="w-full space-y-1">
                            <div className="h-1 bg-current/40 rounded" />
                            <div className="h-1 bg-current/25 rounded" />
                          </div>
                        ) : (
                          <>
                            <div className="w-1/3 h-full bg-current/35 rounded-[1px]" />
                            <div className="w-2/3 h-full bg-current/20 rounded-[1px]" />
                          </>
                        )}
                      </div>
                      <span>{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date & Location Position */}
            <div className="space-y-2">
              <div className="font-semibold">Date & Location Position</div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'right', label: 'Right' },
                    { id: 'left', label: 'Left' },
                    { id: 'split', label: 'Split' },
                  ] as const
                ).map((pos) => {
                  const active = (template.style.entryConfig?.datePosition || 'left') === pos.id;
                  return (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() =>
                        updateStyleConfig({
                          entryConfig: { ...template.style.entryConfig, datePosition: pos.id },
                        })
                      }
                      className={`py-2 px-2 rounded-xl border text-center transition ${
                        active
                          ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {pos.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subtitle Placement */}
            <div className="space-y-2">
              <div className="font-semibold">Subtitle Placement</div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'same-line', label: 'Try Same Line' },
                    { id: 'below', label: 'Below Title' },
                  ] as const
                ).map((sub) => {
                  const active =
                    (template.style.entryConfig?.subtitlePlacement || 'same-line') === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() =>
                        updateStyleConfig({
                          entryConfig: {
                            ...template.style.entryConfig,
                            subtitlePlacement: sub.id,
                          },
                        })
                      }
                      className={`py-2 px-2 rounded-xl border text-center transition ${
                        active
                          ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {sub.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 overflow-hidden">
              <button
                type="button"
                onClick={() => setEntryAdvancedOpen((v) => !v)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between font-medium text-slate-700 dark:text-slate-200"
              >
                <span>Advanced settings</span>
                {entryAdvancedOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {entryAdvancedOpen && (
                <div className="p-3.5 pt-2 space-y-2.5 border-t border-slate-200 dark:border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.style.entryConfig?.titleBold ?? true}
                      onChange={(e) =>
                        updateStyleConfig({
                          entryConfig: {
                            ...template.style.entryConfig,
                            titleBold: e.target.checked,
                          },
                        })
                      }
                      className="accent-teal-600 rounded"
                    />
                    <span>Bold entry title</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.style.entryConfig?.subtitleItalic ?? true}
                      onChange={(e) =>
                        updateStyleConfig({
                          entryConfig: {
                            ...template.style.entryConfig,
                            subtitleItalic: e.target.checked,
                          },
                        })
                      }
                      className="accent-teal-600 rounded"
                    />
                    <span>Italic entry subtitle</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {activeNav === 'font-size' && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="font-semibold text-sm">Font Size</h3>

            {/* Base Font Size */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Base Font Size</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  {template.style.fontSizePt}pt
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={8.5}
                  max={12.5}
                  step={0.5}
                  value={template.style.fontSizePt}
                  onChange={(e) => updateStyleConfig({ fontSizePt: parseFloat(e.target.value) })}
                  className="flex-1 accent-teal-600"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateStyleConfig({
                      fontSizePt: Math.max(8.5, +(template.style.fontSizePt - 0.5).toFixed(1)),
                    })
                  }
                  aria-label="Decrease base font size"
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateStyleConfig({
                      fontSizePt: Math.min(12.5, +(template.style.fontSizePt + 0.5).toFixed(1)),
                    })
                  }
                  aria-label="Increase base font size"
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Relative Offset Steppers */}
            {(
              [
                { key: 'fullNamePt', label: 'Full Name', min: 4, max: 16, def: 10 },
                { key: 'titlePt', label: 'Professional Title', min: 0, max: 10, def: 1 },
                { key: 'sectionHeadingPt', label: 'Section Headings', min: -1, max: 6, def: 0 },
                { key: 'entryHeaderPt', label: 'Entry Header', min: 0, max: 4, def: 0 },
              ] as const
            ).map((item) => {
              const offsets = template.style.fontOffsets || {};
              const val = offsets[item.key] ?? item.def;
              return (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{item.label}</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300">
                      {val >= 0 ? `+${val}pt` : `${val}pt`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={item.min}
                      max={item.max}
                      step={1}
                      value={val}
                      onChange={(e) =>
                        updateStyleConfig({
                          fontOffsets: { ...offsets, [item.key]: parseInt(e.target.value, 10) },
                        })
                      }
                      className="flex-1 accent-teal-600"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateStyleConfig({
                          fontOffsets: { ...offsets, [item.key]: Math.max(item.min, val - 1) },
                        })
                      }
                      aria-label={`Decrease ${item.label}`}
                      className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateStyleConfig({
                          fontOffsets: { ...offsets, [item.key]: Math.min(item.max, val + 1) },
                        })
                      }
                      aria-label={`Increase ${item.label}`}
                      className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Line Height */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="font-semibold">Line Height</span>
                <span className="font-mono">{template.style.lineHeight}</span>
              </div>
              <input
                type="range"
                min={1.15}
                max={1.7}
                step={0.05}
                value={template.style.lineHeight}
                onChange={(e) => updateStyleConfig({ lineHeight: parseFloat(e.target.value) })}
                className="w-full accent-teal-600"
              />
            </div>
          </div>
        )}

        {activeNav === 'spacing' && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="font-semibold text-sm">Spacing</h3>

            {/* Line Height */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Line Height</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  {template.style.lineHeight}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1.15}
                  max={1.7}
                  step={0.05}
                  value={template.style.lineHeight}
                  onChange={(e) => updateStyleConfig({ lineHeight: parseFloat(e.target.value) })}
                  className="flex-1 accent-teal-600"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateStyleConfig({
                      lineHeight: Math.max(1.15, +(template.style.lineHeight - 0.05).toFixed(2)),
                    })
                  }
                  aria-label="Decrease line height"
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateStyleConfig({
                      lineHeight: Math.min(1.7, +(template.style.lineHeight + 0.05).toFixed(2)),
                    })
                  }
                  aria-label="Increase line height"
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Space Between Elements */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Space Between Elements</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  {template.style.sectionSpacingPx}px
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={6}
                  max={26}
                  step={2}
                  value={template.style.sectionSpacingPx}
                  onChange={(e) =>
                    updateStyleConfig({ sectionSpacingPx: parseInt(e.target.value, 10) })
                  }
                  className="flex-1 accent-teal-600"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateStyleConfig({
                      sectionSpacingPx: Math.max(6, template.style.sectionSpacingPx - 2),
                    })
                  }
                  aria-label="Decrease element spacing"
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateStyleConfig({
                      sectionSpacingPx: Math.min(26, template.style.sectionSpacingPx + 2),
                    })
                  }
                  aria-label="Increase element spacing"
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Left & Right Margin */}
            {(() => {
              const mx = template.style.marginXMm ?? template.style.marginMm;
              const my = template.style.marginYMm ?? template.style.marginMm;
              return (
                <>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Left & Right Margin</span>
                      <span className="font-mono text-slate-600 dark:text-slate-300">{mx}mm</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={8}
                        max={24}
                        step={1}
                        value={mx}
                        onChange={(e) =>
                          updateStyleConfig({ marginXMm: parseInt(e.target.value, 10) })
                        }
                        className="flex-1 accent-teal-600"
                      />
                      <button
                        type="button"
                        onClick={() => updateStyleConfig({ marginXMm: Math.max(8, mx - 1) })}
                        aria-label="Decrease left and right margin"
                        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStyleConfig({ marginXMm: Math.min(24, mx + 1) })}
                        aria-label="Increase left and right margin"
                        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Top & Bottom Margin */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Top & Bottom Margin</span>
                      <span className="font-mono text-slate-600 dark:text-slate-300">{my}mm</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={8}
                        max={24}
                        step={1}
                        value={my}
                        onChange={(e) =>
                          updateStyleConfig({ marginYMm: parseInt(e.target.value, 10) })
                        }
                        className="flex-1 accent-teal-600"
                      />
                      <button
                        type="button"
                        onClick={() => updateStyleConfig({ marginYMm: Math.max(8, my - 1) })}
                        aria-label="Decrease top and bottom margin"
                        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStyleConfig({ marginYMm: Math.min(24, my + 1) })}
                        aria-label="Increase top and bottom margin"
                        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {activeNav === 'headings' && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
            <h3 className="font-semibold text-sm">Section Headings</h3>

            {/* 8 Visual Style Cards (4x2 grid) */}
            <div className="space-y-2">
              <div className="font-semibold">Style</div>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    { id: 'ats-minimal', label: 'Bottom Rule' },
                    { id: 'flowcv-banner', label: 'Banner' },
                    { id: 'modern-accent', label: 'Accent Rule' },
                    { id: 'double-rule', label: 'Double Rule' },
                    { id: 'short-underline', label: 'Short Bar' },
                    { id: 'plain', label: 'Plain' },
                    { id: 'academic-ruled', label: 'Academic' },
                    { id: 'executive-bold', label: 'Left Bar' },
                  ] as const
                ).map((st) => {
                  const active =
                    (template.style.headingVariant || 'flowcv-banner') === st.id ||
                    (template.style.headingVariant === 'auto' && st.id === 'flowcv-banner');
                  return (
                    <button
                      key={st.id}
                      type="button"
                      title={st.label}
                      onClick={() => updateStyleConfig({ headingVariant: st.id })}
                      className={`h-11 rounded-xl border px-2 flex flex-col items-center justify-center transition ${
                        active
                          ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-full h-3 rounded-[2px] flex items-center ${
                          st.id === 'flowcv-banner'
                            ? 'bg-current/20 justify-center'
                            : st.id === 'double-rule'
                              ? 'border-y border-current/50 justify-center'
                              : st.id === 'executive-bold'
                                ? 'border-l-4 border-current pl-1'
                                : st.id === 'ats-minimal' || st.id === 'academic-ruled'
                                  ? 'border-b border-current/60'
                                  : ''
                        }`}
                      >
                        <div className="w-6 h-1 bg-current/70 rounded-full" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Capitalization */}
            <div className="space-y-2">
              <div className="font-semibold">Capitalization</div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { upper: false, label: 'Capitalize' },
                    { upper: true, label: 'Uppercase' },
                  ] as const
                ).map((cap) => {
                  const active = (template.style.headingUppercase ?? true) === cap.upper;
                  return (
                    <button
                      key={cap.label}
                      type="button"
                      onClick={() => updateStyleConfig({ headingUppercase: cap.upper })}
                      className={`py-2 rounded-xl border text-center transition ${
                        active
                          ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {cap.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Icons */}
            <div className="space-y-2">
              <div className="font-semibold">Icons</div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'none', label: 'None' },
                    { id: 'outline', label: 'Outline' },
                    { id: 'filled', label: 'Filled' },
                  ] as const
                ).map((ic) => {
                  const active = (template.style.headingIconStyle || 'none') === ic.id;
                  return (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => updateStyleConfig({ headingIconStyle: ic.id })}
                      className={`py-2 rounded-xl border text-center transition ${
                        active
                          ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {ic.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeNav === 'font' && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="font-semibold text-sm">Font</h3>
            <div>
              <label className="block font-semibold mb-1">Body Font (Latin)</label>
              <select
                value={template.style.fontFamily}
                onChange={(e) => updateStyleConfig({ fontFamily: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
              >
                {CURATED_FONTS.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name} ({f.category})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Heading Font</label>
              <select
                value={template.style.headingFontFamily || ''}
                onChange={(e) =>
                  updateStyleConfig({ headingFontFamily: e.target.value || undefined })
                }
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
              >
                <option value="">Same as body font</option>
                {CURATED_FONTS.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name} ({f.category})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Name Font</label>
              <select
                value={template.style.nameFontFamily || ''}
                onChange={(e) =>
                  updateStyleConfig({ nameFontFamily: e.target.value || undefined })
                }
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
              >
                <option value="">Same as body font</option>
                {CURATED_FONTS.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name} ({f.category})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Secondary / Arabic Script Fallback</label>
              <select
                value={template.style.fallbackFontFamily || ''}
                onChange={(e) =>
                  updateStyleConfig({ fallbackFontFamily: e.target.value || undefined })
                }
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
              >
                <option value="">None</option>
                <option value="IBM Plex Sans Arabic">IBM Plex Sans Arabic</option>
                <option value="Cairo">Cairo</option>
                <option value="Noto Sans Arabic">Noto Sans Arabic</option>
              </select>
            </div>
          </div>
        )}

        {activeNav === 'colors' && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
            <h3 className="font-semibold text-sm">Colors</h3>

            {/* Surface Target: Full Page / Header / Border */}
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'full', label: 'Full Page' },
                  { id: 'header', label: 'Header' },
                  { id: 'border', label: 'Border' },
                ] as const
              ).map((target) => {
                const active = (template.style.colorTarget || 'full') === target.id;
                return (
                  <button
                    key={target.id}
                    type="button"
                    onClick={() => updateStyleConfig({ colorTarget: target.id })}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                      active
                        ? 'border-teal-600 bg-teal-50/60 dark:bg-teal-950/30 font-semibold'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-8 h-10 rounded border ${
                        target.id === 'border'
                          ? 'border-4 border-slate-400 bg-white'
                          : target.id === 'header'
                            ? 'border-slate-300 bg-gradient-to-b from-slate-300 from-35% to-white to-35%'
                            : 'border-teal-300 bg-teal-50'
                      }`}
                    />
                    <span className="text-[11px]">{target.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Accent Swatches */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateStyleConfig({ accentColor: '#111827', pageBgColor: undefined })}
                  title="Reset / Monochrome"
                  className="w-7 h-7 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] text-slate-500"
                >
                  /
                </button>
                {ACCENT_PALETTES.map((p) => (
                  <button
                    key={p.hex}
                    type="button"
                    onClick={() => updateStyleConfig({ accentColor: p.hex })}
                    title={p.name}
                    className={`w-7 h-7 rounded-full border-2 transition ${
                      template.style.accentColor.toLowerCase() === p.hex.toLowerCase()
                        ? 'border-slate-900 dark:border-white scale-110'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: p.hex }}
                  />
                ))}
                <label
                  title="Custom Color"
                  className="w-7 h-7 rounded-full overflow-hidden border border-slate-300 cursor-pointer flex items-center justify-center bg-gradient-to-tr from-rose-500 via-amber-400 to-teal-500"
                >
                  <input
                    type="color"
                    value={template.style.accentColor}
                    onChange={(e) => updateStyleConfig({ accentColor: e.target.value })}
                    className="opacity-0 w-full h-full cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Apply Accent Color Checkboxes */}
            <div className="space-y-2">
              <h4 className="font-semibold text-xs">Apply Accent Color</h4>
              <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                {(
                  [
                    { key: 'name', label: 'Name' },
                    { key: 'jobTitle', label: 'Job title' },
                    { key: 'headings', label: 'Headings' },
                    { key: 'headerIcons', label: 'Header icons' },
                    { key: 'dates', label: 'Dates' },
                    { key: 'entryTitle', label: 'Entry title' },
                    { key: 'entrySubtitle', label: 'Entry subtitle' },
                    { key: 'linkIcons', label: 'Link icons' },
                  ] as const
                ).map((opt) => {
                  const targets = template.style.accentTargets || {};
                  const checked =
                    opt.key === 'headings'
                      ? targets.headings !== false
                      : Boolean(targets[opt.key]);
                  return (
                    <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          updateStyleConfig({
                            accentTargets: {
                              ...targets,
                              [opt.key]: e.target.checked,
                            },
                          })
                        }
                        className="accent-teal-600 rounded"
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeNav === 'header' && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
            <h3 className="font-semibold text-sm">Header</h3>

            {/* Text Alignment */}
            <div className="space-y-2">
              <div className="font-semibold">Text Alignment</div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'left', label: 'Left', Icon: AlignLeft },
                    { id: 'center', label: 'Center', Icon: AlignCenter },
                  ] as const
                ).map((opt) => {
                  const active = (template.style.headerConfig?.textAlign || 'center') === opt.id;
                  const Icon = opt.Icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        updateStyleConfig({
                          headerConfig: { ...template.style.headerConfig, textAlign: opt.id },
                        })
                      }
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                        active
                          ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Details Arrangement */}
            <div className="space-y-2">
              <div className="font-semibold">Details Arrangement</div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'inline', label: 'Inline Wrap' },
                    { id: 'grid', label: 'Grid' },
                  ] as const
                ).map((opt) => {
                  const active = (template.style.headerConfig?.detailsLayout || 'inline') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        updateStyleConfig({
                          headerConfig: { ...template.style.headerConfig, detailsLayout: opt.id },
                        })
                      }
                      className={`py-2 px-3 rounded-xl border text-center transition ${
                        active
                          ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {(
                  [
                    { id: 'icon', label: 'Icon' },
                    { id: 'bullet', label: '• Bullet' },
                    { id: 'bar', label: '| Bar' },
                  ] as const
                ).map((sep) => {
                  const active =
                    (template.style.headerConfig?.detailsSeparator || 'icon') === sep.id;
                  return (
                    <button
                      key={sep.id}
                      type="button"
                      onClick={() =>
                        updateStyleConfig({
                          headerConfig: { ...template.style.headerConfig, detailsSeparator: sep.id },
                        })
                      }
                      className={`py-2 px-2 rounded-xl border text-center transition ${
                        active
                          ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {sep.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Icon Style */}
            {(template.style.headerConfig?.detailsSeparator || 'icon') === 'icon' && (
              <div className="space-y-2">
                <div className="font-semibold">Icon Style</div>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: 'plain', cls: '' },
                      { id: 'filled-circle', cls: 'rounded-full bg-slate-500 text-white' },
                      { id: 'filled-rounded', cls: 'rounded-[4px] bg-slate-500 text-white' },
                      { id: 'filled-square', cls: 'rounded-none bg-slate-500 text-white' },
                      { id: 'outline-circle', cls: 'rounded-full border border-slate-500' },
                      { id: 'outline-rounded', cls: 'rounded-[4px] border border-slate-500' },
                      { id: 'outline-square', cls: 'rounded-none border border-slate-500' },
                    ] as const
                  ).map((st) => {
                    const active =
                      (template.style.headerConfig?.iconStyle || 'outline-circle') === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() =>
                          updateStyleConfig({
                            headerConfig: { ...template.style.headerConfig, iconStyle: st.id },
                          })
                        }
                        title={st.id}
                        className={`p-1.5 rounded-lg border transition ${
                          active
                            ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40'
                            : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className={`w-5 h-5 flex items-center justify-center ${st.cls}`}>
                          <Link2 className="w-3 h-3" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Collapsible Advanced Settings */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 overflow-hidden">
              <button
                type="button"
                onClick={() => setHeaderAdvancedOpen((v) => !v)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between font-medium text-slate-700 dark:text-slate-200"
              >
                <span>Advanced Settings</span>
                {headerAdvancedOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {headerAdvancedOpen && (
                <div className="p-3.5 pt-1 space-y-3 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="font-semibold mb-1.5">Name Style</div>
                    <div className="flex gap-2">
                      {[false, true].map((isBold) => {
                        const active = (template.style.headerConfig?.nameBold ?? true) === isBold;
                        return (
                          <button
                            key={String(isBold)}
                            type="button"
                            onClick={() =>
                              updateStyleConfig({
                                headerConfig: { ...template.style.headerConfig, nameBold: isBold },
                              })
                            }
                            className={`px-3 py-1.5 rounded-lg border ${
                              isBold ? 'font-bold' : 'font-normal'
                            } ${
                              active
                                ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            Aa
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold mb-1.5">Professional Title Style</div>
                    <div className="flex gap-2">
                      {[false, true].map((isItalic) => {
                        const active =
                          (template.style.headerConfig?.titleItalic ?? true) === isItalic;
                        return (
                          <button
                            key={String(isItalic)}
                            type="button"
                            onClick={() =>
                              updateStyleConfig({
                                headerConfig: {
                                  ...template.style.headerConfig,
                                  titleItalic: isItalic,
                                },
                              })
                            }
                            className={`px-3 py-1.5 rounded-lg border ${
                              isItalic ? 'italic' : 'not-italic'
                            } ${
                              active
                                ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            Aa
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold mb-1.5">Professional Title Position</div>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { id: 'same-line', label: 'Try Same Line' },
                          { id: 'below', label: 'Below' },
                        ] as const
                      ).map((pos) => {
                        const active =
                          (template.style.headerConfig?.titlePosition || 'below') === pos.id;
                        return (
                          <button
                            key={pos.id}
                            type="button"
                            onClick={() =>
                              updateStyleConfig({
                                headerConfig: {
                                  ...template.style.headerConfig,
                                  titlePosition: pos.id,
                                },
                              })
                            }
                            className={`py-1.5 px-2.5 rounded-lg border ${
                              active
                                ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-medium'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {pos.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeNav === 'footer' && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="font-semibold text-sm">Footer</h3>

            <div className="space-y-2.5">
              {(
                [
                  { key: 'showPageNumbers', label: 'Page numbers' },
                  { key: 'showEmail', label: 'Email' },
                  { key: 'showName', label: 'Name' },
                ] as const
              ).map((opt) => {
                const fc = template.style.footerConfig || {};
                return (
                  <label key={opt.key} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(fc[opt.key])}
                      onChange={(e) =>
                        updateStyleConfig({
                          footerConfig: { ...fc, [opt.key]: e.target.checked },
                        })
                      }
                      className="accent-teal-600 rounded"
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 overflow-hidden">
              <button
                type="button"
                onClick={() => setFooterAdvancedOpen((v) => !v)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between font-medium text-slate-700 dark:text-slate-200"
              >
                <span>Advanced Settings</span>
                {footerAdvancedOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {footerAdvancedOpen && (
                <div className="p-3.5 pt-2 space-y-3 border-t border-slate-200 dark:border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={Boolean(template.style.footerConfig?.customEnabled)}
                      onChange={(e) =>
                        updateStyleConfig({
                          footerConfig: {
                            ...template.style.footerConfig,
                            customEnabled: e.target.checked,
                          },
                        })
                      }
                      className="accent-teal-600 rounded"
                    />
                    <span>Custom footer</span>
                  </label>

                  <div className="space-y-1.5">
                    <div className="font-semibold">Insert placeholders</div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'Name', token: '{{name}}' },
                        { label: 'Phone', token: '{{phone}}' },
                        { label: 'Email', token: '{{email}}' },
                        { label: 'Pagenumbers', token: '{{page}} / {{pages}}' },
                      ].map((ph) => (
                        <button
                          key={ph.label}
                          type="button"
                          onClick={() => {
                            const fc = template.style.footerConfig || {};
                            const current = fc[focusedFooterCol] || '';
                            updateStyleConfig({
                              footerConfig: {
                                ...fc,
                                customEnabled: true,
                                [focusedFooterCol]: `${current}${current ? ' ' : ''}${ph.token}`,
                              },
                            });
                          }}
                          className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-teal-500 text-[11px]"
                        >
                          <span>{ph.label} </span>
                          <code className="font-mono text-[10px] text-slate-500">{ph.token}</code>
                        </button>
                      ))}
                    </div>
                  </div>

                  {(
                    [
                      { key: 'leftText', label: 'Left column', placeholder: 'e.g. {{name}}' },
                      { key: 'centerText', label: 'Center column', placeholder: 'Optional' },
                      {
                        key: 'rightText',
                        label: 'Right column',
                        placeholder: 'e.g. {{page}} / {{pages}}',
                      },
                    ] as const
                  ).map((col) => {
                    const fc = template.style.footerConfig || {};
                    return (
                      <div key={col.key}>
                        <label className="block font-semibold mb-1">{col.label}</label>
                        <input
                          value={fc[col.key] || ''}
                          onFocus={() => setFocusedFooterCol(col.key)}
                          onChange={(e) =>
                            updateStyleConfig({
                              footerConfig: {
                                ...fc,
                                customEnabled: true,
                                [col.key]: e.target.value,
                              },
                            })
                          }
                          placeholder={col.placeholder}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeNav === 'sections' && (
          <div className="space-y-3">
            {/* Summary Card */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
              <h3 className="font-semibold text-sm">Summary</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={template.style.sectionCustomizations?.showSummaryHeading ?? true}
                  onChange={(e) =>
                    updateStyleConfig({
                      sectionCustomizations: {
                        ...template.style.sectionCustomizations,
                        showSummaryHeading: e.target.checked,
                      },
                    })
                  }
                  className="accent-teal-600 rounded"
                />
                <span>Show summary heading</span>
              </label>
            </div>

            {/* Work Experience Card */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
              <h3 className="font-semibold text-sm">Work Experience</h3>
              <div className="text-[11px] font-medium text-slate-500">Title/Subtitle Order</div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'role-first', label: 'Job Title – Employer' },
                    { id: 'company-first', label: 'Employer – Job Title' },
                  ] as const
                ).map((opt) => {
                  const active =
                    (template.style.sectionCustomizations?.experienceTitleOrder || 'role-first') ===
                    opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        updateStyleConfig({
                          sectionCustomizations: {
                            ...template.style.sectionCustomizations,
                            experienceTitleOrder: opt.id,
                          },
                        })
                      }
                      className={`py-1.5 px-2 rounded-lg border text-[11px] transition ${
                        active
                          ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Education Card */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
              <h3 className="font-semibold text-sm">Education</h3>
              <div className="text-[11px] font-medium text-slate-500">Title & Subtitle Order</div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'degree-first', label: 'Degree, School' },
                    { id: 'school-first', label: 'School, Degree' },
                  ] as const
                ).map((opt) => {
                  const active =
                    (template.style.sectionCustomizations?.educationTitleOrder ||
                      'degree-first') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        updateStyleConfig({
                          sectionCustomizations: {
                            ...template.style.sectionCustomizations,
                            educationTitleOrder: opt.id,
                          },
                        })
                      }
                      className={`py-1.5 px-2 rounded-lg border text-[11px] transition ${
                        active
                          ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Skills Card */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
              <h3 className="font-semibold text-sm">Skills</h3>
              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    { id: 'grid', label: 'Grid' },
                    { id: 'rows', label: 'Rows' },
                    { id: 'compact', label: 'Compact' },
                    { id: 'bubble', label: 'Bubble' },
                  ] as const
                ).map((opt) => {
                  const active =
                    (template.style.sectionCustomizations?.skillsLayout || 'grid') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        updateStyleConfig({
                          sectionCustomizations: {
                            ...template.style.sectionCustomizations,
                            skillsLayout: opt.id,
                          },
                        })
                      }
                      className={`py-1.5 rounded-lg border text-[11px] transition ${
                        active
                          ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {(template.style.sectionCustomizations?.skillsLayout || 'grid') === 'grid' && (
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {([1, 2, 3, 4] as const).map((cols) => {
                    const active =
                      (template.style.sectionCustomizations?.skillsGridCols || 3) === cols;
                    return (
                      <button
                        key={cols}
                        type="button"
                        onClick={() =>
                          updateStyleConfig({
                            sectionCustomizations: {
                              ...template.style.sectionCustomizations,
                              skillsGridCols: cols,
                            },
                          })
                        }
                        className={`py-1 rounded-lg border text-[11px] font-mono transition ${
                          active
                            ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {cols} Col
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section Visibility */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <h3 className="font-semibold text-sm mb-2">Section Visibility</h3>
              {sortedSections
                .filter((s) => s.type !== 'page_break')
                .map((sec) => (
                  <div
                    key={sec.id}
                    className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <span>{sec.title}</span>
                    <button
                      type="button"
                      onClick={() => toggleSectionVisibility(sec.id)}
                      className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      {sec.visible ? (
                        <Eye className="w-4 h-4 text-teal-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 opacity-50" />
                      )}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
