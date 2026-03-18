import type { IExporter, ExportInput, ExportResult, ExportFormat } from '../types';

export class MarkdownExporter implements IExporter {
    format: ExportFormat = 'md';
    extension = '.md';
    mimeType = 'text/markdown';
    label = 'Markdown';
    icon = '📝';

    supportsTheme = false;
    supportsEditing = true;
    supportsImages = false;

    async export({ markdown, metadata }: ExportInput): Promise<ExportResult> {
        const start = performance.now();
        const blob = new Blob([markdown], { type: this.mimeType });
        const base = (metadata?.title || 'document')
            .replace(/[\\/:*?"<>|]/g, '_')
            .replace(/[^a-z0-9\s\-_]/gi, '_')
            .replace(/\s+/g, '-')
            .toLowerCase()
            .slice(0, 50);
        const filename = `${base || 'document'}${this.extension}`;
        const duration = performance.now() - start;
        return { blob, filename, mimeType: this.mimeType, size: blob.size, duration };
    }
}
