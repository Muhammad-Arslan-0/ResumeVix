'use client';

import React, { useState } from 'react';
import { ExternalLink, Eye, EyeOff, KeyRound, Loader2, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import { AI_PROVIDERS, getProviderMeta } from '@/lib/ai/providers';
import { AIProviderId } from '@/types';

interface AISettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({ open, onClose }) => {
  const aiConfig = useResumeStore((s) => s.aiConfig);
  const setAIConfig = useResumeStore((s) => s.setAIConfig);
  const [showKey, setShowKey] = useState(false);
  const [liveModels, setLiveModels] = useState<string[] | null>(null);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelFetchError, setModelFetchError] = useState<string | null>(null);

  if (!open) return null;

  const meta = getProviderMeta(aiConfig.provider);
  const displayedModels = liveModels && liveModels.length > 0 ? liveModels : meta.models;

  const handleProviderChange = (provider: AIProviderId) => {
    const nextMeta = getProviderMeta(provider);
    setLiveModels(null);
    setModelFetchError(null);
    setAIConfig({
      provider,
      model: nextMeta.defaultModel,
    });
  };

  const handleFetchModels = async () => {
    if (!aiConfig.apiKey.trim() && aiConfig.provider !== 'custom') {
      setModelFetchError('Enter your API key first to fetch live models.');
      return;
    }
    setFetchingModels(true);
    setModelFetchError(null);
    try {
      let ids: string[] = [];
      if (aiConfig.provider === 'gemini') {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
            aiConfig.apiKey.trim()
          )}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          models?: Array<{ name: string; supportedGenerationMethods?: string[] }>;
        };
        ids = (data.models ?? [])
          .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m) => m.name.replace(/^models\//, ''));
      } else if (aiConfig.provider === 'anthropic') {
        ids = meta.models;
      } else {
        const baseUrl =
          aiConfig.provider === 'openrouter'
            ? 'https://openrouter.ai/api/v1'
            : aiConfig.provider === 'custom'
              ? (aiConfig.customBaseUrl || 'http://localhost:11434/v1').replace(/\/+$/, '')
              : 'https://api.openai.com/v1';
        const headers: Record<string, string> = {};
        if (aiConfig.apiKey.trim()) headers['Authorization'] = `Bearer ${aiConfig.apiKey.trim()}`;
        const res = await fetch(`${baseUrl}/models`, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { data?: Array<{ id: string }> };
        ids = (data.data ?? []).map((m) => m.id).slice(0, 60);
      }
      if (ids.length === 0) throw new Error('No compatible models returned.');
      setLiveModels(ids);
      if (!ids.includes(aiConfig.model)) {
        setAIConfig({ model: ids[0] });
      }
    } catch (err) {
      setModelFetchError(err instanceof Error ? err.message : 'Failed to load models');
    } finally {
      setFetchingModels(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="byok-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-teal-600" />
            <h2 id="byok-modal-title" className="font-semibold text-sm">
              BYOK AI Engine Settings
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Your API key stays in your browser and is never logged or stored on any third-party
              server.
            </p>
          </div>

          <div>
            <label className="block font-medium mb-1">AI Provider</label>
            <select
              value={aiConfig.provider}
              onChange={(e) => handleProviderChange(e.target.value as AIProviderId)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-medium">Model</label>
              {aiConfig.provider !== 'anthropic' && (
                <button
                  type="button"
                  onClick={handleFetchModels}
                  disabled={fetchingModels}
                  className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:underline font-medium disabled:opacity-50"
                >
                  {fetchingModels ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  <span>Fetch Live Models</span>
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <select
                value={displayedModels.includes(aiConfig.model) ? aiConfig.model : '__custom__'}
                onChange={(e) => {
                  if (e.target.value !== '__custom__') {
                    setAIConfig({ model: e.target.value });
                  }
                }}
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
              >
                {displayedModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
                <option value="__custom__">Custom model ID...</option>
              </select>
            </div>
            {modelFetchError && (
              <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{modelFetchError}</p>
            )}
            <input
              type="text"
              value={aiConfig.model}
              onChange={(e) => setAIConfig({ model: e.target.value })}
              placeholder="Model identifier"
              className="mt-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 font-mono text-[11px]"
            />
          </div>

          {meta.requiresCustomBaseUrl && (
            <div>
              <label className="block font-medium mb-1">Custom OpenAI-Compatible Base URL</label>
              <input
                type="url"
                value={aiConfig.customBaseUrl || ''}
                onChange={(e) => setAIConfig({ customBaseUrl: e.target.value })}
                placeholder="http://localhost:11434/v1"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-mono text-[11px]"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-medium">API Key</label>
              {meta.apiKeyUrl && (
                <a
                  href={meta.apiKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:underline font-medium"
                >
                  <span>Get {meta.label} API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={aiConfig.apiKey}
                onChange={(e) => setAIConfig({ apiKey: e.target.value })}
                placeholder={meta.keyPlaceholder}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 pr-9 font-mono text-[11px]"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={aiConfig.persistKeyInLocalStorage}
                onChange={(e) => setAIConfig({ persistKeyInLocalStorage: e.target.checked })}
                className="accent-teal-600"
              />
              <span>Remember key in browser localStorage</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={aiConfig.useServerProxyForCors}
                onChange={(e) => setAIConfig({ useServerProxyForCors: e.target.checked })}
                className="accent-teal-600"
              />
              <span>Use stateless CORS pass-through for Anthropic/Custom endpoints</span>
            </label>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
