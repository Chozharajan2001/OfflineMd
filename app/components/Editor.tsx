'use client';

import React, { useState, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useMarkdownStore } from '../store';

export function Editor() {
    const { markdown, setMarkdown, theme } = useMarkdownStore();
    const [isClient, setIsClient] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    // Debounced auto-save with visual feedback
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsSaving(true);
            // Simulate save delay for visual feedback
            setTimeout(() => {
                setIsSaving(false);
                setLastSaved(new Date());
            }, 300);
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [markdown]);

    // Show loading state during SSR/hydration
    if (!isClient) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-[var(--editor-bg)]">
                <div className="text-[var(--sidebar-muted)]">Loading editor...</div>
            </div>
        );
    }

    return (
        <div className="h-full w-full relative">
            {/* Auto-save indicator */}
            <div className="absolute top-2 right-4 z-10 text-xs text-[var(--sidebar-muted)] transition-opacity duration-300">
                {isSaving ? (
                    <span className="flex items-center gap-1">
                        <span className="animate-spin h-2 w-2 rounded-full bg-[var(--accent)]"></span>
                        Saving...
                    </span>
                ) : lastSaved ? (
                    <span>Saved {lastSaved.toLocaleTimeString()}</span>
                ) : null}
            </div>
            
            <MonacoEditor
                height="100%"
                language="markdown"
                value={markdown}
                onChange={(value) => setMarkdown(value || '')}
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
            />
        </div>
    );
}
