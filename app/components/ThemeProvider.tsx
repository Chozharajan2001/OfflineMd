'use client';

import { useEffect, useState } from 'react';
import { useMarkdownStore } from '../store';
import { useMonaco } from '@monaco-editor/react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { theme } = useMarkdownStore();
    const monaco = useMonaco();
    const [isMounted, setIsMounted] = useState(false);

    // Ensure we only run effects after component mounts to avoid SSR issues
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 1. Sync CSS Variables for Tailwind/UI
    useEffect(() => {
        if (!isMounted) return;

        const root = document.documentElement;
        root.style.setProperty('--background', theme.ui.background);
        root.style.setProperty('--foreground', theme.ui.foreground);
        root.style.setProperty('--border', theme.ui.border);
        root.style.setProperty('--accent', theme.ui.accent);
        // Editor specifics (for containers outside monaco)
        root.style.setProperty('--editor-bg', theme.editor.background);
        root.style.setProperty('--preview-bg', theme.preview.background);

        // Add a smooth transition for theme variable changes (150ms)
        root.style.transition = 'background-color 150ms ease, color 150ms ease, border-color 150ms ease';
    }, [theme, isMounted]);

    // 2. Sync Monaco Theme
    useEffect(() => {
        if (!isMounted || !monaco) return;

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
    }, [theme, monaco, isMounted]);

    // Don't render children until mounted to prevent hydration mismatches
    if (!isMounted) {
        return <div className="h-screen flex flex-col bg-gray-900 text-gray-100 overflow-hidden"></div>;
    }

    return <>{children}</>;
}
