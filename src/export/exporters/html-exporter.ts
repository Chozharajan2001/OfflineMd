import type { IExporter, ExportInput, ExportResult, ExportFormat } from '../types';
import { markdownParser } from '../../../app/services/MarkdownParser';
import { themeToCSS } from '../utils/theme-to-css';
import { sanitizeHTML } from '../utils/sanitizer';
import { highlightThemeCSS } from '../utils/highlight-theme';

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
            securityLevel: 'loose',
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
            const htmlWithMermaid = await this.renderMermaidAsSvg(safeHtml, isDarkTheme);

            // Inline theme CSS if requested
            const styleParts: string[] = [];
            if (options.includeTheme) styleParts.push(themeToCSS(theme));
            styleParts.push(highlightThemeCSS);
            styleParts.push('.preview-content .mermaid-diagram{margin:1.25rem 0;overflow:auto;}');
            const styleBlock = `<style>${styleParts.join('\n')}</style>`;
            const escapedDocTitle = this.escapeHtml(metadata?.title || 'Untitled Document');

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
  ${htmlWithMermaid}
</body>
</html>`;

            const blob = new Blob([fullHtml], { type: this.mimeType });

            // Generate filename with timestamp and extracted/sanitized title
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

            // Extract title from first H1 heading if not in metadata
            let baseTitle = metadata?.title || 'document';
            if (!metadata?.title) {
                const titleMatch = markdown.match(/^#\s+(.*)/m);
                if (titleMatch && titleMatch[1]) {
                    baseTitle = titleMatch[1].trim();
                }
            }

            // Sanitize title: remove invalid filename chars and limit length
            const safeTitle = baseTitle
                .replace(/[\\/:*?"<>|]/g, '_')  // Remove Windows-invalid chars
                .replace(/[^a-z0-9\s\-_]/gi, '_') // Remove other special chars
                .replace(/\s+/g, '-')              // Spaces to dashes
                .toLowerCase()
                .slice(0, 50);                     // Max 50 chars

            const filename = `${safeTitle}_${timestamp}${this.extension}`;

            const duration = performance.now() - start;
            return { blob, filename, mimeType: this.mimeType, size: blob.size, duration };

        } catch (error) {
            console.error('HTML export failed:', error);
            throw new Error(`Failed to export HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
