import type { IExporter, ExportInput, ExportResult, ExportFormat } from '../types';
import { markdownParser } from '../../../app/services/MarkdownParser';
import { themeToCSS } from '../utils/theme-to-css';
import { sanitizeHTML } from '../utils/sanitizer';
import { extractTitle, safeFilename } from '../utils/safe-filename';
import { safeHex } from '../utils/theme-validation';

/**
 * PNG exporter: renders the themed document to an off-screen node and
 * snapshots it with html-to-image. Lazy-imported by the orchestrator so the
 * canvas stack never lands in the initial bundle.
 */
export class PngExporter implements IExporter {
    format: ExportFormat = 'png';
    extension = '.png';
    mimeType = 'image/png';
    label = 'PNG';
    icon = '🖼️';

    supportsTheme = true;
    supportsEditing = false;
    supportsImages = false;

    async export({ markdown, theme, options, metadata, onProgress }: ExportInput): Promise<ExportResult> {
        const start = performance.now();
        if (typeof document === 'undefined') {
            throw new Error('PNG export requires a browser environment');
        }
        try {
            onProgress?.(5);
            if (!markdown || typeof markdown !== 'string') {
                throw new Error('Invalid markdown content');
            }
            const rawHtml = await markdownParser.parse(markdown);
            const safeHtml = await sanitizeHTML(rawHtml);
            onProgress?.(30);

            const { toPng } = await import('html-to-image');

            const host = document.createElement('div');
            host.setAttribute('aria-hidden', 'true');
            host.style.cssText = 'position:fixed;left:-10000px;top:0;width:860px;pointer-events:none;';
            const css = options.includeTheme ? themeToCSS(theme) : '';
            const bg = safeHex(theme.preview.background, '#ffffff');
            const fg = safeHex(theme.preview.foreground, '#111111');
            host.innerHTML = `<style>${css}.png-root{background:${bg};color:${fg};padding:48px;}</style><div class="preview-content png-root">${safeHtml}</div>`;
            document.body.appendChild(host);
            try {
                onProgress?.(60);
                const dataUrl = await toPng(host.firstElementChild as HTMLElement, {
                    cacheBust: true,
                    pixelRatio: 2,
                });
                onProgress?.(90);
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                const filename = `${safeFilename(extractTitle(markdown, metadata?.title))}_${timestamp}${this.extension}`;
                return { blob, filename, mimeType: this.mimeType, size: blob.size, duration: performance.now() - start };
            } finally {
                host.remove();
            }
        } catch (error) {
            console.error('PNG export failed:', error);
            throw new Error(`Failed to export PNG: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
