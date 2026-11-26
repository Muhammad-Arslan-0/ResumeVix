'use client';

import React, { useDeferredValue, useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import { UnifiedTemplateRenderer } from '@/templates/UnifiedTemplateRenderer';
import { buildGoogleFontsHref } from '@/lib/fonts';

// 96 DPI approximate page dimensions in px: A4 = 297mm (~1122.5px), Letter = 11in (1056px)
const PAGE_HEIGHT_PX = {
  A4: 1122.52,
  LETTER: 1056,
};
const PX_PER_MM = 3.7795275591;

export const PreviewCanvas: React.FC = () => {
  const resume = useResumeStore((s) => s.resume);
  const template = useResumeStore((s) => s.template);
  const previewZoom = useResumeStore((s) => s.previewZoom);
  const setPreviewZoom = useResumeStore((s) => s.setPreviewZoom);

  // Defer rapid typing updates to keep the editor input loop at 60fps
  const deferredResume = useDeferredValue(resume);
  const deferredTemplate = useDeferredValue(template);

  const measureRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);

  const fontsHref = buildGoogleFontsHref([
    deferredTemplate.style.fontFamily,
    deferredTemplate.style.headingFontFamily || '',
    deferredTemplate.style.nameFontFamily || '',
    deferredTemplate.style.fallbackFontFamily || '',
  ]);

  const pageH = PAGE_HEIGHT_PX[deferredTemplate.pageSize];
  const marginXMm = deferredTemplate.style.marginXMm ?? deferredTemplate.style.marginMm;
  const marginYMm = deferredTemplate.style.marginYMm ?? deferredTemplate.style.marginMm;
  const marginYPx = marginYMm * PX_PER_MM;
  const contentPerPagePx = Math.max(200, pageH - marginYPx * 2);
  const widthMm = deferredTemplate.pageSize === 'A4' ? '210mm' : '215.9mm';

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const updateCount = () => {
      const totalH = el.scrollHeight;
      const count = Math.max(1, Math.ceil((totalH - 4) / contentPerPagePx));
      setPageCount(count);
    };
    updateCount();
    const observer = new ResizeObserver(updateCount);
    observer.observe(el);
    return () => observer.disconnect();
  }, [contentPerPagePx, deferredResume, deferredTemplate]);

  return (
    <div className="relative flex-1 h-full overflow-auto bg-slate-200/80 dark:bg-slate-950 p-4 sm:p-8 print-container">
      {fontsHref && <link rel="stylesheet" href={fontsHref} />}

      {/* Floating Zoom Controls */}
      <div className="no-print sticky top-2 z-20 flex justify-between items-center pointer-events-none mb-3">
        <span className="pointer-events-auto text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-300">
          {pageCount} {pageCount === 1 ? 'Page' : 'Pages'} ({deferredTemplate.pageSize})
        </span>

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

      {/* Offscreen Measurement Container (screen only) */}
      <div
        aria-hidden="true"
        className="no-print fixed -left-[9999px] top-0 pointer-events-none opacity-0"
        style={{
          width: `calc(${widthMm} - ${marginXMm * 2}mm)`,
        }}
      >
        <div ref={measureRef}>
          <UnifiedTemplateRenderer data={deferredResume} config={deferredTemplate} bare />
        </div>
      </div>

      {/* Screen Preview: Distinct Separated White A4/Letter Paper Sheets */}
      <div
        className="no-print mx-auto origin-top transition-transform duration-100 flex flex-col gap-6 pb-16"
        style={{
          transform: `scale(${previewZoom})`,
          width: widthMm,
        }}
      >
        {Array.from({ length: pageCount }).map((_, pageIdx) => {
          const fc = deferredTemplate.style.footerConfig;
          const interpolate = (tpl: string) =>
            tpl
              .replace(/\{\{name\}\}/gi, deferredResume.profile.fullName || '')
              .replace(/\{\{phone\}\}/gi, deferredResume.profile.phone || '')
              .replace(/\{\{email\}\}/gi, deferredResume.profile.email || '')
              .replace(/\{\{page\}\}/gi, String(pageIdx + 1))
              .replace(/\{\{pages\}\}/gi, String(pageCount));

          const leftFooter = fc?.customEnabled
            ? interpolate(fc.leftText || '')
            : fc?.showName
              ? deferredResume.profile.fullName
              : '';
          const centerFooter = fc?.customEnabled
            ? interpolate(fc.centerText || '')
            : fc?.showEmail
              ? deferredResume.profile.email
              : '';
          const rightFooter = fc?.customEnabled
            ? interpolate(fc.rightText || '')
            : fc?.showPageNumbers
              ? `${pageIdx + 1} / ${pageCount}`
              : '';
          const hasFooter = Boolean(leftFooter || centerFooter || rightFooter);

          return (
            <div key={pageIdx} className="flex flex-col items-center">
              <div
                className="bg-white shadow-xl rounded-[2px] box-border overflow-hidden relative"
                style={{
                  width: widthMm,
                  height: `${pageH}px`,
                  padding: `${marginYMm}mm ${marginXMm}mm`,
                }}
              >
                <div
                  className="overflow-hidden"
                  style={{ height: `${contentPerPagePx}px` }}
                >
                  <div
                    style={{
                      transform: `translateY(-${pageIdx * contentPerPagePx}px)`,
                    }}
                  >
                    <UnifiedTemplateRenderer
                      data={deferredResume}
                      config={deferredTemplate}
                      bare
                    />
                  </div>
                </div>

                {hasFooter && (
                  <div
                    className="absolute left-0 right-0 bottom-2 grid grid-cols-3 items-center text-[10px] text-slate-500"
                    style={{
                      paddingLeft: `${marginXMm}mm`,
                      paddingRight: `${marginXMm}mm`,
                      fontFamily: `'${deferredTemplate.style.fontFamily}', sans-serif`,
                    }}
                  >
                    <span className="text-left truncate">{leftFooter}</span>
                    <span className="text-center truncate">{centerFooter}</span>
                    <span className="text-right truncate">{rightFooter}</span>
                  </div>
                )}
              </div>
              <span className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Page {pageIdx + 1} of {pageCount}
              </span>
            </div>
          );
        })}
      </div>

      {/* Print-Only Natural Flow (exact vector PDF pagination with @page rules) */}
      <div className="hidden print:block">
        <UnifiedTemplateRenderer data={deferredResume} config={deferredTemplate} />
      </div>
    </div>
  );
};
