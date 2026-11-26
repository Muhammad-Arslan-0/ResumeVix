'use client';

import React, { useState } from 'react';
import { Award, BookOpen, Globe2, Heart, Layers, Plus, Sparkles, X } from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';

interface AddSectionModalProps {
  open: boolean;
  onClose: () => void;
}

const SECTION_CATALOG = [
  {
    title: 'Languages',
    desc: 'Add spoken languages and proficiency levels (e.g. Native, Professional).',
    icon: Globe2,
  },
  {
    title: 'Certificates & Licenses',
    desc: 'Showcase industry certifications, bootcamps, or licenses.',
    icon: Award,
  },
  {
    title: 'Awards & Honors',
    desc: 'Highlight scholarships, competition wins, or recognitions.',
    icon: Sparkles,
  },
  {
    title: 'Courses & Training',
    desc: 'List specialized coursework or executive education.',
    icon: BookOpen,
  },
  {
    title: 'Volunteering & Leadership',
    desc: 'Include community leadership, mentoring, or non-profit work.',
    icon: Heart,
  },
];

export const AddSectionModal: React.FC<AddSectionModalProps> = ({ open, onClose }) => {
  const addCustomSection = useResumeStore((s) => s.addCustomSection);
  const [customTitle, setCustomTitle] = useState('');

  if (!open) return null;

  const handleSelect = (title: string) => {
    addCustomSection(title);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-section-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            <h2 id="add-section-title" className="font-semibold text-sm">
              Add Content Section
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add section modal"
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SECTION_CATALOG.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => handleSelect(item.title)}
                  className="text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition space-y-1"
                >
                  <div className="flex items-center gap-2 font-semibold text-xs text-slate-900 dark:text-slate-100">
                    <Icon className="w-3.5 h-3.5 text-teal-600" />
                    <span>{item.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                </button>
              );
            })}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!customTitle.trim()) return;
              handleSelect(customTitle.trim());
              setCustomTitle('');
            }}
            className="pt-2 border-t border-slate-200 dark:border-slate-800 flex gap-2"
          >
            <input
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Or enter a custom section title..."
              className="flex-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
