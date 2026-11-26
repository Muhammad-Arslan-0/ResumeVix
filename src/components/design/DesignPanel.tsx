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
  BookOpen,
  Briefcase,
  Check,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FolderGit2,
  GraduationCap,
  Layers,
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
              <label className="block font-medium mb-1">Page Format</label>
              <select
                value={template.pageSize}
                onChange={(e) => setPageSize(e.target.value as 'A4' | 'LETTER')}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
              >
                <option value="A4">A4 (210 × 297 mm)</option>
                <option value="LETTER">US Letter (8.5 × 11 in)</option>
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
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="font-semibold text-sm">Entry Layout</h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'auto', label: 'Template Default' },
                { id: 'date-left-rail', label: '2-Column (Date & Location Left Rail)' },
                { id: 'stacked', label: 'Stacked (Title & Date Inline)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    updateStyleConfig({
                      entryLayoutOverride: opt.id as 'auto' | 'date-left-rail' | 'stacked',
                    })
                  }
                  className={`text-left px-3 py-2 rounded-lg border ${
                    (template.style.entryLayoutOverride || 'auto') === opt.id
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 font-medium'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeNav === 'font-size' && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="font-semibold text-sm">Font Size & Line Height</h3>
            <div>
              <div className="flex justify-between mb-1">
                <span>Base Font Size</span>
                <span className="font-mono">{template.style.fontSizePt}pt</span>
              </div>
              <input
                type="range"
                min={8.5}
                max={12}
                step={0.5}
                value={template.style.fontSizePt}
                onChange={(e) => updateStyleConfig({ fontSizePt: parseFloat(e.target.value) })}
                className="w-full accent-teal-600"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Line Height</span>
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
            <h3 className="font-semibold text-sm">Margins & Spacing</h3>
            <div>
              <div className="flex justify-between mb-1">
                <span>Page Margins</span>
                <span className="font-mono">{template.style.marginMm}mm</span>
              </div>
              <input
                type="range"
                min={8}
                max={24}
                step={1}
                value={template.style.marginMm}
                onChange={(e) => updateStyleConfig({ marginMm: parseInt(e.target.value, 10) })}
                className="w-full accent-teal-600"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Section Spacing</span>
                <span className="font-mono">{template.style.sectionSpacingPx}px</span>
              </div>
              <input
                type="range"
                min={6}
                max={26}
                step={2}
                value={template.style.sectionSpacingPx}
                onChange={(e) =>
                  updateStyleConfig({ sectionSpacingPx: parseInt(e.target.value, 10) })
                }
                className="w-full accent-teal-600"
              />
            </div>
          </div>
        )}

        {activeNav === 'headings' && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="font-semibold text-sm">Section Headings</h3>
            <select
              value={template.style.headingVariant || 'auto'}
              onChange={(e) =>
                updateStyleConfig({
                  headingVariant: e.target.value as NonNullable<
                    typeof template.style.headingVariant
                  >,
                })
              }
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
            >
              <option value="auto">Template Default</option>
              <option value="flowcv-banner">Tinted Banner Bar (FlowCV Style)</option>
              <option value="ats-minimal">Classic Bottom Rule</option>
              <option value="academic-ruled">Accent Bottom Rule</option>
              <option value="executive-bold">Bold Left Accent Bar</option>
              <option value="creative-pill">Accent Pill Badge</option>
            </select>
            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={template.style.headingUppercase ?? true}
                onChange={(e) => updateStyleConfig({ headingUppercase: e.target.checked })}
                className="accent-teal-600"
              />
              <span>Uppercase Section Headings</span>
            </label>
          </div>
        )}

        {activeNav === 'font' && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="font-semibold text-sm">Typography</h3>
            <div>
              <label className="block font-medium mb-1">Body Font</label>
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
              <label className="block font-medium mb-1">Heading Font</label>
              <select
                value={template.style.headingFontFamily || template.style.fontFamily}
                onChange={(e) => updateStyleConfig({ headingFontFamily: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
              >
                {CURATED_FONTS.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name} ({f.category})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeNav === 'colors' && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="font-semibold text-sm">Accent Palette</h3>
            <div className="flex flex-wrap items-center gap-2">
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
            </div>
            <label className="flex items-center gap-2 pt-1">
              <span>Custom Hex:</span>
              <input
                type="color"
                value={template.style.accentColor}
                onChange={(e) => updateStyleConfig({ accentColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
              />
              <span className="font-mono text-[11px]">{template.style.accentColor}</span>
            </label>
          </div>
        )}

        {activeNav === 'header' && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="font-semibold text-sm">Header Layout</h3>
            <select
              value={template.style.headerStyleOverride || 'auto'}
              onChange={(e) =>
                updateStyleConfig({
                  headerStyleOverride: e.target.value as NonNullable<
                    typeof template.style.headerStyleOverride
                  >,
                })
              }
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
            >
              <option value="auto">Template Default</option>
              <option value="icon-centered">Centered with Contact Icons</option>
              <option value="centered">Centered Classic</option>
              <option value="left">Left Aligned</option>
              <option value="split">Split (Name Left, Contact Right)</option>
              <option value="banner">Full-Width Accent Banner</option>
            </select>
          </div>
        )}

        {activeNav === 'footer' && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="font-semibold text-sm">Footer</h3>
            <input
              value={template.style.footerText || ''}
              onChange={(e) => updateStyleConfig({ footerText: e.target.value })}
              placeholder="Optional footer note (e.g. References available upon request)"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
            />
          </div>
        )}

        {activeNav === 'sections' && (
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
        )}
      </div>
    </div>
  );
};
