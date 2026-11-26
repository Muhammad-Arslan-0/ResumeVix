import { z } from 'zod';

export type AIErrorCode =
  | 'MISSING_KEY'
  | 'INVALID_KEY'
  | 'RATE_LIMIT'
  | 'QUOTA_EXCEEDED'
  | 'NETWORK_CORS'
  | 'SCHEMA_VALIDATION'
  | 'PROVIDER_ERROR';

export class AIAdapterError extends Error {
  constructor(
    public readonly code: AIErrorCode,
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'AIAdapterError';
  }
}

export function extractJsonString(raw: string): string {
  const trimmed = raw.trim();
  // Strip ```json ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1].trim();
  }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

export function parseAndValidateJSON<T>(raw: string, schema: z.ZodSchema<T>): T {
  const cleaned = extractJsonString(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new AIAdapterError(
      'SCHEMA_VALIDATION',
      'Model returned malformed JSON. Try again or switch to a stronger model.'
    );
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issueMsg = result.error.issues
      .slice(0, 2)
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new AIAdapterError(
      'SCHEMA_VALIDATION',
      `Model output did not match expected schema (${issueMsg}).`
    );
  }
  return result.data;
}

export function normalizeHttpError(status: number, bodyText: string): AIAdapterError {
  const lower = bodyText.toLowerCase();
  if (status === 401 || status === 403 || lower.includes('invalid api key') || lower.includes('incorrect api key')) {
    return new AIAdapterError('INVALID_KEY', 'Invalid or unauthorized API key. Please check your BYOK settings.', status);
  }
  if (status === 429) {
    if (lower.includes('quota') || lower.includes('insufficient_quota') || lower.includes('billing')) {
      return new AIAdapterError('QUOTA_EXCEEDED', 'Provider quota exceeded or billing inactive.', status);
    }
    return new AIAdapterError('RATE_LIMIT', 'Rate limit reached. Wait a moment and retry.', status);
  }
  return new AIAdapterError(
    'PROVIDER_ERROR',
    `Provider request failed (${status}): ${bodyText.slice(0, 180)}`,
    status
  );
}
