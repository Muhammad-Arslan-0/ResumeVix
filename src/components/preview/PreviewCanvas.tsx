'use client';

import React, { useDeferredValue, useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import { UnifiedTemplateRenderer } from '@/templates/UnifiedTemplateRenderer';
import { buildGoogleFontsHref } from '@/lib/fonts';

// 96 DPI approximate page heights in px: A4 = 297mm (~1122.5px), Letter = 11in (1056px)
const PAGE_HEIGHT_PX = {
  A4: 1122.5,
  LETTER: 1056,
};

export const PreviewCanvas: React.FC = () => {
  const resume = useResumeStore((s) => s.resume);
  const template = useResumeStore((s) => s.template);
  const previewZoom = useResumeStore((s) => s.previewZoom);
  const setPreviewZoom = useResumeStore((s) => s.setPreviewZoom);

  // Defer rapid typing updates to keep the editor input loop at 60fps
  const deferredResume = useDeferredValue(resume);
  const deferredTemplate = useDeferredValue(template);

  const pageRef = useRef<HTMLDivElement>(null);
  const [pageBreaks, setPageBreaks] = useState<number[]>([]);

  const fontsHref = buildGoogleFontsHref([
    deferredTemplate.style.fontFamily,
    deferredTemplate.style.headingFontFamily || '',
  ]);

  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const pageH = PAGE_HEIGHT_PX[deferredTemplate.pageSize];
    const observer = new ResizeObserver(() => {
      const totalH = el.scrollHeight;
      const count = Math.floor((totalH - 12) / pageH);
      const breaks: number[] = [];
      for (let i = 1; i <= count; i++) {
        breaks.push(i * pageH);
      }
      setPageBreaks(breaks);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [deferredTemplate.pageSize, deferredResume, deferredTemplate]);

  return (
    <div className="relative flex-1 h-full overflow-auto bg-slate-200/80 dark:bg-slate-950 p-4 sm:p-8 print-container">
      {fontsHref && <link rel="stylesheet" href={fontsHref} />}

      {/* Floating Zoom Controls */}
      <div className="no-print sticky top-2 z-20 flex justify-end pointer-events-none mb-2">
        <div className="pointer-events-auto inline-flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 shadow-sm text-xs">
          <button
            type="button"
            onClick={() => setPreviewZoom(previewZoom - 0.1)}
            aria-label="Zoom out"
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="w-11 text-center font-mono text-[11px]">
            {Math.round(previewZoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setPreviewZoom(previewZoom + 0.1)}
            aria-label="Zoom in"
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setPreviewZoom(0.85)}
            aria-label="Reset zoom"
            title="Reset Zoom"
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scaled Preview Wrapper */}
      <div
        className="mx-auto origin-top transition-transform duration-100 print:transform-none"
        style={{
          transform: `scale(${previewZoom})`,
          width: deferredTemplate.pageSize === 'A4' ? '210mm' : '215.9mm',
        }}
      >
        <div ref={pageRef} className="relative">
          <UnifiedTemplateRenderer data={deferredResume} config={deferredTemplate} />

          {/* Visual Multi-Page Break Guides (screen only) */}
          {pageBreaks.map((topPx, idx) => (
            <div
              key={idx}
              className="no-print absolute left-0 right-0 border-t-2 border-dashed border-teal-500/70 pointer-events-none flex justify-end"
              style={{ top: `${topPx}px` }}
            >
              <span className="bg-teal-600 text-white text-[10px] font-medium px-2 py-0.5 rounded-b shadow">
                Page {idx + 2}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
