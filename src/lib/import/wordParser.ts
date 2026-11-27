import { AIConfig, ResumeData } from '@/types';
import { parseExtractedResumeText } from './pdfParser';

/**
 * Extracts text and hyperlinks from a Word (.docx) file using mammoth
 * and parses it into structured ResumeData.
 */
export async function parseWordToResumeData(
  file: File,
  aiConfig: AIConfig
): Promise<{ data: ResumeData; usedAI: boolean }> {
  if (file.name.toLowerCase().endsWith('.doc')) {
    throw new Error(
      'Legacy .doc format is not supported in browser. Please save as .docx or PDF first.'
    );
  }

  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();

  const [rawResult, htmlResult] = await Promise.all([
    mammoth.extractRawText({ arrayBuffer }),
    mammoth.convertToHtml({ arrayBuffer }).catch(() => ({ value: '' })),
  ]);

  const rawText = rawResult.value?.trim() || '';
  if (!rawText || rawText.length < 20) {
    throw new Error('Could not extract readable text from this Word document.');
  }

  // Extract any embedded hyperlinks from the HTML conversion
  const linkSet = new Set<string>();
  const hrefRegex = /href="([^"]+)"/gi;
  let match: RegExpExecArray | null;
  while ((match = hrefRegex.exec(htmlResult.value || '')) !== null) {
    const href = match[1]?.trim();
    if (href && !href.startsWith('#')) {
      linkSet.add(href);
    }
  }

  return parseExtractedResumeText(rawText, Array.from(linkSet), aiConfig);
}
