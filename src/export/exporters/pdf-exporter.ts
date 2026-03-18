import type { IExporter, ExportInput, ExportResult, ExportFormat } from '../types';
import type { Color, PDFFont, PDFPage } from 'pdf-lib';

interface TextRun {
    text: string;
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
    link?: string;
}

interface ParsedLine {
    type: 'heading1' | 'heading2' | 'heading3' | 'heading4' | 'paragraph' | 'code' | 'blockquote' | 'list' | 'orderedList' | 'tableRow' | 'hr' | 'empty' | 'image';
    content?: string;
    language?: string;
    runs?: TextRun[];
    items?: string[];
    cells?: string[];
    imageUrl?: string; // For image type
    altText?: string;  // Alt text for image
}

type PdfColor = { r: number; g: number; b: number };
type PdfRgbFactory = (r: number, g: number, b: number) => Color;

class MarkdownParser {
    parse(markdown: string): ParsedLine[] {
        const lines = markdown.split('\n');
        const result: ParsedLine[] = [];
        let inCodeBlock = false;
        let codeContent: string[] = [];
        let codeLanguage = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trimStart();

            if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
                if (!inCodeBlock) {
                    inCodeBlock = true;
                    codeContent = [];
                    codeLanguage = trimmed.slice(3).trim();
                } else {
                    result.push({ type: 'code', content: codeContent.join('\n'), language: codeLanguage });
                    inCodeBlock = false;
                    codeLanguage = '';
                }
                continue;
            }

            if (inCodeBlock) {
                codeContent.push(line);
                continue;
            }

            if (trimmed.startsWith('# ')) {
                result.push({ type: 'heading1', content: trimmed.slice(2) });
            } else if (trimmed.startsWith('## ')) {
                result.push({ type: 'heading2', content: trimmed.slice(3) });
            } else if (trimmed.startsWith('### ')) {
                result.push({ type: 'heading3', content: trimmed.slice(4) });
            } else if (trimmed.startsWith('#### ')) {
                result.push({ type: 'heading4', content: trimmed.slice(5) });
            } else if (trimmed.startsWith('> ')) {
                result.push({ type: 'blockquote', runs: this.parseInlineFormatting(trimmed.slice(2)) });
            } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('+ ')) {
                result.push({ type: 'list', content: trimmed.slice(2) });
            } else if (/^\d+\.\s/.test(trimmed)) {
                result.push({ type: 'orderedList', content: trimmed.replace(/^\d+\.\s/, '') });
            } else if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                const cells = line.split('|').filter((c, idx) => idx !== 0 && idx !== line.split('|').length - 1).map(c => c.trim());
                if (cells.length > 0 && !line.match(/^[\s|:|-]+$/)) {
                    result.push({ type: 'tableRow', cells });
                }
            } else if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
                result.push({ type: 'hr' });
            } else if (trimmed === '') {
                result.push({ type: 'empty' });
            } else if (trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)/)) {
                // Parse image syntax: ![alt text](url)
                const match = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
                if (match) {
                    result.push({
                        type: 'image',
                        imageUrl: match[2],
                        altText: match[1]
                    });
                }
            } else {
                result.push({ type: 'paragraph', runs: this.parseInlineFormatting(line) });
            }
        }

        return this.mergeLists(result);
    }

    public parseInlineFormatting(text: string): TextRun[] {
        const runs: TextRun[] = [];
        let remaining = text;

        while (remaining.length > 0) {
            // Check for bold **text**
            const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
            // Check for italic *text* or _text_
            const italicMatch = remaining.match(/^\*([^*]+)\*/) || remaining.match(/^_([^_]+)_/);
            // Check for inline code `code`
            const codeMatch = remaining.match(/^`([^`]+)`/);
            // Check for link [text](url)
            const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);

            let matched = false;

            if (boldMatch) {
                runs.push({ text: boldMatch[1], bold: true });
                remaining = remaining.slice(boldMatch[0].length);
                matched = true;
            } else if (italicMatch) {
                runs.push({ text: italicMatch[1], italic: true });
                remaining = remaining.slice(italicMatch[0].length);
                matched = true;
            } else if (codeMatch) {
                runs.push({ text: codeMatch[1], code: true });
                remaining = remaining.slice(codeMatch[0].length);
                matched = true;
            } else if (linkMatch) {
                runs.push({ text: linkMatch[1], link: linkMatch[2] });
                remaining = remaining.slice(linkMatch[0].length);
                matched = true;
            }

            if (!matched) {
                // Find the next special character position
                const nextSpecial = Math.min(
                    remaining.indexOf('**') !== -1 ? remaining.indexOf('**') : Infinity,
                    remaining.indexOf('*') !== -1 ? remaining.indexOf('*') : Infinity,
                    remaining.indexOf('_') !== -1 ? remaining.indexOf('_') : Infinity,
                    remaining.indexOf('`') !== -1 ? remaining.indexOf('`') : Infinity,
                    remaining.indexOf('[') !== -1 ? remaining.indexOf('[') : Infinity
                );

                if (nextSpecial === Infinity || nextSpecial === 0) {
                    if (remaining.length > 0) {
                        runs.push({ text: remaining });
                        remaining = '';
                    }
                } else {
                    runs.push({ text: remaining.slice(0, nextSpecial) });
                    remaining = remaining.slice(nextSpecial);
                }
            }
        }

        return runs.length > 0 ? runs : [{ text: '' }];
    }

    private mergeLists(lines: ParsedLine[]): ParsedLine[] {
        const result: ParsedLine[] = [];
        let currentList: ParsedLine | null = null;

        for (const line of lines) {
            if (line.type === 'list') {
                if (currentList && currentList.type === 'list') {
                    currentList.items = currentList.items || [];
                    currentList.items.push(line.content || '');
                } else {
                    if (currentList) result.push(currentList);
                    currentList = { type: 'list', items: [line.content || ''] };
                }
            } else if (line.type === 'orderedList') {
                if (currentList && currentList.type === 'orderedList') {
                    currentList.items = currentList.items || [];
                    currentList.items.push(line.content || '');
                } else {
                    if (currentList) result.push(currentList);
                    currentList = { type: 'orderedList', items: [line.content || ''] };
                }
            } else {
                if (currentList) {
                    result.push(currentList);
                    currentList = null;
                }
                result.push(line);
            }
        }

        if (currentList) result.push(currentList);
        return result;
    }
}

export class PdfExporter implements IExporter {
    format: ExportFormat = 'pdf';
    extension = '.pdf';
    mimeType = 'application/pdf';
    label = 'PDF';
    icon = '📄';

    supportsTheme = true;
    supportsEditing = false;
    /**
     * ✅ NOW SUPPORTS IMAGES!
     * Embeds PNG and JPG images from markdown. Handles CORS and unsupported formats gracefully.
     */
    supportsImages: boolean = true;
    private readonly fontCharCache = new Map<string, string>();
    private static readonly MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB per image
    private static readonly MAX_TOTAL_IMAGE_BYTES = 30 * 1024 * 1024; // 30MB per export

    async export(input: ExportInput): Promise<ExportResult> {
        const start = performance.now();

        try {
            const { markdown, theme, options, onProgress } = input;

            // Validate input
            if (!markdown || typeof markdown !== 'string') {
                throw new Error('Invalid markdown content');
            }

            const { PDFDocument, StandardFonts, rgb, PageSizes } = await import('pdf-lib');
            const pdfDoc = await PDFDocument.create();

            const pageSizeName = options.pageSize || 'A4';
            let pageSize = PageSizes.A4;
            if (pageSizeName === 'A3') pageSize = PageSizes.A3;
            else if (pageSizeName === 'Letter') pageSize = PageSizes.Letter;

            const isLandscape = options.orientation === 'landscape';
            const [pageWidthOrig, pageHeightOrig] = pageSize;
            const pageWidth = isLandscape ? pageHeightOrig : pageWidthOrig;
            const pageHeight = isLandscape ? pageWidthOrig : pageHeightOrig;

            const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
            const helveticaBoldOblique = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
            const courier = await pdfDoc.embedFont(StandardFonts.Courier);

            const marginTop = (options.margins?.top ?? 20) * 2.83465;
            const marginRight = (options.margins?.right ?? 20) * 2.83465;
            const marginBottom = (options.margins?.bottom ?? 20) * 2.83465;
            const marginLeft = (options.margins?.left ?? 20) * 2.83465;
            const contentWidth = pageWidth - marginLeft - marginRight;

            const effectiveTheme = options.includeTheme
                ? theme
                : {
                    ui: { accent: '#2563eb' },
                    preview: { foreground: '#111111', background: '#ffffff' },
                    editor: { background: '#f5f5f5' },
                };
            const accent = this.hexToRgb(effectiveTheme.ui.accent);
            const textCol = this.hexToRgb(effectiveTheme.preview.foreground);
            const codeBg = this.hexToRgb(effectiveTheme.editor.background);
            const pageBg = this.hexToRgb(effectiveTheme.preview.background);

            const paintPageBackground = (targetPage: PDFPage) => {
                targetPage.drawRectangle({
                    x: 0,
                    y: 0,
                    width: pageWidth,
                    height: pageHeight,
                    color: rgb(pageBg.r, pageBg.g, pageBg.b),
                });
            };

            const createPage = () => {
                const nextPage = pdfDoc.addPage();
                nextPage.setSize(pageWidth, pageHeight);
                paintPageBackground(nextPage);
                return nextPage;
            };

            let page = createPage();
            let y = pageHeight - marginTop;

            const fontSize = options.fontSize || 12;
            const lineHeight = fontSize * 1.6;

            const parser = new MarkdownParser();
            const parsed = parser.parse(markdown);
            const totalLines = Math.max(parsed.length, 1);
            let processedLines = 0;
            let totalEmbeddedImageBytes = 0;

            for (const line of parsed) {
                // Report progress
                processedLines++;
                const progress = (processedLines / totalLines) * 100;
                if (onProgress && processedLines % 10 === 0) { // Update every 10 lines
                    onProgress(progress);
                }

                if (y < marginBottom + 50) {
                    page = createPage();
                    y = pageHeight - marginTop;
                }

                switch (line.type) {
                    case 'heading1':
                        y -= fontSize * 0.5;
                        const h1Lines = this.wrapText(line.content || '', helveticaBold, 28, contentWidth);
                        for (const txt of h1Lines) {
                            if (y < marginBottom) { page = createPage(); y = pageHeight - marginTop; }
                            page.drawText(txt, { x: marginLeft, y, size: 28, font: helveticaBold, color: rgb(accent.r, accent.g, accent.b) });
                            y -= lineHeight * 1.5;
                        }
                        y -= lineHeight * 0.5;
                        break;

                    case 'heading2':
                        y -= fontSize * 0.3;
                        const h2Lines = this.wrapText(line.content || '', helveticaBold, 22, contentWidth);
                        for (const txt of h2Lines) {
                            if (y < marginBottom) { page = createPage(); y = pageHeight - marginTop; }
                            page.drawText(txt, { x: marginLeft, y, size: 22, font: helveticaBold, color: rgb(textCol.r, textCol.g, textCol.b) });
                            y -= lineHeight * 1.3;
                        }
                        y -= lineHeight * 0.3;
                        break;

                    case 'heading3':
                        y -= fontSize * 0.3;
                        const h3Lines = this.wrapText(line.content || '', helveticaBold, 18, contentWidth);
                        for (const txt of h3Lines) {
                            if (y < marginBottom) { page = createPage(); y = pageHeight - marginTop; }
                            page.drawText(txt, { x: marginLeft, y, size: 18, font: helveticaBold, color: rgb(textCol.r, textCol.g, textCol.b) });
                            y -= lineHeight * 1.2;
                        }
                        y -= lineHeight * 0.2;
                        break;

                    case 'heading4':
                        y -= fontSize * 0.2;
                        const h4Lines = this.wrapText(line.content || '', helveticaBold, 15, contentWidth);
                        for (const txt of h4Lines) {
                            if (y < marginBottom) { page = createPage(); y = pageHeight - marginTop; }
                            page.drawText(txt, { x: marginLeft, y, size: 15, font: helveticaBold, color: rgb(textCol.r, textCol.g, textCol.b) });
                            y -= lineHeight;
                        }
                        y -= lineHeight * 0.2;
                        break;

                    case 'paragraph':
                        y -= fontSize * 0.3;
                        if (line.runs && line.runs.length > 0) {
                            const formatted = this.drawFormattedText(page, line.runs, marginLeft, y, fontSize, lineHeight, marginBottom, marginTop, pageHeight, createPage, helvetica, helveticaBold, helveticaOblique, helveticaBoldOblique, courier, accent, textCol, codeBg, contentWidth, rgb);
                            page = formatted.page;
                            y = formatted.y;
                        }
                        y -= fontSize * 0.5;
                        break;

                    case 'code':
                        y -= fontSize * 0.3;
                        const codeLines = (line.content || '').split('\n');
                        const codeHeaderHeight = line.language ? lineHeight * 0.9 : 0;
                        const codeBlockHeight = codeLines.length * lineHeight + 10 + codeHeaderHeight;
                        const safeCodeLines = codeLines.map((l) => this.toWinAnsiSafeText(l, courier, fontSize * 0.9));
                        const maxCodeWidth = Math.max(...safeCodeLines.map(l => courier.widthOfTextAtSize(l, fontSize * 0.9)));

                        if (y - codeBlockHeight < marginBottom) {
                            page = createPage();
                            y = pageHeight - marginTop;
                        }

                        const codeBlockWidth = Math.min(maxCodeWidth + 20, contentWidth);
                        page.drawRectangle({
                            x: marginLeft,
                            y: y - codeBlockHeight,
                            width: codeBlockWidth,
                            height: codeBlockHeight,
                            color: rgb(codeBg.r, codeBg.g, codeBg.b),
                            borderColor: rgb(textCol.r * 0.5, textCol.g * 0.5, textCol.b * 0.5),
                            borderWidth: 0.5
                        });

                        if (line.language) {
                            const languageText = this.toWinAnsiSafeText(line.language.toUpperCase(), helveticaBold, fontSize * 0.75);
                            page.drawText(languageText, {
                                x: marginLeft + 8,
                                y: y - (fontSize * 0.8),
                                size: fontSize * 0.75,
                                font: helveticaBold,
                                color: rgb(textCol.r * 0.8, textCol.g * 0.8, textCol.b * 0.8),
                            });
                        }

                        let codeY = y - fontSize - codeHeaderHeight;
                        for (const codeLine of safeCodeLines) {
                            page.drawText(codeLine, {
                                x: marginLeft + 8,
                                y: codeY,
                                size: fontSize * 0.9,
                                font: courier,
                                color: rgb(textCol.r, textCol.g, textCol.b)
                            });
                            codeY -= lineHeight;
                        }
                        y = codeY - fontSize;
                        break;

                    case 'blockquote':
                        y -= fontSize * 0.3;
                        if (line.runs && line.runs.length > 0) {
                            // Draw quote border
                            page.drawRectangle({
                                x: marginLeft,
                                y: y - lineHeight,
                                width: 3,
                                height: lineHeight,
                                color: rgb(accent.r, accent.g, accent.b)
                            });
                            const formatted = this.drawFormattedText(page, line.runs, marginLeft + 12, y, fontSize, lineHeight, marginBottom, marginTop, pageHeight, createPage, helvetica, helveticaBold, helveticaOblique, helveticaBoldOblique, courier, accent, textCol, codeBg, contentWidth - 12, rgb);
                            page = formatted.page;
                            y = formatted.y;
                        }
                        y -= fontSize * 0.5;
                        break;

                    case 'list':
                        if (line.items) {
                            for (const item of line.items) {
                                y -= fontSize * 0.2;
                                if (y < marginBottom) { page = createPage(); y = pageHeight - marginTop; }
                                page.drawText('•', { x: marginLeft, y, size: fontSize, font: helveticaBold, color: rgb(accent.r, accent.g, accent.b) });

                                const itemRuns = parser.parseInlineFormatting(item);
                                const formatted = this.drawFormattedText(page, itemRuns, marginLeft + 15, y, fontSize, lineHeight, marginBottom, marginTop, pageHeight, createPage, helvetica, helveticaBold, helveticaOblique, helveticaBoldOblique, courier, accent, textCol, codeBg, contentWidth - 15, rgb);
                                page = formatted.page;
                                y = formatted.y;
                            }
                        }
                        y -= fontSize * 0.3;
                        break;

                    case 'orderedList':
                        if (line.items) {
                            let num = 1;
                            for (const item of line.items) {
                                y -= fontSize * 0.2;
                                if (y < marginBottom) { page = createPage(); y = pageHeight - marginTop; }
                                page.drawText(num + '.', { x: marginLeft, y, size: fontSize, font: helveticaBold, color: rgb(accent.r, accent.g, accent.b) });

                                const itemRuns = parser.parseInlineFormatting(item);
                                const formatted = this.drawFormattedText(page, itemRuns, marginLeft + 20, y, fontSize, lineHeight, marginBottom, marginTop, pageHeight, createPage, helvetica, helveticaBold, helveticaOblique, helveticaBoldOblique, courier, accent, textCol, codeBg, contentWidth - 20, rgb);
                                page = formatted.page;
                                y = formatted.y;
                                num++;
                            }
                        }
                        y -= fontSize * 0.3;
                        break;

                    case 'tableRow':
                        if (line.cells && line.cells.length > 0) {
                            const colWidth = contentWidth / line.cells.length;
                            const wrappedCells = line.cells.map((cell) =>
                                this.wrapText(cell, helvetica, fontSize, colWidth - 10)
                            );
                            const maxCellLines = Math.max(...wrappedCells.map((lines) => Math.max(lines.length, 1)));
                            const rowHeight = Math.max(lineHeight, maxCellLines * lineHeight + 8);

                            if (y - rowHeight < marginBottom) {
                                page = createPage();
                                y = pageHeight - marginTop;
                            }

                            for (let j = 0; j < line.cells.length; j++) {
                                const x = marginLeft + j * colWidth;

                                page.drawRectangle({
                                    x,
                                    y: y - rowHeight,
                                    width: colWidth,
                                    height: rowHeight,
                                    borderColor: rgb(textCol.r * 0.5, textCol.g * 0.5, textCol.b * 0.5),
                                    borderWidth: 0.5
                                });

                                const cellLines = wrappedCells[j];
                                for (let lineIndex = 0; lineIndex < cellLines.length; lineIndex++) {
                                    const cellLine = cellLines[lineIndex];
                                    const textY = y - fontSize - (lineIndex * lineHeight);
                                    if (textY < y - rowHeight + 2) break;
                                    page.drawText(cellLine, {
                                        x: x + 5,
                                        y: textY,
                                        size: fontSize,
                                        font: helvetica,
                                        color: rgb(textCol.r, textCol.g, textCol.b)
                                    });
                                }
                            }
                            y -= rowHeight;
                        }
                        break;

                    case 'hr':
                        y -= fontSize * 0.5;
                        page.drawLine({
                            start: { x: marginLeft, y },
                            end: { x: pageWidth - marginRight, y },
                            thickness: 1,
                            color: rgb(textCol.r * 0.5, textCol.g * 0.5, textCol.b * 0.5)
                        });
                        y -= fontSize;
                        break;

                    case 'image':
                        if (!options.embedImages) {
                            if (line.altText) {
                                page.drawText(`[Image omitted: ${line.altText}]`, {
                                    x: marginLeft,
                                    y: y - fontSize,
                                    size: fontSize * 0.9,
                                    font: helveticaOblique,
                                    color: rgb(textCol.r * 0.7, textCol.g * 0.7, textCol.b * 0.7)
                                });
                                y -= fontSize * 2;
                            }
                            break;
                        }
                        // Embed image in PDF
                        if (line.imageUrl) {
                            try {
                                // Fetch image data
                                const response = await fetch(line.imageUrl);
                                if (!response.ok) {
                                    throw new Error(`Image request failed with ${response.status}`);
                                }
                                const contentLength = Number(response.headers.get('content-length') || 0);
                                if (contentLength > PdfExporter.MAX_IMAGE_BYTES) {
                                    throw new Error(`Image too large (${Math.round(contentLength / 1024 / 1024)}MB)`);
                                }

                                const imageBlob = await response.blob();
                                if (imageBlob.size > PdfExporter.MAX_IMAGE_BYTES) {
                                    throw new Error(`Image too large (${Math.round(imageBlob.size / 1024 / 1024)}MB)`);
                                }

                                if (totalEmbeddedImageBytes + imageBlob.size > PdfExporter.MAX_TOTAL_IMAGE_BYTES) {
                                    throw new Error('Total embedded image size limit exceeded');
                                }
                                totalEmbeddedImageBytes += imageBlob.size;

                                const arrayBuffer = await imageBlob.arrayBuffer();

                                // Determine image type and embed
                                let embeddedImage;
                                const contentType = response.headers.get('content-type');

                                if (contentType?.includes('png')) {
                                    embeddedImage = await pdfDoc.embedPng(arrayBuffer);
                                } else if (contentType?.includes('jpeg') || contentType?.includes('jpg')) {
                                    embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
                                } else {
                                    // Try PNG as fallback
                                    try {
                                        embeddedImage = await pdfDoc.embedPng(arrayBuffer);
                                    } catch {
                                        console.warn('Unsupported image format:', line.imageUrl);
                                        // Draw alt text instead
                                        const safeImageLabel = this.toWinAnsiSafeText(`[Image: ${line.altText || 'No description'}]`, helveticaOblique, fontSize);
                                        page.drawText(safeImageLabel, {
                                            x: marginLeft,
                                            y: y - fontSize,
                                            size: fontSize,
                                            font: helveticaOblique,
                                            color: rgb(textCol.r * 0.6, textCol.g * 0.6, textCol.b * 0.6)
                                        });
                                        y -= fontSize * 2;
                                        break;
                                    }
                                }

                                // Calculate dimensions to fit page width
                                const imageScale = Math.min(1, contentWidth / embeddedImage.width);
                                const imgWidth = embeddedImage.width * imageScale;
                                const imgHeight = embeddedImage.height * imageScale;

                                // Check if we need a new page
                                if (y - imgHeight < marginBottom) {
                                    page = createPage();
                                    y = pageHeight - marginTop;
                                }

                                // Draw image centered
                                page.drawImage(embeddedImage, {
                                    x: marginLeft + (contentWidth - imgWidth) / 2,
                                    y: y - imgHeight,
                                    width: imgWidth,
                                    height: imgHeight,
                                });

                                // Add alt text below image if exists
                                if (line.altText) {
                                    const safeAltText = this.toWinAnsiSafeText(line.altText, helveticaOblique, fontSize * 0.9);
                                    page.drawText(safeAltText, {
                                        x: marginLeft,
                                        y: y - imgHeight - fontSize - 5,
                                        size: fontSize * 0.9,
                                        font: helveticaOblique,
                                        color: rgb(textCol.r * 0.7, textCol.g * 0.7, textCol.b * 0.7)
                                    });
                                    y -= imgHeight + fontSize * 2.5;
                                } else {
                                    y -= imgHeight + fontSize;
                                }
                            } catch (error) {
                                console.warn('Failed to load image:', line.imageUrl, error);
                                // Draw placeholder for failed images
                                page.drawRectangle({
                                    x: marginLeft,
                                    y: y - 50,
                                    width: contentWidth,
                                    height: 50,
                                    borderColor: rgb(textCol.r * 0.3, textCol.g * 0.3, textCol.b * 0.3),
                                    borderWidth: 1,
                                });
                                const safeFailureLabel = this.toWinAnsiSafeText(`[Image failed to load: ${line.altText || line.imageUrl}]`, helveticaOblique, fontSize * 0.85);
                                page.drawText(safeFailureLabel, {
                                    x: marginLeft + 10,
                                    y: y - 30,
                                    size: fontSize * 0.85,
                                    font: helveticaOblique,
                                    color: rgb(textCol.r * 0.5, textCol.g * 0.5, textCol.b * 0.5)
                                });
                                y -= 60;
                            }
                        }
                        break;

                    case 'empty':
                        y -= fontSize * 0.5;
                        break;
                }
            }

            if (onProgress) onProgress(100);

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: this.mimeType });

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

            return { blob, filename, mimeType: this.mimeType, size: blob.size, duration };

        } catch (error) {
            console.error('PDF export failed:', error);
            throw new Error(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private drawFormattedText(
        page: PDFPage, runs: TextRun[], x: number, y: number, fontSize: number, lineHeight: number,
        bottomMargin: number, topMargin: number, pageHeight: number, createPage: () => PDFPage,
        helvetica: PDFFont, helveticaBold: PDFFont, helveticaOblique: PDFFont, helveticaBoldOblique: PDFFont, courier: PDFFont,
        accent: PdfColor, textCol: PdfColor, codeBg: PdfColor, maxWidth: number, rgb: PdfRgbFactory
    ): { page: PDFPage; y: number } {
        let currentX = x;
        let currentY = y;

        for (const run of runs) {
            let font = helvetica;
            if (run.bold && run.italic) font = helveticaBoldOblique;
            else if (run.bold) font = helveticaBold;
            else if (run.italic) font = helveticaOblique;
            else if (run.code) font = courier;

            const color = run.code ? rgb(accent.r, accent.g, accent.b) : rgb(textCol.r, textCol.g, textCol.b);
            const safeRunText = this.toWinAnsiSafeText(run.text, font, fontSize);

            // Handle line wrapping for this run
            const words = safeRunText.split(/(\s+)/);
            for (const word of words) {
                if (!word) continue;
                const wordWidth = font.widthOfTextAtSize(word, fontSize);

                if (currentX + wordWidth > x + maxWidth && currentX > x) {
                    currentX = x;
                    currentY -= lineHeight;
                    if (currentY < bottomMargin) {
                        page = createPage();
                        currentY = pageHeight - topMargin;
                    }
                }

                if (run.code) {
                    page.drawRectangle({
                        x: currentX - 2,
                        y: currentY - 2,
                        width: wordWidth + 4,
                        height: fontSize + 4,
                        color: rgb(codeBg.r, codeBg.g, codeBg.b)
                    });
                }

                page.drawText(word, {
                    x: currentX,
                    y: currentY,
                    size: fontSize,
                    font,
                    color
                });

                currentX += wordWidth;
            }
        }

        return { page, y: currentY - lineHeight };
    }

    /**
     * Standard PDF fonts in pdf-lib use WinAnsi encoding and can throw for unsupported characters.
     * Normalize line breaks and replace unsupported glyphs with safe fallbacks.
     */
    private toWinAnsiSafeText(text: string, font: PDFFont, fontSize: number): string {
        const normalized = (text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        let safe = '';

        for (const ch of normalized) {
            // Keep visual flow stable: force hard line breaks to become spaces for inline runs.
            const source = ch === '\n' ? ' ' : ch;
            const cached = this.fontCharCache.get(source);
            if (cached !== undefined) {
                safe += cached;
                continue;
            }

            try {
                font.widthOfTextAtSize(source, fontSize);
                this.fontCharCache.set(source, source);
                safe += source;
            } catch {
                this.fontCharCache.set(source, '?');
                safe += '?';
            }
        }

        return safe;
    }

    private wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
        if (!text) return [''];

        const safeText = this.toWinAnsiSafeText(text, font, fontSize);
        const words = safeText.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            if (!word) continue;

            const testLine = currentLine ? currentLine + ' ' + word : word;
            const width = font.widthOfTextAtSize(testLine, fontSize);

            if (width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) lines.push(currentLine);
        return lines.length ? lines : [''];
    }

    private hexToRgb(hex: string): { r: number; g: number; b: number } {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#000000');
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : { r: 0, g: 0, b: 0 };
    }
}
