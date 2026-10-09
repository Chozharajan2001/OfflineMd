import { getFrontMatter } from './front-matter';

export interface TocEntry {
  level: 1 | 2 | 3;
  text: string;
  id: string;
}

/** Mirror of github-slugger (what rehype-slug uses) for the levels we list. */
export function slugifyHeading(text: string, seen: Map<string, number>): string {
  const base =
    text
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-') || 'section';
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

export function extractToc(markdown: string): TocEntry[] {
  const seen = new Map<string, number>();
  const entries: TocEntry[] = [];
  // Front matter and fenced code must not contribute headings
  const { content } = getFrontMatter(markdown);
  const stripped = content.replace(/```[\s\S]*?```/g, '').replace(/~~~[\s\S]*?~~~/g, '');
  for (const line of stripped.split('\n')) {
    const m = line.match(/^(#{1,3})\s+(.+)$/);
    if (!m) continue;
    const text = m[2].replace(/\s+#+\s*$/, '').trim();
    if (!text) continue;
    entries.push({ level: m[1].length as 1 | 2 | 3, text, id: slugifyHeading(text, seen) });
  }
  return entries;
}
