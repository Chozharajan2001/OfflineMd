import { describe, expect, it } from 'vitest';
import { ExportOrchestrator } from './export-service';
import type { ExportFormat, ExportInput, ExportOptions, ThemeTokens } from './types';

const theme: ThemeTokens = {
  ui: { background: '#ffffff', foreground: '#111111', border: '#e5e5e5', accent: '#2563eb' },
  editor: { background: '#f5f5f5', foreground: '#111111', fontSize: 14, fontFamily: 'monospace' },
  preview: { background: '#ffffff', foreground: '#111111', fontFamily: 'sans-serif', fontSize: 16 },
};

const options: ExportOptions = {
  includeTheme: true,
  includeTableOfContents: false,
  pageSize: 'A4',
  orientation: 'portrait',
  margins: { top: 10, right: 10, bottom: 10, left: 10 },
  fontSize: 12,
  headerFooter: false,
  embedImages: false,
  syntaxHighlight: false,
};

const FIXTURE = '---\ntitle: Contract <Doc>\n---\n# Hello: World?\n\nSome **bold** text.\n';

function input(markdown: string): ExportInput {
  return { markdown, theme, options, metadata: {}, onProgress: undefined };
}

const CASES: Array<[ExportFormat, string, string]> = [
  ['md', 'text/markdown', '.md'],
  ['txt', 'text/plain', '.txt'],
  ['pdf', 'application/pdf', '.pdf'],
  ['docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
  ['pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', '.pptx'],
];

describe.each(CASES)('ExportOrchestrator %s', (format, mime, ext) => {
  it('returns a complete ExportResult with safe filename', async () => {
    const result = await ExportOrchestrator.export(format, input(FIXTURE));
    expect(result.mimeType).toBe(mime);
    expect(result.filename.endsWith(ext)).toBe(true);
    expect(result.filename).not.toMatch(/[\\/:*?"<>|]/);
    expect(result.blob.size).toBeGreaterThan(0);
    expect(result.size).toBe(result.blob.size);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('strips front matter from the payload', async () => {
    const result = await ExportOrchestrator.export(format, input(FIXTURE));
    const text = await result.blob.text().catch(() => '');
    // Binary formats won't decode to text — only assert for text ones.
    // NOTE: txt uppercases H1 decorations, so match case-insensitively.
    if (format === 'md' || format === 'txt') {
      expect(text).not.toContain('---');
      expect(text.toLowerCase()).toContain('hello');
    }
  }, 30000);

  it('rejects invalid input', async () => {
    await expect(
      ExportOrchestrator.export(format, { ...input('# x'), markdown: '' })
    ).rejects.toThrow();
  });
});
