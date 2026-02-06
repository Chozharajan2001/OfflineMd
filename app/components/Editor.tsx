'use client';

import React from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useMarkdownStore } from '../store';

export function Editor() {
    const { markdown, setMarkdown, theme } = useMarkdownStore();

    return (
        <div className="h-full w-full">
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
