'use client';

import { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { FileText, Zap } from 'lucide-react';
import { useMarkdownStore } from '../store';
import { db, type FileNode } from '../services/Database';
import { useLiveQuery } from 'dexie-react-hooks';

interface Action {
  id: string;
  label: string;
  hint: string;
  run: () => void;
}

/**
 * Command palette (Ctrl/Cmd+K): fuzzy-ish file jump across projects plus
 * core actions. Files load with project switch; actions reuse the existing
 * window-event contracts and store setters (D.1).
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const {
    setActiveProject,
    setActiveFile,
    setMarkdown,
    resetSaveState,
    setSaved,
    setViewMode,
    toggleScrollSyncEnabled,
  } = useMarkdownStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        const target = e.target;
        if (target instanceof HTMLElement && !!target.closest('.monaco-editor')) {
          // Let Monaco keep its own Ctrl+K chord
          return;
        }
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('open-command-palette', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('open-command-palette', onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) setQuery('');
  }, [open ]);

  const files = useLiveQuery(() => db.nodes.filter((n) => n.type === 'file' && !n.deletedAt).toArray()) || [];
  const projects = useLiveQuery(() => db.projects.toArray()) || [];
  const projectName = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of projects) if (typeof p.id === 'number') map.set(p.id, p.name);
    return map;
  }, [projects]);

  const q = query.trim().toLowerCase();
  const matchedFiles = useMemo(() => {
    const scored = files.map((f) => {
      const name = f.name.toLowerCase();
      const idx = q ? name.indexOf(q) : 0;
      const contentHit =
        q && !name.includes(q) && typeof f.content === 'string' && f.content.toLowerCase().includes(q);
      return { f, idx: idx === -1 ? Number.MAX_SAFE_INTEGER : idx, contentHit: !!contentHit, nameHit: idx !== -1 };
    }).filter((s) => !q || s.nameHit || s.contentHit);
    scored.sort((a, b) => a.idx - b.idx);
    return scored.slice(0, 30);
  }, [files, q]);

  const openFile = async (node: FileNode) => {
    if (typeof node.id !== 'number') return;
    if (node.projectId) setActiveProject(node.projectId);
    const fresh = await db.nodes.get(node.id);
    if (!fresh || fresh.type !== 'file' || fresh.deletedAt) return;
    resetSaveState();
    setActiveFile(node.id);
    setMarkdown(fresh.content || '');
    setSaved(
      (fresh.updatedAt instanceof Date ? fresh.updatedAt : new Date(fresh.updatedAt)).toISOString()
    );
    setOpen(false);
  };

  const actions: Action[] = useMemo(() => [
    { id: 'new-file', label: 'New file', hint: 'action', run: () => window.dispatchEvent(new CustomEvent('open-new-file-dialog')) },
    { id: 'new-project', label: 'New project', hint: 'action', run: () => window.dispatchEvent(new CustomEvent('open-new-project-dialog')) },
    { id: 'view-editor', label: 'View: editor only', hint: 'action', run: () => setViewMode('editor') },
    { id: 'view-split', label: 'View: split', hint: 'action', run: () => setViewMode('split') },
    { id: 'view-preview', label: 'View: preview only', hint: 'action', run: () => setViewMode('preview') },
    { id: 'sync', label: 'Toggle scroll sync', hint: 'action', run: () => toggleScrollSyncEnabled() },
    { id: 'sidebar', label: 'Toggle sidebar', hint: 'action', run: () => window.dispatchEvent(new CustomEvent('toggle-sidebar')) },
    { id: 'history', label: 'File history', hint: 'action', run: () => window.dispatchEvent(new CustomEvent('open-history-dialog')) },
    { id: 'export', label: 'Export…', hint: 'action', run: () => window.dispatchEvent(new CustomEvent('open-export-dialog')) },
  ], [setViewMode, toggleScrollSyncEnabled]);

  const matchedActions = q
    ? actions.filter((a) => a.label.toLowerCase().includes(q))
    : actions;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[130]" />
        <Dialog.Content
          aria-describedby="palette-description"
          className="fixed top-[12vh] left-1/2 w-[560px] max-w-[92vw] -translate-x-1/2 rounded-lg border border-[var(--dialog-border)] bg-[var(--dialog-bg)] text-[var(--dialog-fg)] shadow-xl z-[140] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] overflow-hidden"
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Dialog.Description id="palette-description" className="sr-only">
            Jump to files and run actions. Type to filter, Enter opens the first result.
          </Dialog.Description>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const firstFile = matchedFiles[0];
                if (firstFile) void openFile(firstFile.f);
                else if (matchedActions[0]) {
                  matchedActions[0].run();
                  setOpen(false);
                }
              }
            }}
            placeholder="Type a file name or action… (Esc to close)"
            aria-label="Command palette"
            className="w-full bg-transparent px-4 py-3 text-[var(--dialog-fg)] outline-none border-b border-[var(--dialog-border)] placeholder:text-[var(--sidebar-muted)]"
          />
          <div className="max-h-[50vh] overflow-auto p-2" role="region" aria-label="Results" tabIndex={0}>
            {matchedActions.length > 0 && (
              <div role="group" aria-label="Actions" className="mb-1">
                {matchedActions.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      a.run();
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded px-3 min-h-[40px] text-left text-sm hover:bg-[var(--dropdown-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    <Zap size={14} className="text-[var(--sidebar-icon)] shrink-0" aria-hidden="true" />
                    <span className="flex-1">{a.label}</span>
                  </button>
                ))}
              </div>
            )}
            {matchedFiles.length > 0 && (
              <div role="group" aria-label="Files">
                {q && matchedActions.length > 0 && (
                  <div className="px-3 py-1 text-xs uppercase tracking-wider text-[var(--sidebar-muted)]">Files</div>
                )}
                {matchedFiles.map(({ f, contentHit }) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => void openFile(f)}
                    className="flex w-full items-center gap-2 rounded px-3 min-h-[40px] text-left text-sm hover:bg-[var(--dropdown-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    <FileText size={14} className="text-[var(--sidebar-icon)] shrink-0" aria-hidden="true" />
                    <span className="flex-1 truncate">
                      {f.name}
                      {contentHit && <span className="text-xs text-[var(--sidebar-muted)]"> · content match</span>}
                    </span>
                    <span className="text-xs text-[var(--sidebar-muted)] truncate max-w-[40%]">
                      {projectName.get(f.projectId) ?? ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {matchedActions.length === 0 && matchedFiles.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-[var(--sidebar-muted)]">No matches</div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
