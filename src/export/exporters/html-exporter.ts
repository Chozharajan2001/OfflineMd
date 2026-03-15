import type { IExporter, ExportInput, ExportResult, ExportFormat } from '../types';
import { markdownParser } from '../../../app/services/MarkdownParser';
import { themeToCSS } from '../utils/theme-to-css';
import { sanitizeHTML } from '../utils/sanitizer';

export class HtmlExporter implements IExporter {
    format: ExportFormat = 'html';
    extension = '.html';
    mimeType = 'text/html';
    label = 'HTML';
    icon = '🌐';

    supportsTheme = true;
    supportsEditing = false;
    supportsImages = true;

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

        // Inline theme CSS if requested
        const styleBlock = options.includeTheme ? `<style>${themeToCSS(theme)}</style>` : '';

        // Mermaid support (client-side) - load mermaid.js in exported HTML
        const mermaidScript = `<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script><script>if (typeof mermaid !== 'undefined') mermaid.initialize({ startOnLoad: true, theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default' });</script>`;

        // Create self-contained HTML document
        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${metadata?.title || 'Untitled Document'}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${styleBlock}
</head>
<body class="preview-content">
  ${safeHtml}
  ${mermaidScript}
</body>
</html>`;

        const blob = new Blob([fullHtml], { type: this.mimeType });
        
        // Generate filename with timestamp and sanitized title
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const safeTitle = (metadata?.title || 'document')
            .replace(/[^a-z0-9\s\-_]/gi, '_')
            .replace(/\s+/g, '-')
            .toLowerCase()
            .slice(0, 50);
        const filename = `${safeTitle}_${timestamp}${this.extension}`;
        
        const duration = performance.now() - start;
        return { blob, filename, mimeType: this.mimeType, size: blob.size, duration };
        
        } catch (error) {
            console.error('HTML export failed:', error);
            throw new Error(`Failed to export HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
