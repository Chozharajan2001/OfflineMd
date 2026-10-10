import { describe, expect, it } from 'vitest';
import { extractTitle, safeFilename } from './safe-filename';

describe('safeFilename', () => {
  it('strips Windows-invalid chars and lowercases', () => {
    expect(safeFilename('My Doc: v2/Final?')).toBe('my-doc_-v2_final_');
  });

  it('falls back for empty input', () => {
    expect(safeFilename('')).toBe('document');
    expect(safeFilename(undefined)).toBe('document');
  });

  it('caps at 50 chars', () => {
    expect(safeFilename('a'.repeat(100)).length).toBeLessThanOrEqual(50);
  });
});

describe('extractTitle', () => {
  it('prefers explicit metadata', () => {
    expect(extractTitle('# Body', 'Meta Title')).toBe('Meta Title');
  });

  it('prefers front-matter title over H1', () => {
    expect(extractTitle('---\ntitle: FM Title\n---\n# H1 Title')).toBe('FM Title');
  });

  it('falls back to first H1 skipping front matter', () => {
    expect(extractTitle('---\nauthor: A\n---\n# Hello')).toBe('Hello');
  });

  it('falls back to document', () => {
    expect(extractTitle('no headings here')).toBe('document');
  });
});
