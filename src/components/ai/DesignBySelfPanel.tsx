'use client';

import React, { useState } from 'react';
import { AlertCircle, Loader2, Sparkles, Undo2, Wand2 } from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import { executeStructuredAI } from '@/lib/ai/adapter';
import { buildDesignBySelfPrompts } from '@/lib/ai/prompts';
import { AIDesignPatchSchema } from '@/lib/ai/schemas';

const EXAMPLE_PROMPTS = [
  'Create a clean, compact ATS resume for a senior backend engineer with a deep teal accent',
  'Switch to an academic CV layout emphasizing publications, education, and research experience',
  'Use an executive boardroom style with spacious margins and a dark navy accent',
  'Rewrite my summary to sound more impact-driven and highlight distributed systems scale',
];

export const DesignBySelfPanel: React.FC<{ onOpenSettings: () => void }> = ({
  onOpenSettings,
}) => {
  const resume = useResumeStore((s) => s.resume);
  const template = useResumeStore((s) => s.template);
  const aiConfig = useResumeStore((s) => s.aiConfig);
  const applyAIDesignPatch = useResumeStore((s) => s.applyAIDesignPatch);
  const undo = useResumeStore((s) => s.undo);

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRationale, setLastRationale] = useState<string | null>(null);

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    setError(null);
    setLoading(true);
    try {
      const { systemPrompt, userPrompt } = buildDesignBySelfPrompts(
        prompt.trim(),
        resume,
        template
      );
      const patch = await executeStructuredAI(
        aiConfig,
        systemPrompt,
        userPrompt,
        AIDesignPatchSchema
      );
      applyAIDesignPatch(patch);
      setLastRationale(patch.rationale);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply AI design.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="p-3.5 rounded-xl bg-gradient-to-br from-teal-50 to-slate-50 dark:from-teal-950/40 dark:to-slate-900 border border-teal-200/70 dark:border-teal-800/50">
        <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-semibold text-sm">
          <Wand2 className="w-4 h-4" />
          <span>Design by Self</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
          Describe the layout, tone, accent color, density, or content focus you want. ResumeVix
          will automatically select a matching template, update typography, reorder sections, and
          refine content.
        </p>
      </div>

      <form onSubmit={handleRun} className="space-y-2.5">
        <textarea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Switch to a compact ATS resume for a Staff Backend Engineer with a deep teal accent and put Skills above Education..."
          className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />

        {error && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{error}</p>
              {error.toLowerCase().includes('key') && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="underline font-medium mt-1"
                >
                  Open BYOK AI Settings
                </button>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-medium transition"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Designing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Apply Design & Content Patch</span>
            </>
          )}
        </button>
      </form>

      {lastRationale && (
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
          <div className="font-semibold text-slate-800 dark:text-slate-100">
            Applied AI Changes:
          </div>
          <p className="text-slate-600 dark:text-slate-300">{lastRationale}</p>
          <button
            type="button"
            onClick={() => {
              undo();
              setLastRationale(null);
            }}
            className="inline-flex items-center gap-1 text-teal-700 dark:text-teal-300 font-medium hover:underline"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo AI Patch</span>
          </button>
        </div>
      )}

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Example Prompts
        </h4>
        <div className="space-y-1.5">
          {EXAMPLE_PROMPTS.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPrompt(ex)}
              className="w-full text-left text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300 transition"
            >
              &ldquo;{ex}&rdquo;
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
