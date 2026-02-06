'use client';

import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { useMarkdownStore } from '../store';
import { markdownParser } from '../services/MarkdownParser';

// Relaxed typing to compatible with async functions
function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

export function Preview() {
    const { markdown, theme } = useMarkdownStore();
    const [renderedHtml, setRenderedHtml] = useState('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Initialize mermaid on load
    useEffect(() => {
        if (!isClient) return;

        mermaid.initialize({
            startOnLoad: false,
            theme: theme.preview.background === '#ffffff' ? 'default' : 'dark',
            securityLevel: 'loose',
        });
    }, [isClient, theme]); // Run once on mount after client detection

    // Debounce the parsing to avoid lag on every keystroke
    const debouncedParse = useRef(
        debounce(async (md: string) => {
            const html = await markdownParser.parse(md);
            setRenderedHtml(html);
        }, 150)
    );

    useEffect(() => {
        if (!isClient) return;
        debouncedParse.current(markdown);
    }, [markdown, isClient]);

    // Re-run mermaid when HTML changes
    useEffect(() => {
        if (!isClient) return;

        // Only attempt to render if the HTML contains code blocks that look like mermaid
        // Note: remark usually renders code blocks as <pre><code>...</code></pre>
        // We might need to adjust the parser or target specific selectors.
        // For now, let's assume standard mermaid class usage or just try to render all .language-mermaid

        // Check if we have any .language-mermaid elements in the rendered output
        const timer = setTimeout(() => {
            if (typeof document !== 'undefined') {
                const mermaidNodes = document.querySelectorAll('.language-mermaid');
                if (mermaidNodes.length > 0) {
                    mermaid.run({
                        nodes: Array.from(mermaidNodes) as HTMLElement[]
                    }).then(() => {
                        // Remove the 'language-mermaid' class after rendering to prevent double-rendering if we used a broader selector
                    }).catch(err => console.debug("Mermaid rendering validation:", err));
                }
            }
        }, 100); // 100ms delay to ensure DOM is ready

        return () => clearTimeout(timer);
    }, [renderedHtml, isClient]);

    // Show loading state during SSR/hydration
    if (!isClient) {
        return (
            <div
                className="h-full w-full overflow-auto p-8 preview-content prose prose-invert max-w-none"
                style={{
                    backgroundColor: theme.preview.background,
                    color: theme.preview.foreground,
                    fontFamily: theme.preview.fontFamily,
                    fontSize: `${theme.preview.fontSize}px`,
                }}
            >
                <div>Loading preview...</div>
            </div>
        );
    }

    return (
        <div
            className="h-full w-full overflow-auto p-8 preview-content prose prose-invert max-w-none"
            style={{
                backgroundColor: theme.preview.background,
                color: theme.preview.foreground,
                fontFamily: theme.preview.fontFamily,
                fontSize: `${theme.preview.fontSize}px`,
            }}
        >
            <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
        </div>
    );
}
