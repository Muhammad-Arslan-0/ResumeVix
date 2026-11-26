import { PageSize } from '@/types';

export function triggerPrintPdf(pageSize: PageSize, documentTitle: string): void {
  const prevTitle = document.title;
  const safeTitle = documentTitle.trim() || 'ResumeVix_CV';
  document.title = safeTitle;

  // Inject dynamic @page size rule so A4 vs US Letter matches exact selection
  const styleId = 'rv-dynamic-print-page';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `@media print { @page { size: ${
    pageSize === 'A4' ? 'A4 portrait' : 'letter portrait'
  }; margin: 0; } }`;

  window.print();

  // Restore document title after print dialog closes
  setTimeout(() => {
    document.title = prevTitle;
  }, 500);
}
