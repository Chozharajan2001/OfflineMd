'use client';

import { useMemo } from 'react';
import { useMarkdownStore } from '../store';
import { extractToc } from '../../src/export/utils/toc';

export { extractToc };
export type { TocEntry } from '../../src/export/utils/toc';

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
