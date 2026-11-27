import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { PageSize } from '@/types';

/**
 * Generates and directly downloads a multi-page PDF file from the rendered
 * `[data-rv-pdf-page="true"]` paper sheets without opening the browser print dialog.
 */
export async function downloadResumePdf(
  pageSize: PageSize,
  documentTitle: string
): Promise<void> {
  const safeBase = (documentTitle.trim() || 'ResumeVix_CV')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_');

  const pageNodes = Array.from(
    document.querySelectorAll<HTMLElement>('[data-rv-pdf-page="true"]')
  );

  if (pageNodes.length === 0) {
    throw new Error('Resume preview pages are not ready yet.');
  }

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const format = pageSize === 'A4' ? 'a4' : 'letter';
  const pageWidthMm = pageSize === 'A4' ? 210 : 215.9;
  const pageHeightMm = pageSize === 'A4' ? 297 : 279.4;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format,
    compress: true,
  });

  for (let i = 0; i < pageNodes.length; i++) {
    const node = pageNodes[i];
    const width = node.offsetWidth;
    const height = node.offsetHeight;

    const dataUrl = await toPng(node, {
      width,
      height,
      pixelRatio: 2.5,
      backgroundColor: '#ffffff',
      style: {
        boxShadow: 'none',
        borderRadius: '0',
      },
    });

    if (i > 0) {
      pdf.addPage(format, 'portrait');
    }

    pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST');
  }

  pdf.save(`${safeBase}.pdf`);
}

export function triggerPrintPdf(pageSize: PageSize, documentTitle: string): void {
  const prevTitle = document.title;
  const safeTitle = documentTitle.trim() || 'ResumeVix_CV';
  document.title = safeTitle;

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

  setTimeout(() => {
    document.title = prevTitle;
  }, 500);
}
