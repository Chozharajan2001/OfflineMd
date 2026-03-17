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
        
        // UI Colors (Sidebar, Topbar, Backgrounds)
        root.style.setProperty('--background', theme.ui.background);
        root.style.setProperty('--foreground', theme.ui.foreground);
        root.style.setProperty('--border', theme.ui.border);
        root.style.setProperty('--accent', theme.ui.accent);
        
        // Header Specific
        root.style.setProperty('--header-bg', theme.ui.background);
        root.style.setProperty('--header-fg', theme.ui.foreground);
        root.style.setProperty('--header-border', theme.ui.border);
        root.style.setProperty('--header-hover', 'rgba(255,255,255,0.1)');
        
        // Sidebar Specific
        root.style.setProperty('--sidebar-bg', theme.ui.background);
        root.style.setProperty('--sidebar-fg', theme.ui.foreground);
        root.style.setProperty('--sidebar-border', theme.ui.border);
        root.style.setProperty('--sidebar-muted', '#6b7280');
        root.style.setProperty('--sidebar-icon', '#9ca3af');
        root.style.setProperty('--sidebar-input-bg', theme.ui.border);
        root.style.setProperty('--sidebar-hover', 'rgba(255,255,255,0.05)');
        
        // Dropdown/Dialog Specific
        root.style.setProperty('--dropdown-bg', theme.ui.background);
        root.style.setProperty('--dropdown-fg', theme.ui.foreground);
        root.style.setProperty('--dropdown-border', theme.ui.border);
        root.style.setProperty('--dropdown-hover', 'rgba(255,255,255,0.1)');
        
        root.style.setProperty('--dialog-bg', theme.ui.background);
        root.style.setProperty('--dialog-fg', theme.ui.foreground);
        root.style.setProperty('--dialog-border', theme.ui.border);
        
        root.style.setProperty('--input-bg', theme.ui.border);
        root.style.setProperty('--input-fg', theme.ui.foreground);
        root.style.setProperty('--input-border', theme.ui.border);
        
        root.style.setProperty('--button-primary-bg', theme.ui.accent);
        root.style.setProperty('--button-primary-hover', theme.ui.accent + 'cc');
        root.style.setProperty('--button-secondary-bg', 'rgba(255,255,255,0.1)');
        root.style.setProperty('--button-secondary-hover', 'rgba(255,255,255,0.2)');
        root.style.setProperty('--button-fg', theme.ui.foreground);
        
        // Editor Specific (for containers outside monaco)
        root.style.setProperty('--editor-bg', theme.editor.background);
        root.style.setProperty('--preview-bg', theme.preview.background);
        
        // Add a smooth transition for theme variable changes (150ms)
        root.style.transition = 'background-color 150ms ease, color 150ms ease, border-color 150ms ease';
    }, [theme, isMounted]);

    // Helper function to calculate relative luminance
    const getLuminance = (hex: string): number => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return 0;
        
        const [r, g, b] = [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
        
        // Convert to sRGB
        const toSRGB = (c: number) => {
            c /= 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        };
        
        return 0.2126 * toSRGB(r) + 0.7152 * toSRGB(g) + 0.0722 * toSRGB(b);
    };

    // 2. Sync Monaco Theme
    useEffect(() => {
        if (!isMounted || !monaco) return;

        // Calculate luminance to determine if theme is dark
        const luminance = getLuminance(theme.ui.background);
        const isDark = luminance < 0.5; // Threshold: 0.5 (midpoint)

        monaco.editor.defineTheme('custom-theme', {
            base: isDark ? 'vs-dark' : 'vs', // Proper luminance-based detection
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
        return <div className="h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] overflow-hidden"></div>;
    }

    return <>{children}</>;
}
