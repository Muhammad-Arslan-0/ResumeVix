'use client';

import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Cloud,
  FileText,
  Layers,
  Printer,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { TEMPLATE_REGISTRY } from '@/templates/registry';

interface LandingPageProps {
  onOpenAuth: () => void;
}

const FEATURES = [
  {
    icon: Layers,
    title: '21+ ATS & Academic Templates',
    description:
      'Switch instantly between strict single-column ATS layouts, Academic CVs with ORCID & publications, Executive, and Creative designs.',
  },
  {
    icon: Wand2,
    title: 'Design by Self AI Engine',
    description:
      'Describe your target role, accent color, or layout density in plain English and watch your resume restyle and refine deterministically.',
  },
  {
    icon: ShieldCheck,
    title: 'BYOK Privacy + Lightweight AI',
    description:
      'Bring your own Gemini, OpenAI, Claude, or OpenRouter key—stored locally in your browser—or use fast Gemini Flash-Lite defaults.',
  },
  {
    icon: Printer,
    title: '1:1 Selectable Vector PDF',
    description:
      'Strict A4 and US Letter page rules with intelligent page-break guards so headings and bullet cards never slice across pages.',
  },
  {
    icon: FileText,
    title: 'Drag-and-Drop Live Studio',
    description:
      'Reorder sections and entries effortlessly, rename headings, toggle visibility, and preview changes in real time.',
  },
  {
    icon: Cloud,
    title: 'Cloud Auto-Save & Dashboard',
    description:
      'Manage multiple tailored resumes from your dashboard with 1000ms debounced cloud sync and JSON backup portability.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/icon.png"
              alt="ResumeVix"
              className="w-8 h-8 rounded-lg object-cover shadow-sm"
            />
            <span className="font-bold text-base tracking-tight">ResumeVix</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenAuth}
              className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-16 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{TEMPLATE_REGISTRY.length} ATS & Academic Templates • BYOK AI • Cloud Sync</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight">
            Build ATS-Precise Resumes & Academic CVs in Minutes
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            ResumeVix combines a zero-clutter live editor, drag-and-drop section control,
            prompt-driven <strong>Design by Self</strong> styling, and crisp A4/Letter PDF export—with
            full cloud sync across all your tailored drafts.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-md transition"
            >
              <span>Sign In / Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              Strict ATS Single-Column & Academic Layouts
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              Selectable Vector Text PDF Export
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              Multi-Resume Cloud Dashboard
            </span>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 shadow-sm"
                >
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h2 className="font-semibold text-sm">{feat.title}</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-5 text-center text-xs text-slate-500 dark:text-slate-400">
        ResumeVix Studio — Built for clarity, ATS precision, and speed.
      </footer>
    </div>
  );
};
