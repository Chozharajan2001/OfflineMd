import { describe, expect, it } from 'vitest';
import { extractToc } from './toc';
import { getFrontMatter } from './front-matter';

describe('extractToc', () => {
  it('extracts H1-H3 with github-style slugs', () => {
    const entries = extractToc('# Hello World\n\n## Try it\n\n### Deep dive\n');
    expect(entries).toEqual([
      { level: 1, text: 'Hello World', id: 'hello-world' },
      { level: 2, text: 'Try it', id: 'try-it' },
      { level: 3, text: 'Deep dive', id: 'deep-dive' },
    ]);
  });

  it('dedupes repeated headings', () => {
    const entries = extractToc('# A\n# A\n');
    expect(entries.map((e) => e.id)).toEqual(['a', 'a-1']);
  });

  it('ignores fenced code and front matter', () => {
    const entries = extractToc('---\ntitle: x\n---\n```\n# not a heading\n```\n# Real\n');
    expect(entries).toEqual([{ level: 1, text: 'Real', id: 'real' }]);
  });
});

describe('getFrontMatter', () => {
  it('splits data from body', () => {
    const { data, content } = getFrontMatter('---\ntitle: T\nauthor: A\n---\n# Body\n');
    expect(data.title).toBe('T');
    expect(data.author).toBe('A');
    expect(content.trim()).toBe('# Body');
  });

  it('never throws on garbage', () => {
    const { data, content } = getFrontMatter('---\n: : :\n---\nbody');
    expect(content).toContain('body');
    expect(typeof data).toBe('object');
  });

  it('passes through documents without front matter', () => {
    const { data, content } = getFrontMatter('# Plain\n');
    expect(data).toEqual({});
    expect(content).toBe('# Plain\n');
  });
});
