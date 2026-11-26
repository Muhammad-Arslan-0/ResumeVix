import { describe, expect, it } from 'vitest';
import { extractJsonString, parseAndValidateJSON, AIAdapterError } from '../jsonRepair';
import { AIDesignPatchSchema } from '../schemas';

describe('AI JSON repair and schema validation', () => {
  it('strips markdown code fences and parses valid AIDesignPatch', () => {
    const raw = '```json\n{"rationale":"Teal ATS layout","templateId":"ats-minimal","style":{"accentColor":"#0f766e"}}\n```';
    const patch = parseAndValidateJSON(raw, AIDesignPatchSchema);
    expect(patch.templateId).toBe('ats-minimal');
    expect(patch.style?.accentColor).toBe('#0f766e');
  });

  it('extracts JSON object from surrounding prose', () => {
    const raw = 'Here is your patch:\n{"rationale":"Academic layout","pageSize":"A4"}\nHope this helps!';
    const cleaned = extractJsonString(raw);
    const patch = parseAndValidateJSON(cleaned, AIDesignPatchSchema);
    expect(patch.pageSize).toBe('A4');
  });

  it('throws AIAdapterError on invalid hex color', () => {
    const raw = '{"rationale":"Bad color","style":{"accentColor":"not-a-hex"}}';
    expect(() => parseAndValidateJSON(raw, AIDesignPatchSchema)).toThrow(AIAdapterError);
  });
});
