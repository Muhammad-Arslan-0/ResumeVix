import { describe, expect, it, beforeEach } from 'vitest';
import { useResumeStore } from '../useResumeStore';
import { TEMPLATE_REGISTRY } from '@/templates/registry';

describe('useResumeStore', () => {
  beforeEach(() => {
    useResumeStore.getState().loadPreset('tech');
  });

  it('has 21 templates in the registry across 4 categories', () => {
    expect(TEMPLATE_REGISTRY.length).toBe(21);
    const categories = new Set(TEMPLATE_REGISTRY.map((t) => t.category));
    expect(categories).toEqual(new Set(['ats', 'academic', 'executive', 'creative']));
  });

  it('reorders top-level sections and supports undo/redo', () => {
    const initialFirst = useResumeStore.getState().template.sections[0].id;
    const second = useResumeStore.getState().template.sections[1].id;

    useResumeStore.getState().reorderSections(initialFirst, second);
    const afterReorder = [...useResumeStore.getState().template.sections].sort(
      (a, b) => a.order - b.order
    );
    expect(afterReorder[0].id).toBe(second);

    useResumeStore.getState().undo();
    const afterUndo = [...useResumeStore.getState().template.sections].sort(
      (a, b) => a.order - b.order
    );
    expect(afterUndo[0].id).toBe(initialFirst);
  });

  it('applies AIDesignPatch atomically', () => {
    useResumeStore.getState().applyAIDesignPatch({
      rationale: 'Switch to compact ATS backend resume',
      templateId: 'ats-tech-compact',
      style: {
        accentColor: '#0f766e',
        density: 'compact',
      },
      contentUpdates: {
        headline: 'Staff Distributed Systems Engineer',
        skillsToAdd: [{ category: 'Languages', items: ['C++'] }],
      },
    });

    const state = useResumeStore.getState();
    expect(state.template.templateId).toBe('ats-tech-compact');
    expect(state.template.style.accentColor).toBe('#0f766e');
    expect(state.resume.profile.headline).toBe('Staff Distributed Systems Engineer');
    const langGroup = state.resume.skills.find((s) => s.category === 'Languages');
    expect(langGroup?.items).toContain('C++');
  });
});
