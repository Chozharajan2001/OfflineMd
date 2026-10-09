'use client';

import { useMemo } from 'react';
import { useMarkdownStore } from '../store';

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
  // Strip fenced code so `# comment` lines inside code don't become entries
  const stripped = markdown.replace(/```[\s\S]*?```/g, '').replace(/~~~[\s\S]*?~~~/g, '');
  for (const line of stripped.split('\n')) {
    const m = line.match(/^(#{1,3})\s+(.+)$/);
    if (!m) continue;
    const text = m[2].replace(/\s+#+\s*$/, '').trim();
    if (!text) continue;
    entries.push({ level: m[1].length as 1 | 2 | 3, text, id: slugifyHeading(text, seen) });
  }
  return entries;
}

export function TableOfContents() {
  const markdown = useMarkdownStore((s) => s.markdown);
  const entries = useMemo(() => extractToc(markdown), [markdown]);

  return (
    <div className="p-3 border-t border-[var(--sidebar-border)]" role="group" aria-label="Table of contents">
      <h2 className="text-xs font-bold text-[var(--sidebar-muted)] uppercase tracking-wider mb-2">
        Contents{entries.length > 0 ? ` (${entries.length})` : ''}
      </h2>
      {entries.length === 0 ? (
        <div className="text-[var(--sidebar-muted)] text-xs italic">No headings</div>
      ) : (
        <nav aria-label="Document sections">
          <ul className="space-y-0.5 max-h-48 overflow-auto" role="region" aria-label="Headings" tabIndex={0}>
            {entries.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('toc-navigate', { detail: { id: e.id } }))}
                  title={e.text}
                  aria-label={`Go to ${e.text}`}
                  className="w-full text-left truncate text-xs text-[var(--sidebar-muted)] hover:text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-hover)] rounded px-1.5 py-1 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  style={{ paddingLeft: `${0.375 + (e.level - 1) * 0.75}rem` }}
                >
                  {e.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
