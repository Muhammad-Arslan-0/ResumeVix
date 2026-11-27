import { PageSize } from '@/types';

/**
 * Generates and directly downloads a true vector, selectable-text PDF via
 * headless Chromium (/api/export/pdf) without opening the browser print dialog.
 */
export async function downloadResumePdf(
  pageSize: PageSize,
  documentTitle: string,
  margins?: { xMm?: number; yMm?: number }
): Promise<void> {
  const safeBase = (documentTitle.trim() || 'ResumeVix_CV')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_');

  const sourceEl = document.querySelector<HTMLElement>('[data-rv-pdf-source="true"]');
  if (!sourceEl) {
    throw new Error('Resume preview is not ready yet.');
  }

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const marginX = margins?.xMm ?? 14;
  const marginY = margins?.yMm ?? 14;
  const pageSizeCss = pageSize === 'A4' ? 'A4 portrait' : 'letter portrait';

  // Collect stylesheets (with absolute URLs) and inline styles from the current document
  const headAssets: string[] = [];
  const headNodes = Array.from(
    document.head.querySelectorAll('link[rel="stylesheet"], style')
  );
  for (const node of headNodes) {
    if (node.tagName === 'LINK') {
      const link = node as HTMLLinkElement;
      if (link.href) {
        headAssets.push(`<link rel="stylesheet" href="${link.href}" />`);
      }
    } else if (node.tagName === 'STYLE') {
      headAssets.push(`<style>${node.textContent || ''}</style>`);
    }
  }

  const pdfRules = `
    <style>
      @page {
        size: ${pageSizeCss};
        margin: ${marginY}mm ${marginX}mm;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        height: auto !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .rv-pdf-root .resume-page {
        width: 100% !important;
        min-height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
      }
      .rv-section-heading {
        break-after: avoid;
        page-break-after: avoid;
      }
      .rv-entry {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      li, p {
        orphans: 2;
        widows: 2;
      }
    </style>
  `;

  const fullHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <base href="${window.location.origin}/" />
    ${headAssets.join('\n')}
    ${pdfRules}
  </head>
  <body class="rv-pdf-root bg-white">
    ${sourceEl.innerHTML}
  </body>
</html>`;

  const res = await fetch('/api/export/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      html: fullHtml,
      pageSize,
      title: safeBase,
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `PDF export failed (${res.status})`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeBase}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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
