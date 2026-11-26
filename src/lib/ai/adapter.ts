import { z } from 'zod';
import { AIConfig } from '@/types';
import {
  AIAdapterError,
  normalizeHttpError,
  parseAndValidateJSON,
} from './jsonRepair';

interface ProviderCallPayload {
  url: string;
  headers: Record<string, string>;
  body: unknown;
  extractText: (json: Record<string, unknown>) => string;
}

function buildProviderPayload(
  config: AIConfig,
  systemPrompt: string,
  userPrompt: string
): ProviderCallPayload {
  const model = config.model.trim();

  if (config.provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(config.apiKey.trim())}`;
    return {
      url,
      headers: { 'Content-Type': 'application/json' },
      body: {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      },
      extractText: (json) => {
        const candidates = json.candidates as Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
        return candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      },
    };
  }

  if (config.provider === 'anthropic') {
    return {
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: {
        model,
        max_tokens: 2048,
        temperature: 0.3,
        system: `${systemPrompt}\nRespond ONLY with a single valid JSON object.`,
        messages: [{ role: 'user', content: userPrompt }],
      },
      extractText: (json) => {
        const content = json.content as Array<{ type?: string; text?: string }>;
        return content?.find((c) => c.type === 'text')?.text ?? '';
      },
    };
  }

  // OpenAI, OpenRouter, or Custom OpenAI-compatible
  const baseUrl =
    config.provider === 'openrouter'
      ? 'https://openrouter.ai/api/v1'
      : config.provider === 'custom'
        ? (config.customBaseUrl || 'http://localhost:11434/v1').replace(/\/+$/, '')
        : 'https://api.openai.com/v1';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.apiKey.trim()) {
    headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
  }
  if (config.provider === 'openrouter') {
    headers['HTTP-Referer'] = typeof window !== 'undefined' ? window.location.origin : 'https://resumevix.app';
    headers['X-Title'] = 'ResumeVix';
  }

  return {
    url: `${baseUrl}/chat/completions`,
    headers,
    body: {
      model,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `${systemPrompt}\nReturn ONLY valid JSON.` },
        { role: 'user', content: userPrompt },
      ],
    },
    extractText: (json) => {
      const choices = json.choices as Array<{ message?: { content?: string } }>;
      return choices?.[0]?.message?.content ?? '';
    },
  };
}

export async function executeStructuredAI<T>(
  config: AIConfig,
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  if (!config.apiKey.trim() && config.provider !== 'custom') {
    throw new AIAdapterError(
      'MISSING_KEY',
      'No API key configured. Open AI Settings to add your BYOK key.'
    );
  }

  const payload = buildProviderPayload(config, systemPrompt, userPrompt);

  let response: Response;
  try {
    const shouldProxy =
      config.useServerProxyForCors &&
      (config.provider === 'anthropic' || config.provider === 'custom') &&
      typeof window !== 'undefined';

    if (shouldProxy) {
      response = await fetch('/api/ai/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: payload.url,
          headers: payload.headers,
          body: payload.body,
        }),
      });
    } else {
      response = await fetch(payload.url, {
        method: 'POST',
        headers: payload.headers,
        body: JSON.stringify(payload.body),
      });
    }
  } catch (err) {
    throw new AIAdapterError(
      'NETWORK_CORS',
      `Network or CORS error calling ${config.provider}: ${
        err instanceof Error ? err.message : 'Unknown error'
      }`
    );
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw normalizeHttpError(response.status, errText);
  }

  const json = (await response.json()) as Record<string, unknown>;
  const rawText = payload.extractText(json);
  return parseAndValidateJSON(rawText, schema);
}
