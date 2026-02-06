'use client';

import { useEffect } from 'react';
import { useMarkdownStore } from '../store';
import { useMonaco } from '@monaco-editor/react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { theme } = useMarkdownStore();
    const monaco = useMonaco();

    // 1. Sync CSS Variables for Tailwind/UI
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--background', theme.ui.background);
        root.style.setProperty('--foreground', theme.ui.foreground);
        root.style.setProperty('--border', theme.ui.border);
        root.style.setProperty('--accent', theme.ui.accent);
        // Editor specifics (for containers outside monaco)
        root.style.setProperty('--editor-bg', theme.editor.background);
        root.style.setProperty('--preview-bg', theme.preview.background);
    }, [theme]);

    // 2. Sync Monaco Theme
    useEffect(() => {
        if (monaco) {
            monaco.editor.defineTheme('custom-theme', {
                base: theme.ui.background === '#ffffff' ? 'vs' : 'vs-dark', // Crude detection, improve later
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': theme.editor.background,
                    'editor.foreground': theme.editor.foreground,
                },
            });
            monaco.editor.setTheme('custom-theme');
        }
    }, [theme, monaco]);

    return <>{children}</>;
}
