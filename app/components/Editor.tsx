'use client';

import React, { useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useMarkdownStore } from '../store';

export function Editor() {
    const { markdown, setMarkdown, theme } = useMarkdownStore();
    const [isClient, setIsClient] = useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    // Show loading state during SSR/hydration
    if (!isClient) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-gray-900">
                <div className="text-gray-500">Loading editor...</div>
            </div>
        );
    }

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
