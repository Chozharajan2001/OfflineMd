import type { IExporter, ExportInput, ExportResult, ExportFormat } from '../types';
import { markdownParser } from '../../../app/services/MarkdownParser';
import { sanitizeHTML } from '../utils/sanitizer';
import { extractTitle, safeFilename } from '../utils/safe-filename';

/**
 * Minimal EPUB 3 exporter (D.4): mimetype (stored first) + container +
 * package + single XHTML spine item, zipped with JSZip (already a dep).
 */
export class EpubExporter implements IExporter {
    format: ExportFormat = 'epub';
    extension = '.epub';
    mimeType = 'application/epub+zip';
    label = 'EPUB';
    icon = '📚';

    supportsTheme = false;
    supportsEditing = false;
    supportsImages = false;

    private escapeXml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    async export({ markdown, metadata, onProgress }: ExportInput): Promise<ExportResult> {
        const start = performance.now();
        try {
            if (!markdown || typeof markdown !== 'string') {
                throw new Error('Invalid markdown content');
            }
            onProgress?.(10);
            const rawHtml = await markdownParser.parse(markdown);
            const safeHtml = await sanitizeHTML(rawHtml);
            onProgress?.(40);
            const { default: JSZip } = await import('jszip');

            const title = this.escapeXml(metadata?.title || extractTitle(markdown));
            const author = this.escapeXml(metadata?.author || 'Markdown Converter');
            const id = `md-${Date.now()}`;

            const xhtml = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" lang="en">\n<head><title>${title}</title></head>\n<body>${safeHtml}</body>\n</html>`;
            const opf = `<?xml version="1.0" encoding="UTF-8"?>\n<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">\n<metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="bookid">${id}</dc:identifier><dc:title>${title}</dc:title><dc:creator>${author}</dc:creator><dc:language>en</dc:language><meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta></metadata>\n<manifest><item id="content" href="content.xhtml" media-type="application/xhtml+xml"/></manifest>\n<spine><itemref idref="content"/></spine>\n</package>`;
            const container = `<?xml version="1.0" encoding="UTF-8"?>\n<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`;

            const zip = new JSZip();
            // Spec: mimetype first and uncompressed
            zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
            zip.file('META-INF/container.xml', container, { compression: 'DEFLATE' });
            zip.file('OEBPS/content.opf', opf, { compression: 'DEFLATE' });
            zip.file('OEBPS/content.xhtml', xhtml, { compression: 'DEFLATE' });
            onProgress?.(70);
            const blob = await zip.generateAsync({ type: 'blob', mimeType: this.mimeType });
            onProgress?.(100);

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `${safeFilename(extractTitle(markdown, metadata?.title))}_${timestamp}${this.extension}`;
            return { blob, filename, mimeType: this.mimeType, size: blob.size, duration: performance.now() - start };
        } catch (error) {
            console.error('EPUB export failed:', error);
            throw new Error(`Failed to export EPUB: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
