import { PageSize } from '@/types';

/**
 * Collects all accessible CSS rules from document.styleSheets as inline <style>
 * blocks (avoiding HTTP fetches for /_next/static/css/* inside headless Chromium),
 * while preserving cross-origin <link rel="stylesheet"> tags (e.g. Google Fonts).
 */
function collectInlineAndExternalStyles(): string {
  const blocks: string[] = [];
  const seenHrefs = new Set<string>();

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = Array.from(sheet.cssRules);
      const cssText = rules.map((r) => r.cssText).join('\n');
      if (cssText.trim()) {
        blocks.push(`<style>${cssText}</style>`);
      }
    } catch {
      if (sheet.href && !seenHrefs.has(sheet.href)) {
        seenHrefs.add(sheet.href);
        blocks.push(`<link rel="stylesheet" href="${sheet.href}" />`);
      }
    }
  }

  for (const node of Array.from(
    document.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
  )) {
    if (node.href && !seenHrefs.has(node.href) && !node.href.includes('/_next/static/')) {
      seenHrefs.add(node.href);
      blocks.push(`<link rel="stylesheet" href="${node.href}" />`);
    }
  }

  return blocks.join('\n');
}

/**
 * Generates and directly downloads a true vector, selectable-text PDF via
 * headless Chromium (/api/export/pdf) using the exact paginated paper sheets
 * shown in the web preview so page count and breaks match 1:1.
 */
export async function downloadResumePdf(
  pageSize: PageSize,
  documentTitle: string,
  _margins?: { xMm?: number; yMm?: number }
): Promise<void> {
  const safeBase = (documentTitle.trim() || 'ResumeVix_CV')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_');

  const pageNodes = Array.from(
    document.querySelectorAll<HTMLElement>('[data-rv-pdf-page="true"]')
  );
  if (pageNodes.length === 0) {
    throw new Error('Resume preview is not ready yet.');
  }

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const pageSizeCss = pageSize === 'A4' ? 'A4 portrait' : 'letter portrait';
  const pageWidthMm = pageSize === 'A4' ? '210mm' : '215.9mm';
  // 0.2mm safety trim avoids subpixel rounding spilling a blank extra page in Chromium
  const pageHeightMm = pageSize === 'A4' ? '296.8mm' : '279.2mm';
  const stylesHtml = collectInlineAndExternalStyles();

  const pagesHtml = pageNodes
    .map((node) => {
      const clone = node.cloneNode(true) as HTMLElement;
      clone.classList.add('rv-pdf-page-sheet');
      return clone.outerHTML;
    })
    .join('\n');

  const pdfRules = `
    <style>
      @page {
        size: ${pageSizeCss};
        margin: 0;
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
      .rv-pdf-root a {
        color: inherit;
        text-decoration: none;
      }
      .rv-pdf-root svg {
        display: inline-block;
        vertical-align: middle;
      }
      .rv-pdf-page-sheet {
        width: ${pageWidthMm} !important;
        height: ${pageHeightMm} !important;
        margin: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        overflow: hidden !important;
        break-after: page;
        page-break-after: always;
      }
      .rv-pdf-page-sheet:last-child {
        break-after: auto;
        page-break-after: auto;
      }
    </style>
  `;

  const fullHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    ${stylesHtml}
    ${pdfRules}
  </head>
  <body class="rv-pdf-root bg-white">
    ${pagesHtml}
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
