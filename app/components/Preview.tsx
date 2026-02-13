'use client';

import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { useMarkdownStore } from '../store';
import { markdownParser } from '../services/MarkdownParser';

// Generic debounce that preserves argument types
function debounce<A extends unknown[], R>(func: (...args: A) => R, delay: number): (...args: A) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: A) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
}

export function Preview() {
    const { markdown, theme } = useMarkdownStore();
    const [renderedHtml, setRenderedHtml] = useState('');
    const [isClient, setIsClient] = useState(false);

    // Detect client-side rendering after mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsClient(true);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    // Initialize mermaid when theme changes and after client detection
    useEffect(() => {
        if (!isClient) return;
        mermaid.initialize({
            startOnLoad: false,
            theme: theme.preview.background === '#ffffff' ? 'default' : 'dark',
            securityLevel: 'loose',
        });
    }, [isClient, theme]);

    // Debounced markdown parsing
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

    // Re-run mermaid diagrams after HTML updates
    useEffect(() => {
        if (!isClient) return;
        const timer = setTimeout(() => {
            const mermaidNodes = document.querySelectorAll('.language-mermaid');
            if (mermaidNodes.length > 0) {
                mermaid
                    .run({ nodes: Array.from(mermaidNodes) as HTMLElement[] })
                    .catch((err) => console.debug('Mermaid rendering validation:', err));
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [renderedHtml, isClient]);

    // Inline styles for rich typography
    const proseStyles = `
        .preview-content h1 { font-size: 2.25em; font-weight: 700; margin-top: 0; margin-bottom: 0.8em; line-height: 1.2; color: ${theme.ui.accent}; }
        .preview-content h2 { font-size: 1.75em; font-weight: 600; margin-top: 1.6em; margin-bottom: 0.6em; line-height: 1.3; }
        .preview-content h3 { font-size: 1.5em; font-weight: 600; margin-top: 1.4em; margin-bottom: 0.6em; line-height: 1.4; }
        .preview-content h4 { font-size: 1.25em; font-weight: 600; margin-top: 1.2em; margin-bottom: 0.5em; line-height: 1.5; }
        .preview-content h5 { font-size: 1.1em; font-weight: 600; margin-top: 1em; margin-bottom: 0.4em; line-height: 1.5; }
        .preview-content h6 { font-size: 1em; font-weight: 600; margin-top: 1em; margin-bottom: 0.4em; line-height: 1.5; color: ${theme.ui.foreground}80; }

        .preview-content p { margin-top: 0; margin-bottom: 1.25em; line-height: 1.75; }

        .preview-content a { color: ${theme.ui.accent}; text-decoration: underline; text-underline-offset: 2px; }
        .preview-content a:hover { text-decoration: none; }

        .preview-content strong { font-weight: 600; color: ${theme.ui.accent}; }
        .preview-content em { font-style: italic; }

        .preview-content ul, .preview-content ol { margin-top: 0; margin-bottom: 1.25em; padding-left: 2em; }
        .preview-content li { margin-top: 0.5em; margin-bottom: 0.5em; line-height: 1.75; }
        .preview-content ul li::marker { color: ${theme.ui.accent}; }
        .preview-content ol li::marker { color: ${theme.ui.accent}; font-weight: 500; }

        .preview-content ul ul, .preview-content ol ol,
        .preview-content ul ol, .preview-content ol ul { margin-top: 0.5em; margin-bottom: 0.5em; }

        .preview-content blockquote {
            border-left: 4px solid ${theme.ui.accent};
            padding-left: 1em;
            margin-top: 1.5em; margin-bottom: 1.5em;
            font-style: italic;
            background: ${theme.ui.background}10;
            padding: 1em;
            border-radius: 0 4px 4px 0;
        }
        .preview-content blockquote p { margin-bottom: 0; }

        .preview-content hr {
            border: none;
            border-top: 2px solid ${theme.ui.border};
            margin-top: 2em; margin-bottom: 2em;
        }

        .preview-content code {
            font-family: ${theme.editor.fontFamily};
            font-size: 0.9em;
            background: ${theme.ui.background}40;
            padding: 0.2em 0.4em;
            border-radius: 4px;
            color: ${theme.ui.accent};
        }

        .preview-content pre {
            font-family: ${theme.editor.fontFamily};
            background: ${theme.editor.background};
            color: ${theme.editor.foreground};
            padding: 1.25em;
            margin-top: 1.5em; margin-bottom: 1.5em;
            border-radius: 8px;
            overflow-x: auto;
            border: 1px solid ${theme.ui.border};
        }
        .preview-content pre code {
            background: transparent;
            padding: 0;
            border-radius: 0;
            color: inherit;
            font-size: inherit;
        }

        .preview-content table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1.5em;
            margin-bottom: 1.5em;
            overflow-x: auto;
            display: block;
        }
        .preview-content th, .preview-content td {
            padding: 0.75em 1em;
            text-align: left;
            border: 1px solid ${theme.ui.border};
        }
        .preview-content th {
            font-weight: 600;
            background: ${theme.ui.background}40;
            position: sticky;
            top: 0;
        }
        .preview-content tr:nth-child(even) { background: ${theme.ui.background}20; }
        .preview-content tr:hover { background: ${theme.ui.background}40; }

        .preview-content img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 1.5em 0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .preview-content details {
            margin-top: 1em;
            margin-bottom: 1em;
            padding: 0.5em;
            border: 1px solid ${theme.ui.border};
            border-radius: 4px;
            background: ${theme.ui.background}20;
        }
        .preview-content summary {
            cursor: pointer;
            font-weight: 600;
            padding: 0.5em;
        }
        .preview-content details[open] summary {
            margin-bottom: 0.5em;
        }

        .preview-content mark {
            background: ${theme.ui.accent}30;
            padding: 0.1em 0.2em;
            border-radius: 2px;
        }

        .preview-content del {
            text-decoration: line-through;
            opacity: 0.7;
        }

        .preview-content sup, .preview-content sub {
            font-size: 0.75em;
            line-height: 0;
            position: relative;
            vertical-align: baseline;
        }
        .preview-content sup { top: -0.5em; }
        .preview-content sub { bottom: -0.25em; }

        /* Highlight.js theme overrides for dark/light mode */
        .preview-content .hljs {
            background: ${theme.editor.background};
            color: ${theme.editor.foreground};
            padding: 0;
        }

        /* Mermaid diagram styling */
        .preview-content .language-mermaid {
            text-align: center;
            padding: 1em;
            margin: 1.5em 0;
        }
    `;

    // Loading placeholder during SSR/hydration
    if (!isClient) {
        return (
            <div
                className="h-full w-full overflow-auto p-8"
                style={{
                    backgroundColor: theme.preview.background,
                    color: theme.preview.foreground,
                    fontFamily: theme.preview.fontFamily,
                    fontSize: `${theme.preview.fontSize}px`,
                }}
            >
                <div className="text-center py-20 opacity-50">Loading preview...</div>
            </div>
        );
    }

    // Render parsed markdown with rich inline styles
    return (
        <div
            className="h-full w-full overflow-auto p-8"
            style={{
                backgroundColor: theme.preview.background,
                color: theme.preview.foreground,
                fontFamily: theme.preview.fontFamily,
                fontSize: `${theme.preview.fontSize}px`,
            }}
        >
            <style>{proseStyles}</style>
            <div
                className="preview-content"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
        </div>
    );
}
