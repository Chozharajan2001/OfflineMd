'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useMarkdownStore } from '../store';
import { db } from '../services/Database';
import { captureRevision } from '../utils/history';

const AUTOSAVE_DELAY_MS = 2500;

export function Editor() {
    const { markdown, setMarkdownFromUser, theme, documentStatus, lastSavedAt, saveError } = useMarkdownStore();
    const [isClient, setIsClient] = useState(false);
    const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    // Autosave: after idle, persist dirty doc to the active file (M2)
    useEffect(() => {
        const state = useMarkdownStore.getState();
        if (!state.activeFileId || state.documentStatus !== 'dirty') return;
        if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        autosaveTimer.current = setTimeout(() => {
            void (async () => {
                const s = useMarkdownStore.getState();
                if (!s.activeFileId || s.documentStatus !== 'dirty') return;
                const currentRevision = s.revision;
                s.setSaving();
                try {
                    await db.nodes.update(s.activeFileId as number, {
                        content: s.markdown,
                        updatedAt: new Date(),
                    });
                    void captureRevision(s.activeFileId as number, s.markdown);
                    if (useMarkdownStore.getState().revision === currentRevision) {
                        s.setSaved();
                    } else {
                        s.markDirty();
                    }
                } catch (error) {
                    s.setSaveError(error instanceof Error ? error.message : 'Autosave failed');
                }
            })();
        }, AUTOSAVE_DELAY_MS);
        return () => {
            if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        };
    }, [markdown, documentStatus]);

    const stats = useMemo(() => {
        const text = markdown.trim();
        const words = text ? text.split(/\s+/).length : 0;
        const chars = markdown.length;
        const minutes = Math.max(1, Math.ceil(words / 200));
        return { words, chars, minutes };
    }, [markdown]);

    // Show loading state during SSR/hydration
    if (!isClient) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-[var(--editor-bg)]">
                <div className="text-[var(--sidebar-muted)]">Loading editor...</div>
            </div>
        );
    }

    // Format lastSavedAt for display
    const formatSavedTime = (iso: string | null) => {
        if (!iso) return '';
        const date = new Date(iso);
        return date.toLocaleTimeString();
    };

    // Single status surface: state first, stats second (3.1 — floating badge removed)
    const statusDot =
        documentStatus === 'saving' ? 'bg-[var(--accent)] animate-pulse'
        : documentStatus === 'saved' ? 'bg-[var(--color-success)]'
        : documentStatus === 'error' ? 'bg-[var(--color-danger)]'
        : documentStatus === 'dirty' ? 'bg-[var(--color-warning)]'
        : 'bg-[var(--sidebar-muted)]';
    const statusText =
        documentStatus === 'saving' ? 'Saving…'
        : documentStatus === 'saved' ? `Saved ${formatSavedTime(lastSavedAt)}`
        : documentStatus === 'error' ? (saveError || 'Save failed')
        : documentStatus === 'dirty' ? 'Unsaved changes'
        : 'Ready';

    return (
        <div className="h-full w-full relative flex flex-col">
            <div className="flex-1 relative min-h-0">
            <MonacoEditor
                height="100%"
                language="markdown"
                value={markdown}
                onChange={(value) => setMarkdownFromUser(value || '')}
                theme="custom-theme"
                options={{
                    minimap: { enabled: false },
                    wordWrap: 'on',
                    automaticLayout: true,
                    fontSize: theme.editor.fontSize,
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                    fontLigatures: true,
                }}
                onMount={(editor) => {
                    editor.onDidScrollChange(() => {
                        if (!useMarkdownStore.getState().scrollSyncEnabled) return;
                        const scrollTop = editor.getScrollTop();
                        const maxScroll = Math.max(1, editor.getScrollHeight() - editor.getLayoutInfo().height);
                        const scrollPercentage = scrollTop / maxScroll;
                        window.dispatchEvent(new CustomEvent('editor-scroll', {
                            detail: { scrollPercentage }
                        }));
                    });
                }}
            />
            </div>
            <div
                className="shrink-0 px-3 py-1.5 text-xs text-[var(--sidebar-muted)] border-t border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] flex gap-3 items-center"
                aria-live="polite"
                aria-label="Document status and statistics"
            >
                <span className="flex items-center gap-1.5 font-medium text-[var(--sidebar-fg)]">
                    <span className={`h-2 w-2 rounded-full ${statusDot}`} aria-hidden="true" />
                    {statusText}
                </span>
                <span aria-hidden="true" className="opacity-40">·</span>
                <span>{stats.words.toLocaleString()} words</span>
                <span>{stats.chars.toLocaleString()} chars</span>
                <span>{stats.minutes} min read</span>
            </div>
        </div>
    );
}
