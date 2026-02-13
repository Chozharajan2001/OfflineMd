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

        // Convert markdown to HTML
        const rawHtml = await markdownParser.parse(markdown);

        // Sanitize HTML
        const safeHtml = await sanitizeHTML(rawHtml);

        // Inline theme CSS if requested
        const styleBlock = options.includeTheme ? `<style>${themeToCSS(theme)}</style>` : '';

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
</body>
</html>`;

        const blob = new Blob([fullHtml], { type: this.mimeType });
        const filename = 'document' + this.extension;
        const duration = performance.now() - start;
        return { blob, filename, mimeType: this.mimeType, size: blob.size, duration };
    }
}
