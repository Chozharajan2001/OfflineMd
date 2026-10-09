import type { IExporter, ExportInput, ExportResult, ExportFormat } from '../types';
import { markdownParser } from '../../../app/services/MarkdownParser';
import { themeToCSS } from '../utils/theme-to-css';
import { sanitizeHTML } from '../utils/sanitizer';
import { highlightThemeCSS } from '../utils/highlight-theme';
import { extractTitle, safeFilename } from '../utils/safe-filename';
import { extractToc } from '../utils/toc';

export class HtmlExporter implements IExporter {
    format: ExportFormat = 'html';
    extension = '.html';
    mimeType = 'text/html';
    label = 'HTML';
    icon = '🌐';

    supportsTheme = true;
    supportsEditing = false;
    supportsImages = true;

    private escapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    private async renderMermaidAsSvg(html: string, isDarkTheme: boolean): Promise<string> {
        if (!html.includes('language-mermaid')) return html;
        if (typeof document === 'undefined') return html;

        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'strict',
            theme: isDarkTheme ? 'dark' : 'default',
        });

        const host = document.createElement('div');
        host.innerHTML = html;
        const blocks = host.querySelectorAll('pre > code.language-mermaid');
        let index = 0;

        for (const codeEl of blocks) {
            const diagram = codeEl.textContent || '';
            const pre = codeEl.parentElement;
            if (!pre || !pre.parentElement) continue;

            try {
                const renderId = `mermaid-export-${Date.now()}-${index++}`;
                const { svg } = await mermaid.render(renderId, diagram);
                const wrapper = document.createElement('div');
                wrapper.className = 'mermaid-diagram';
                wrapper.innerHTML = svg;
                pre.parentElement.replaceChild(wrapper, pre);
            } catch {
                // Keep original code block when rendering fails.
            }
        }

        return host.innerHTML;
    }

    async export({ markdown, theme, options, metadata }: ExportInput): Promise<ExportResult> {
        const start = performance.now();

        try {
            // Validate input
            if (!markdown || typeof markdown !== 'string') {
                throw new Error('Invalid markdown content');
            }

            // Convert markdown to HTML
            const rawHtml = await markdownParser.parse(markdown);

            // Sanitize HTML
            const safeHtml = await sanitizeHTML(rawHtml);
            const isDarkTheme = theme.preview.background !== '#ffffff';
            const htmlWithMermaidUnsafe = await this.renderMermaidAsSvg(safeHtml, isDarkTheme);
            // Re-sanitize after mermaid SVG injection (SVG can carry scripts/event attrs)
            const htmlWithMermaid = await sanitizeHTML(htmlWithMermaidUnsafe);

            // Inline theme CSS if requested
            const styleParts: string[] = [];
            if (options.includeTheme) styleParts.push(themeToCSS(theme));
            styleParts.push(highlightThemeCSS);
            styleParts.push('.preview-content .mermaid-diagram{margin:1.25rem 0;overflow:auto;}');
            styleParts.push('.preview-content .export-toc{border:1px solid #ddd;border-radius:8px;padding:1rem 1.5rem;margin:0 0 2rem;}');
            styleParts.push('.preview-content .export-toc ul{list-style:none;padding-left:0;}');
            styleParts.push('.preview-content .export-toc li{margin:0.25rem 0;}');
            const styleBlock = `<style>${styleParts.join('\n')}</style>`;
            const escapedDocTitle = this.escapeHtml(metadata?.title || 'Untitled Document');

            // Optional table of contents (honors the export dialog flag)
            let tocBlock = '';
            if (options.includeTableOfContents) {
                const entries = extractToc(markdown);
                if (entries.length > 0) {
                    const items = entries
                        .map((e) => `    <li style="margin-left:${(e.level - 1) * 1.25}rem"><a href="#${e.id}">${this.escapeHtml(e.text)}</a></li>`)
                        .join('\n');
                    tocBlock = `<nav class="export-toc" aria-label="Table of contents">\n  <strong>Contents</strong>\n  <ul>\n${items}\n  </ul>\n</nav>\n  `;
                }
            }

            // Create self-contained HTML document
            const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapedDocTitle}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${styleBlock}
</head>
<body class="preview-content">
  ${tocBlock}${htmlWithMermaid}
</body>
</html>`;

            const blob = new Blob([fullHtml], { type: this.mimeType });

            // Generate filename with timestamp and extracted/sanitized title
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

            const baseTitle = extractTitle(markdown, metadata?.title);
            const safeTitle = safeFilename(baseTitle);

            const filename = `${safeTitle}_${timestamp}${this.extension}`;

            const duration = performance.now() - start;
            return { blob, filename, mimeType: this.mimeType, size: blob.size, duration };

        } catch (error) {
            console.error('HTML export failed:', error);
            throw new Error(`Failed to export HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
