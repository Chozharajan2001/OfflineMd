import type { IExporter, ExportInput, ExportResult, ExportFormat } from '../types';
import { triggerDownload } from '../utils/file-saver';

export class MarkdownExporter implements IExporter {
    format: ExportFormat = 'md';
    extension = '.md';
    mimeType = 'text/markdown';
    label = 'Markdown';
    icon = '📝';

    supportsTheme = false;
    supportsEditing = true;
    supportsImages = false;

    async export({ markdown }: ExportInput): Promise<ExportResult> {
        const start = performance.now();
        const blob = new Blob([markdown], { type: this.mimeType });
        const filename = 'document' + this.extension;
        const duration = performance.now() - start;
        return { blob, filename, mimeType: this.mimeType, size: blob.size, duration };
    }
}
