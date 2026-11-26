'use client';

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import { TEMPLATE_REGISTRY } from '@/templates/registry';
import { ACCENT_PALETTES, CURATED_FONTS } from '@/lib/fonts';
import { DensityLevel, TemplateCategory } from '@/types';

const CATEGORIES: { id: TemplateCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All (21)' },
  { id: 'ats', label: 'ATS Minimal' },
  { id: 'academic', label: 'Academic' },
  { id: 'executive', label: 'Executive' },
  { id: 'creative', label: 'Creative' },
];

export const DesignPanel: React.FC = () => {
  const template = useResumeStore((s) => s.template);
  const switchTemplate = useResumeStore((s) => s.switchTemplate);
  const updateStyleConfig = useResumeStore((s) => s.updateStyleConfig);

  const [category, setCategory] = useState<TemplateCategory | 'all'>('all');

  const filteredTemplates =
    category === 'all'
      ? TEMPLATE_REGISTRY
      : TEMPLATE_REGISTRY.filter((t) => t.category === category);

  return (
    <div className="space-y-6 pb-10">
      {/* Template Gallery */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Templates
          </h3>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`text-xs px-2.5 py-1 rounded-full border transition ${
                category === cat.id
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filteredTemplates.map((t) => {
            const isActive = template.templateId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => switchTemplate(t.id)}
                className={`text-left p-2.5 rounded-xl border transition relative ${
                  isActive
                    ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/30 ring-1 ring-teal-600'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-medium text-xs text-slate-900 dark:text-slate-100">
                    {t.name}
                  </span>
                  {isActive && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {t.description}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {t.atsScore}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {t.layout}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Accent Color */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Accent Palette
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {ACCENT_PALETTES.map((p) => (
            <button
              key={p.hex}
              type="button"
              onClick={() => updateStyleConfig({ accentColor: p.hex })}
              title={p.name}
              aria-label={`Select ${p.name} accent color`}
              className={`w-7 h-7 rounded-full border-2 transition ${
                template.style.accentColor.toLowerCase() === p.hex.toLowerCase()
                  ? 'border-slate-900 dark:border-white scale-110'
                  : 'border-transparent'
              }`}
              style={{ backgroundColor: p.hex }}
            />
          ))}
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 ml-1">
            <span>Custom:</span>
            <input
              type="color"
              value={template.style.accentColor}
              onChange={(e) => updateStyleConfig({ accentColor: e.target.value })}
              className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
            />
          </label>
        </div>
      </section>

      {/* Typography */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Typography & Spacing
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-medium mb-1">Body Font</label>
            <select
              value={template.style.fontFamily}
              onChange={(e) => updateStyleConfig({ fontFamily: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5"
            >
              {CURATED_FONTS.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name} ({f.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Heading Font</label>
            <select
              value={template.style.headingFontFamily || template.style.fontFamily}
              onChange={(e) => updateStyleConfig({ headingFontFamily: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5"
            >
              {CURATED_FONTS.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name} ({f.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Density Presets */}
        <div>
          <label className="block text-xs font-medium mb-1">Layout Density</label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['compact', 'standard', 'spacious'] as DensityLevel[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => updateStyleConfig({ density: d })}
                className={`text-xs py-1.5 rounded-lg border capitalize transition ${
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

        {/* Sliders */}
        <div className="space-y-2.5 pt-1">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Font Size</span>
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
            <div className="flex justify-between text-xs mb-1">
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

          <div>
            <div className="flex justify-between text-xs mb-1">
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
            <div className="flex justify-between text-xs mb-1">
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
      </section>
    </div>
  );
};
