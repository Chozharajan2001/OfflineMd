import type { IExporter, ExportInput, ExportResult, ExportFormat, ThemeTokens } from '../types';

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
        let codeContent = '';

        for (const line of lines) {
            if (line.startsWith('```') || line.startsWith('~~~')) {
                inCodeBlock = !inCodeBlock;
                continue;
            }

            if (inCodeBlock) {
                codeContent += (codeContent ? '\n' : '') + line;
                continue;
            }

            if (line.startsWith('# ')) {
                if (currentSlide && currentSlide.title) {
                    slides.push(currentSlide);
                }
                currentSlide = {
                    title: line.slice(2),
                    bullets: []
                };
            } else if (line.startsWith('## ')) {
                if (currentSlide && currentSlide.title) {
                    slides.push(currentSlide);
                }
                currentSlide = {
                    title: line.slice(3),
                    bullets: []
                };
            } else if (line.startsWith('### ')) {
                if (currentSlide && currentSlide.title) {
                    slides.push(currentSlide);
                }
                currentSlide = {
                    title: line.slice(4),
                    bullets: []
                };
            } else if (line.match(/^[-*+]\s/) && currentSlide) {
                currentSlide.bullets.push(line.slice(2).trim());
            } else if (line.match(/^\d+\.\s/) && currentSlide) {
                currentSlide.bullets.push(line.replace(/^\d+\.\s/, '').trim());
            } else if (line.trim() !== '' && currentSlide && currentSlide.bullets.length === 0) {
                currentSlide.bullets.push(line.trim());
            }
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
    supportsImages: boolean = true;

    async export(input: ExportInput): Promise<ExportResult> {
        const start = performance.now();
        const { markdown, theme } = input;

        const PptxGenJS = (await import('pptxgenjs')).default;
        const pres = new PptxGenJS();

        pres.layout = 'LAYOUT_16x9';
        pres.title = 'Markdown Presentation';
        pres.author = 'Markdown Converter';
        pres.subject = 'Exported from Markdown';

        const accentColor = this.hexToRgb(theme.ui.accent);
        const textColor = this.hexToRgb(theme.preview.foreground);
        const bgColor = this.hexToRgb(theme.preview.background);

        const accentHex = `rgb(${Math.round(accentColor.r * 255)}, ${Math.round(accentColor.g * 255)}, ${Math.round(accentColor.b * 255)})`;
        const textHex = `rgb(${Math.round(textColor.r * 255)}, ${Math.round(textColor.g * 255)}, ${Math.round(textColor.b * 255)})`;
        const bgHex = `rgb(${Math.round(bgColor.r * 255)}, ${Math.round(bgColor.g * 255)}, ${Math.round(bgColor.b * 255)})`;

        const parser = new MarkdownToSlidesParser();
        const slides = parser.parse(markdown);

        if (slides.length === 0) {
            const slide = pres.addSlide();
            slide.background = { color: bgHex };
            
            slide.addText('Markdown Presentation', {
                x: 0.5,
                y: 1,
                w: '90%',
                h: 1,
                fontSize: 32,
                bold: true,
                color: accentHex,
                fontFace: 'Arial'
            });

            slide.addText('No content to display', {
                x: 0.5,
                y: 2.5,
                w: '90%',
                h: 1,
                fontSize: 18,
                color: textHex,
                fontFace: 'Arial'
            });
        } else {
            for (const slideData of slides) {
                const slide = pres.addSlide();
                slide.background = { color: bgHex };

                slide.addText(slideData.title, {
                    x: 0.5,
                    y: 0.5,
                    w: '90%',
                    h: 1,
                    fontSize: 36,
                    bold: true,
                    color: accentHex,
                    fontFace: 'Arial'
                });

                if (slideData.bullets.length > 0) {
                    const bulletPoints = slideData.bullets.map(bullet => ({
                        text: bullet,
                        options: {
                            fontSize: 18,
                            color: textHex,
                            fontFace: 'Arial',
                            bullet: { type: 'bullet' as const }
                        }
                    }));

                    slide.addText(bulletPoints, {
                        x: 0.5,
                        y: 1.8,
                        w: '90%',
                        h: '70%',
                        valign: 'top'
                    });
                }
            }
        }

        const pptxOptions = {
            compression: true
        };

        const pptxOut = await pres.write(pptxOptions);
        const blob = new Blob([pptxOut] as BlobPart[], { type: this.mimeType });
        const filename = 'document' + this.extension;
        const duration = performance.now() - start;

        return {
            blob,
            filename,
            mimeType: this.mimeType,
            size: blob.size,
            duration
        };
    }

    private hexToRgb(hex: string): { r: number; g: number; b: number } {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : { r: 0, g: 0, b: 0 };
    }
}
