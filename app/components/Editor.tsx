'use client';

import React, { useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useMarkdownStore } from '../store';

export function Editor() {
    const { markdown, setMarkdownFromUser, theme, documentStatus, lastSavedAt, saveError } = useMarkdownStore();
    const [isClient, setIsClient] = useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

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

    // Determine status message
    let statusMessage: React.ReactNode = null;
    if (documentStatus === 'saving') {
        statusMessage = (
            <span className="flex items-center gap-1">
                <span className="animate-spin h-2 w-2 rounded-full bg-[var(--accent)]"></span>
                Saving...
            </span>
        );
    } else if (documentStatus === 'saved') {
        statusMessage = <span>Saved {formatSavedTime(lastSavedAt)}</span>;
    } else if (documentStatus === 'error') {
        statusMessage = <span className="text-red-500">{saveError || 'Save failed'}</span>;
    } else if (documentStatus === 'dirty') {
        statusMessage = <span>Unsaved changes</span>;
    }

    return (
        <div className="h-full w-full relative">
            {/* Save status indicator (visible + live region) */}
            {statusMessage && (
                <div
                    className="absolute top-2 right-4 z-10 text-xs text-[var(--sidebar-muted)] transition-opacity duration-300"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {statusMessage}
                </div>
            )}

            <MonacoEditor
                height="100%"
                language="markdown"
                value={markdown}
                onChange={(value) => setMarkdownFromUser(value || '')}
                theme="vs-dark"
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
    );
}
