'use client';

import { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/Database';
import { useMarkdownStore } from '../store';
import { Button } from './ui';
import { diffLines } from '../utils/history';
import { useToast } from './notifications/useToast';

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: number | null;
}

/**
 * Version history (D.2): snapshot list with line-diff against the current
 * document and one-click restore. Snapshots are captured on save/autosave.
 */
export function HistoryDialog({ open, onOpenChange, fileId }: HistoryDialogProps) {
  const toast = useToast();
  const markdown = useMarkdownStore((s) => s.markdown);
  const revisions =
    useLiveQuery(
      () => (fileId ? db.revisions.where('fileId').equals(fileId).sortBy('createdAt') : []),
      [fileId, open]
    ) || [];
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const ordered = useMemo(() => [...revisions].reverse(), [revisions]);
  const selected = ordered.find((r) => r.id === selectedId) ?? ordered[0] ?? null;
  const diff = useMemo(
    () => (selected ? diffLines(selected.content, markdown) : []),
    [selected, markdown]
  );
  const visibleDiff = useMemo(() => {
    // Collapse long unchanged runs to keep the view scannable
    const out: typeof diff = [];
    let hidden = 0;
    const flush = () => {
      if (hidden > 0) {
        out.push({ kind: 'same', text: `… ${hidden} unchanged lines …` });
        hidden = 0;
      }
    };
    for (const line of diff) {
      if (line.kind === 'same' && diff.length > 40) hidden++;
      else {
        flush();
        out.push(line);
      }
    }
    flush();
    return out;
  }, [diff]);

  const restore = async () => {
    if (!fileId || !selected) return;
    try {
      await db.nodes.update(fileId, { content: selected.content, updatedAt: new Date() });
      const s = useMarkdownStore.getState();
      s.setMarkdown(selected.content);
      s.markDirty();
      toast.success('Version restored (unsaved — press Save to keep it)');
      onOpenChange(false);
    } catch {
      toast.error('Restore failed');
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[130]" />
        <Dialog.Content
          aria-describedby="history-description"
          className="fixed top-1/2 left-1/2 w-[640px] max-w-[94vw] max-h-[85vh] overflow-hidden flex flex-col -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--dialog-border)] bg-[var(--dialog-bg)] text-[var(--dialog-fg)] shadow-xl z-[140] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          <div className="p-4 pb-2">
            <Dialog.Title className="text-base font-semibold">Version history</Dialog.Title>
            <Dialog.Description id="history-description" className="mt-1 text-sm text-[var(--sidebar-muted)]">
              Snapshots are captured on save. Select a version to diff against the current document.
            </Dialog.Description>
          </div>
          {ordered.length === 0 ? (
            <p className="p-4 text-sm text-[var(--sidebar-muted)]">No versions yet — save the file to capture one.</p>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
              <div className="sm:w-48 shrink-0 border-b sm:border-b-0 sm:border-r border-[var(--dialog-border)] overflow-auto p-2" role="listbox" aria-label="Versions">
                {ordered.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    role="option"
                    aria-selected={selected?.id === r.id}
                    onClick={() => setSelectedId(r.id as number)}
                    className={`block w-full rounded px-2 py-1.5 text-left text-xs min-h-[36px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${selected?.id === r.id ? 'bg-[var(--sidebar-hover)] font-medium' : 'hover:bg-[var(--sidebar-hover)]'}`}
                  >
                    {r.createdAt instanceof Date ? r.createdAt.toLocaleString() : new Date(r.createdAt).toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="min-h-0 flex-1 overflow-auto p-3 font-mono text-xs" role="region" aria-label="Diff" tabIndex={0}>
                {visibleDiff.map((line, idx) => (
                  <div
                    key={idx}
                    className={
                      line.kind === 'add'
                        ? 'bg-green-500/10 text-green-700 dark:text-green-300'
                        : line.kind === 'del'
                          ? 'bg-red-500/10 text-red-700 dark:text-red-300'
                          : 'opacity-60'
                    }
                  >
                    <span aria-hidden="true" className="mr-2 select-none">
                      {line.kind === 'add' ? '+' : line.kind === 'del' ? '−' : ' '}
                    </span>
                    {line.text || ' '}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 p-4 pt-2">
            <Dialog.Close asChild>
              <Button variant="secondary">Close</Button>
            </Dialog.Close>
            <Button variant="primary" onClick={() => void restore()} disabled={!selected}>
              Restore this version
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
