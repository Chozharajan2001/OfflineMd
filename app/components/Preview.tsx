'use client';

import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { ArrowUpDown, Copy } from 'lucide-react';
import { useMarkdownStore } from '../store';
import { markdownParser } from '../services/MarkdownParser';
import { safeFontFamily, safeHex, accentTextFor } from '../../src/export/utils/theme-validation';
import { getFrontMatter } from '../../src/export/utils/front-matter';
import { useToast } from './notifications/useToast';

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
    const scrollSyncEnabled = useMarkdownStore((s) => s.scrollSyncEnabled);
    const toggleScrollSyncEnabled = useMarkdownStore((s) => s.toggleScrollSyncEnabled);
    const toast = useToast();
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

        // TOC navigation from the sidebar contents list
        const handleTocNavigate: EventListener = (event) => {
            const e = event as CustomEvent<{ id: string }>;
            const target = previewRef.current?.querySelector(`#${CSS.escape(e.detail.id)}`);
            target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };

        window.addEventListener('editor-scroll', handleEditorScroll);
        window.addEventListener('toc-navigate', handleTocNavigate);
        return () => {
            window.removeEventListener('editor-scroll', handleEditorScroll);
            window.removeEventListener('toc-navigate', handleTocNavigate);
        };
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
    const accentText = accentTextFor(theme.preview.background, theme.ui.accent, theme.preview.foreground);
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

        .preview-content a { color: ${accentText}; text-decoration: underline; text-underline-offset: 2px; }
        .preview-content a:hover { text-decoration: none; }

        .preview-content strong { font-weight: 600; color: ${accentText}; }
        .preview-content em { font-style: italic; }

        .preview-content ul, .preview-content ol { margin-top: 0; margin-bottom: 1.25em; padding-left: 2em; }
        .preview-content li { margin-top: 0.5em; margin-bottom: 0.5em; line-height: 1.75; }
        .preview-content ul li::marker { color: ${accentText}; }
        .preview-content ol li::marker { color: ${accentText}; font-weight: 500; }

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
            color: ${accentText};
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
    const frontMatter = getFrontMatter(markdown).data;
    const metaLine = [frontMatter.author, frontMatter.date].filter(Boolean).join(' · ');
    const { activeProjectId } = useMarkdownStore.getState();
    if (!activeProjectId) {
        return (
            <div
                ref={previewRef}
                role="region"
                aria-label="Getting started"
                tabIndex={0}
                className="h-full w-full overflow-auto p-4 sm:p-8"
                style={{
                    backgroundColor: theme.preview.background,
                    color: theme.preview.foreground,
                    fontFamily: theme.preview.fontFamily,
                    fontSize: `${theme.preview.fontSize}px`,
                }}
            >
                <div className="preview-content max-w-xl mx-auto mt-10 rounded-xl border border-[var(--dialog-border)] bg-[var(--surface-1)] p-6 sm:p-8 text-center">
                    <h1 className="!border-0 !pb-0">Start writing in seconds</h1>
                    <p>Create a project, add a file, and your words autosave as you type.</p>
                    <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('open-new-project-dialog'))}
                        className="mt-2 px-4 min-h-[44px] rounded bg-[var(--button-primary-bg)] text-[var(--button-fg)] hover:bg-[var(--button-primary-hover)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    >
                        Create your first project
                    </button>
                    <p className="text-sm opacity-70">…or pick a file from the sidebar to keep editing.</p>
                </div>
                <style>{proseStyles}</style>
                <div
                    className="preview-content"
                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
            </div>
        );
    }
    return (
        <div
            ref={previewRef}
            role="region"
            aria-label="Markdown preview"
            tabIndex={0}
            className="h-full w-full overflow-auto p-4 sm:p-8"
            style={{
                backgroundColor: theme.preview.background,
                color: theme.preview.foreground,
                fontFamily: theme.preview.fontFamily,
                fontSize: `${theme.preview.fontSize}px`,
            }}
        >
            <style>{proseStyles}</style>
            {/* Preview-local toolbar: scroll sync + copy live here, not the global header */}
            <div className="sticky top-0 z-10 flex justify-end gap-1 pb-2 -mt-1" role="toolbar" aria-label="Preview tools">
                <button
                    type="button"
                    onClick={toggleScrollSyncEnabled}
                    aria-pressed={scrollSyncEnabled}
                    title={scrollSyncEnabled ? 'Disable scroll sync' : 'Enable scroll sync'}
                    aria-label={scrollSyncEnabled ? 'Disable scroll sync' : 'Enable scroll sync'}
                    className={`min-h-[36px] min-w-[36px] inline-flex items-center justify-center p-1.5 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${scrollSyncEnabled ? 'bg-[var(--sidebar-hover)]' : 'opacity-60 hover:opacity-100 hover:bg-[var(--sidebar-hover)]'}`}
                >
                    <ArrowUpDown className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                    type="button"
                    onClick={() => {
                        void navigator.clipboard.writeText(markdown).then(
                            () => toast.success('Markdown copied!'),
                            () => toast.error('Copy failed')
                        );
                    }}
                    title="Copy markdown"
                    aria-label="Copy markdown to clipboard"
                    className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center p-1.5 rounded opacity-60 hover:opacity-100 hover:bg-[var(--sidebar-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                    <Copy className="w-4 h-4" aria-hidden="true" />
                </button>
            </div>
            {frontMatter.title && (
                <div className="preview-content mb-2 text-sm opacity-70" aria-label="Document metadata">
                    {String(frontMatter.title)}
                    {metaLine ? ` — ${metaLine}` : ''}
                </div>
            )}
            <div
                className="preview-content"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
        </div>
    );
}
