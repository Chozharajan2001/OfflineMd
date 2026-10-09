'use client';

import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { useMarkdownStore } from '../store';
import { markdownParser } from '../services/MarkdownParser';
import { safeFontFamily, safeHex } from '../../src/export/utils/theme-validation';

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
        const rel = (node.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
        if (!rel.includes('noopener')) rel.push('noopener');
        if (!rel.includes('noreferrer')) rel.push('noreferrer');
        node.setAttribute('rel', rel.join(' '));
    }
});

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
    const previewRef = useRef<HTMLDivElement>(null);

    // Detect client-side rendering after mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsClient(true);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    // Debounced markdown parsing with sanitization
    const parseSeq = useRef(0);
    const debouncedParse = useRef(
        debounce(async (md: string, seq: number) => {
            const html = await markdownParser.parse(md);
            // Additional layer of sanitization with DOMPurify for defense-in-depth
            const safeHtml = DOMPurify.sanitize(html, {
                ALLOWED_TAGS: [
                    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                    'p', 'br', 'hr',
                    'strong', 'b', 'em', 'i', 'del', 's', 'mark',
                    'a', 'img',
                    'ul', 'ol', 'li',
                    'blockquote', 'pre', 'code',
                    'table', 'thead', 'tbody', 'tr', 'th', 'td',
                    'div', 'span', 'details', 'summary',
                    'sup', 'sub',
                    'math', 'semantics', 'annotation', 'mrow', 'mi', 'mo', 'mn',
                    'msup', 'msub', 'msubsup', 'mfrac', 'msqrt', 'mroot', 'mtext',
                    'mspace', 'mover', 'munder', 'munderover', 'mtable', 'mtr', 'mtd'
                ],
                ALLOWED_ATTR: ['className', 'class', 'href', 'src', 'alt', 'title', 'target', 'rel', 'aria-hidden', 'display', 'encoding'],
                FORBID_ATTR: ['style', 'onclick', 'onerror', 'onload']
            });
            if (parseSeq.current !== seq) return;
            setRenderedHtml(safeHtml as string);
        }, 150)
    );

    // Track the latest markdown being parsed to prevent race conditions
    const latestMarkdownRef = useRef<string>('');

    useEffect(() => {
        if (!isClient) return;
        latestMarkdownRef.current = markdown;
        parseSeq.current += 1;

        // Cancel previous parse if new markdown arrives quickly
        debouncedParse.current(markdown, parseSeq.current);

        // Cleanup function to cancel stale parses
        return () => {
            // Optional: Could add abort controller support here for true cancellation
        };
    }, [markdown, isClient]);

    // Re-run mermaid diagrams after HTML updates
    useEffect(() => {
        if (!isClient) return;

        // Sync scrolling - listen to editor scroll events
        const handleEditorScroll: EventListener = (event) => {
            const e = event as CustomEvent<{ scrollPercentage: number }>;
            if (!useMarkdownStore.getState().scrollSyncEnabled) return;
            if (previewRef.current) {
                const scrollHeight = previewRef.current.scrollHeight - previewRef.current.clientHeight;
                previewRef.current.scrollTop = e.detail.scrollPercentage * scrollHeight;
            }
        };

        window.addEventListener('editor-scroll', handleEditorScroll);
        return () => window.removeEventListener('editor-scroll', handleEditorScroll);
    }, [isClient]);

    // Mermaid costs ~1 MB of JavaScript, so load it only when the rendered
    // document actually contains a diagram.
    const hasMermaidDiagram = /language-mermaid/.test(renderedHtml);

    useEffect(() => {
        if (!isClient || !hasMermaidDiagram) return;

        let cancelled = false;

        (async () => {
            const { default: mermaid } = await import('mermaid');
            mermaid.initialize({
                startOnLoad: false,
                theme: theme.preview.background === '#ffffff' ? 'default' : 'dark',
                securityLevel: 'strict',
            });

            // Convert fenced mermaid blocks into mermaid containers for rendering
            // Scoped to this preview only so other page nodes are never hijacked.
            const scope: ParentNode = previewRef.current ?? document;
            scope.querySelectorAll('pre > code.language-mermaid').forEach((codeEl) => {
                const text = codeEl.textContent || '';
                const wrapper = document.createElement('div');
                wrapper.className = 'mermaid';
                wrapper.textContent = text;
                const pre = codeEl.parentElement;
                if (pre && pre.parentElement) {
                    pre.parentElement.replaceChild(wrapper, pre);
                }
            });

            const mermaidNodes = Array.from(scope.querySelectorAll('.mermaid')).filter(
                (n) => previewRef.current?.contains(n as Node)
            ) as HTMLElement[];
            if (!cancelled && mermaidNodes.length > 0) {
                await mermaid.run({ nodes: mermaidNodes }).catch((err) => console.debug('Mermaid rendering validation:', err));
            }
        })().catch((err) => console.debug('Mermaid load failed:', err));

        return () => { cancelled = true; };
    }, [isClient, hasMermaidDiagram, renderedHtml, theme]);

    // Inline styles for rich typography
    const accent = safeHex(theme.ui.accent);
    const border = safeHex(theme.ui.border);
    const uiBg = safeHex(theme.ui.background);
    const uiFg = safeHex(theme.ui.foreground);
    const edBg = safeHex(theme.editor.background);
    const edFg = safeHex(theme.editor.foreground);
    const edFont = safeFontFamily(theme.editor.fontFamily, "'Fira Code', monospace");
    const proseStyles = `
        .preview-content h1 { font-size: 2.25em; font-weight: 700; margin-top: 0; margin-bottom: 0.8em; line-height: 1.2; color: ${accent}; }
        .preview-content h2 { font-size: 1.75em; font-weight: 600; margin-top: 1.6em; margin-bottom: 0.6em; line-height: 1.3; }
        .preview-content h3 { font-size: 1.5em; font-weight: 600; margin-top: 1.4em; margin-bottom: 0.6em; line-height: 1.4; }
        .preview-content h4 { font-size: 1.25em; font-weight: 600; margin-top: 1.2em; margin-bottom: 0.5em; line-height: 1.5; }
        .preview-content h5 { font-size: 1.1em; font-weight: 600; margin-top: 1em; margin-bottom: 0.4em; line-height: 1.5; }
        .preview-content h6 { font-size: 1em; font-weight: 600; margin-top: 1em; margin-bottom: 0.4em; line-height: 1.5; color: ${uiFg}80; }

        .preview-content p { margin-top: 0; margin-bottom: 1.25em; line-height: 1.75; }

        .preview-content a { color: ${accent}; text-decoration: underline; text-underline-offset: 2px; }
        .preview-content a:hover { text-decoration: none; }

        .preview-content strong { font-weight: 600; color: ${accent}; }
        .preview-content em { font-style: italic; }

        .preview-content ul, .preview-content ol { margin-top: 0; margin-bottom: 1.25em; padding-left: 2em; }
        .preview-content li { margin-top: 0.5em; margin-bottom: 0.5em; line-height: 1.75; }
        .preview-content ul li::marker { color: ${accent}; }
        .preview-content ol li::marker { color: ${accent}; font-weight: 500; }

        .preview-content ul ul, .preview-content ol ol,
        .preview-content ul ol, .preview-content ol ul { margin-top: 0.5em; margin-bottom: 0.5em; }

        .preview-content blockquote {
            border-left: 4px solid ${accent};
            padding-left: 1em;
            margin-top: 1.5em; margin-bottom: 1.5em;
            font-style: italic;
            background: ${uiBg}10;
            padding: 1em;
            border-radius: 0 4px 4px 0;
        }
        .preview-content blockquote p { margin-bottom: 0; }

        .preview-content hr {
            border: none;
            border-top: 2px solid ${border};
            margin-top: 2em; margin-bottom: 2em;
        }

        .preview-content code {
            font-family: ${edFont};
            font-size: 0.9em;
            background: ${uiBg}40;
            padding: 0.2em 0.4em;
            border-radius: 4px;
            color: ${accent};
        }

        .preview-content pre {
            font-family: ${edFont};
            background: ${edBg};
            color: ${edFg};
            padding: 1.25em;
            margin-top: 1.5em; margin-bottom: 1.5em;
            border-radius: 8px;
            overflow-x: auto;
            border: 1px solid ${border};
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
            border: 1px solid ${border};
        }
        .preview-content th {
            font-weight: 600;
            background: ${uiBg}40;
            position: sticky;
            top: 0;
        }
        .preview-content tr:nth-child(even) { background: ${uiBg}20; }
        .preview-content tr:hover { background: ${uiBg}40; }

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
            border: 1px solid ${border};
            border-radius: 4px;
            background: ${uiBg}20;
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
            background: ${accent}30;
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
            background: ${edBg};
            color: ${edFg};
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
                ref={previewRef}
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
    // Note: Content is sanitized twice (MarkdownParser + DOMPurify) for XSS protection
    return (
        <div
            ref={previewRef}
            role="region"
            aria-label="Markdown preview"
            tabIndex={0}
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
