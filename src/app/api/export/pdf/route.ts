import fs from 'node:fs';
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';

export const runtime = 'nodejs';

function resolveBrowserExecutable(): string | undefined {
  const candidates = [
    process.env.CHROME_EXECUTABLE_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter((p): p is string => Boolean(p));

  return candidates.find((p) => fs.existsSync(p));
}

export async function POST(req: NextRequest) {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
  try {
    const body = (await req.json()) as {
      html?: string;
      pageSize?: 'A4' | 'LETTER';
      title?: string;
    };

    const html = body.html;
    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'Missing HTML payload' }, { status: 400 });
    }

    const executablePath = resolveBrowserExecutable();
    if (!executablePath) {
      return NextResponse.json(
        { error: 'No Chromium/Chrome/Edge executable found on server.' },
        { status: 500 }
      );
    }

    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=none',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 1 });
    await page.emulateMediaType('screen');

    await page.setContent(html, { waitUntil: 'load', timeout: 12000 });

    await page.evaluate(async () => {
      // Wait up to 3s for any external font stylesheets (e.g. Google Fonts)
      const links = Array.from(
        document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
      );
      await Promise.race([
        Promise.all(
          links.map(
            (link) =>
              new Promise<void>((resolve) => {
                if (link.sheet) return resolve();
                link.addEventListener('load', () => resolve(), { once: true });
                link.addEventListener('error', () => resolve(), { once: true });
              })
          )
        ),
        new Promise<void>((resolve) => setTimeout(resolve, 3000)),
      ]);
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
    });

    const format = body.pageSize === 'LETTER' ? 'Letter' : 'A4';
    const pdfBytes = await page.pdf({
      format,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });

    const safeTitle = (body.title || 'ResumeVix_CV')
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
      .replace(/\s+/g, '_');

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PDF generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
