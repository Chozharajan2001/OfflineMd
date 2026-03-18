import type { IExporter, ExportInput, ExportResult, ExportFormat } from '../types';

interface SlideContent {
    title: string;
    bullets: string[];
}

class MarkdownToSlidesParser {
    parse(markdown: string): SlideContent[] {
        const lines = markdown.split('\n');
        const slides: SlideContent[] = [];
        let currentSlide: SlideContent | null = null;
        let inCodeBlock = false;
        let codeContent: string[] = [];

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
                if (inCodeBlock && currentSlide && codeContent.length > 0) {
                    currentSlide.bullets.push(...codeContent.map((codeLine) => `code: ${codeLine}`));
                    codeContent = [];
                }
                inCodeBlock = !inCodeBlock;
                continue;
            }

            if (inCodeBlock) {
                if (line.trim()) {
                    codeContent.push(line.trim());
                }
                continue;
            }

            if (trimmed.startsWith('# ')) {
                if (currentSlide && currentSlide.title) {
                    slides.push(currentSlide);
                }
                currentSlide = {
                    title: trimmed.slice(2).trim(),
                    bullets: []
                };
            } else if (trimmed.startsWith('## ')) {
                if (currentSlide && currentSlide.title) {
                    slides.push(currentSlide);
                }
                currentSlide = {
                    title: trimmed.slice(3).trim(),
                    bullets: []
                };
            } else if (trimmed.startsWith('### ')) {
                if (currentSlide && currentSlide.title) {
                    slides.push(currentSlide);
                }
                currentSlide = {
                    title: trimmed.slice(4).trim(),
                    bullets: []
                };
            } else if (trimmed.match(/^[-*+]\s/) && currentSlide) {
                currentSlide.bullets.push(trimmed.slice(2).trim());
            } else if (trimmed.match(/^\d+\.\s/) && currentSlide) {
                currentSlide.bullets.push(trimmed.replace(/^\d+\.\s/, '').trim());
            } else if (trimmed !== '' && currentSlide) {
                currentSlide.bullets.push(trimmed);
            }
        }

        if (inCodeBlock && currentSlide && codeContent.length > 0) {
            currentSlide.bullets.push(...codeContent.map((codeLine) => `code: ${codeLine}`));
        }

        if (currentSlide && currentSlide.title) {
            slides.push(currentSlide);
        }

        if (slides.length === 0 && markdown.trim()) {
            slides.push({
                title: 'Document',
                bullets: markdown.split('\n').filter(l => l.trim())
            });
        }

        return slides;
    }
}

export class PptxExporter implements IExporter {
    format: ExportFormat = 'pptx';
    extension = '.pptx';
    mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    label = 'PPTX';
    icon = '📊';

    supportsTheme = true;
    supportsEditing = false;
    supportsImages: boolean = false;

    async export(input: ExportInput): Promise<ExportResult> {
        const start = performance.now();

        try {
            const { markdown, theme, options } = input;

            // Validate input
            if (!markdown || typeof markdown !== 'string') {
                throw new Error('Invalid markdown content');
            }

            const PptxGenJS = (await import('pptxgenjs')).default;
            const pres = new PptxGenJS();

            pres.layout = 'LAYOUT_WIDE';
            pres.title = 'Markdown Presentation';
            pres.author = 'Markdown Converter';
            pres.subject = 'Exported from Markdown';

            const effectiveTheme = options.includeTheme
                ? theme
                : {
                    ui: { accent: '#2563eb' },
                    preview: { foreground: '#111111', background: '#ffffff' },
                };
            const accentColor = this.hexToRgb(effectiveTheme.ui.accent);
            const textColor = this.hexToRgb(effectiveTheme.preview.foreground);
            const bgColor = this.hexToRgb(effectiveTheme.preview.background);

            const accentHex = this.rgbToHex(accentColor);
            const textHex = this.rgbToHex(textColor);
            const bgHex = this.rgbToHex(bgColor);

            const parser = new MarkdownToSlidesParser();
            const slides = parser.parse(markdown);

            if (slides.length === 0) {
                const slide = pres.addSlide();
                slide.background = { color: bgHex };

                slide.addText(this.safeText('Markdown Presentation'), {
                    x: 0.5,
                    y: 1,
                    w: 12.0,
                    h: 1,
                    fontSize: 32,
                    bold: true,
                    color: accentHex,
                    fontFace: 'Arial'
                });

                slide.addText(this.safeText('No content to display'), {
                    x: 0.5,
                    y: 2.5,
                    w: 12.0,
                    h: 1,
                    fontSize: 18,
                    color: textHex,
                    fontFace: 'Arial'
                });
            } else {
                for (const slideData of slides) {
                    const normalizedBulletLines = this.expandBulletsToLines(slideData.bullets);
                    const bulletPages = this.chunkLines(normalizedBulletLines, 11);

                    // Always render at least one slide for a heading.
                    const pages = bulletPages.length > 0 ? bulletPages : [[]];
                    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
                        const slide = pres.addSlide();
                        slide.background = { color: bgHex };

                        const title = pageIndex === 0
                            ? this.safeText(slideData.title)
                            : `${this.safeText(slideData.title)} (cont.)`;

                        slide.addText(title, {
                            x: 0.5,
                            y: 0.5,
                            w: 12.0,
                            h: 1,
                            fontSize: 36,
                            bold: true,
                            color: accentHex,
                            fontFace: 'Arial'
                        });

                        let bulletY = 1.8;
                        for (const line of pages[pageIndex]) {
                            slide.addText(line, {
                                x: 0.7,
                                y: bulletY,
                                w: 11.6,
                                h: 0.45,
                                fontSize: 18,
                                color: textHex,
                                fontFace: 'Arial',
                            });
                            bulletY += 0.45;
                        }
                    }
                }
            }

            const pptxOptions = {
                outputType: 'blob' as const,
                compression: true
            };

            const pptxOut = await pres.write(pptxOptions);
            const blob = new Blob([pptxOut] as BlobPart[], { type: this.mimeType });

            // Generate filename with timestamp and extracted/sanitized title
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

            // Extract title from first H1 heading if not in metadata
            let baseTitle = input.metadata?.title || 'document';
            if (!input.metadata?.title) {
                const titleMatch = input.markdown.match(/^#\s+(.*)/m);
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

            return {
                blob,
                filename,
                mimeType: this.mimeType,
                size: blob.size,
                duration
            };

        } catch (error) {
            console.error('PPTX export failed:', error);
            throw new Error(`Failed to export PPTX: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private hexToRgb(hex: string): { r: number; g: number; b: number } {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : { r: 0, g: 0, b: 0 };
    }

    private rgbToHex(color: { r: number; g: number; b: number }): string {
        const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
        const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
        const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
        return this.normalizeHex(`${r}${g}${b}`);
    }

    private normalizeHex(input: string): string {
        const hex = String(input || '').replace('#', '').trim();
        if (/^[0-9a-fA-F]{6}$/.test(hex)) return hex.toUpperCase();
        return '111111';
    }

    private safeText(value: unknown): string {
        return String(value ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\t/g, '    ');
    }

    private wrapLine(text: string, maxChars = 85): string[] {
        const source = this.safeText(text).trim();
        if (!source) return [];

        const words = source.replace(/\s+/g, ' ').split(' ');
        const lines: string[] = [];
        let current = '';

        for (const word of words) {
            if (word.length > maxChars) {
                if (current) {
                    lines.push(current);
                    current = '';
                }
                for (let i = 0; i < word.length; i += maxChars) {
                    lines.push(word.slice(i, i + maxChars));
                }
                continue;
            }

            const candidate = current ? `${current} ${word}` : word;
            if (candidate.length > maxChars && current) {
                lines.push(current);
                current = word;
            } else {
                current = candidate;
            }
        }
        if (current) lines.push(current);
        return lines;
    }

    private expandBulletsToLines(bullets: string[]): string[] {
        const lines: string[] = [];
        for (const bullet of bullets) {
            const wrapped = this.wrapLine(bullet);
            if (wrapped.length === 0) continue;
            lines.push(`- ${wrapped[0]}`);
            for (let i = 1; i < wrapped.length; i++) {
                lines.push(`  ${wrapped[i]}`);
            }
        }
        return lines;
    }

    private chunkLines(lines: string[], perSlide: number): string[][] {
        if (perSlide <= 0) return [lines];
        const chunks: string[][] = [];
        for (let i = 0; i < lines.length; i += perSlide) {
            chunks.push(lines.slice(i, i + perSlide));
        }
        return chunks;
    }
}
