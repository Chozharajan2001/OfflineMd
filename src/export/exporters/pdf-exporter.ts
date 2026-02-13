import type { IExporter, ExportInput, ExportResult, ExportFormat, ThemeTokens, ExportOptions } from '../types';

interface TextRun {
    text: string;
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
    link?: string;
}

interface ParsedLine {
    type: 'heading1' | 'heading2' | 'heading3' | 'heading4' | 'paragraph' | 'code' | 'blockquote' | 'list' | 'orderedList' | 'tableRow' | 'hr' | 'empty';
    content?: string;
    runs?: TextRun[];
    items?: string[];
    cells?: string[];
}

class MarkdownParser {
    parse(markdown: string): ParsedLine[] {
        const lines = markdown.split('\n');
        const result: ParsedLine[] = [];
        let inCodeBlock = false;
        let codeContent: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.startsWith('```') || line.startsWith('~~~')) {
                if (!inCodeBlock) {
                    inCodeBlock = true;
                    codeContent = [];
                } else {
                    result.push({ type: 'code', content: codeContent.join('\n') });
                    inCodeBlock = false;
                }
                continue;
            }

            if (inCodeBlock) {
                codeContent.push(line);
                continue;
            }

            if (line.startsWith('# ')) {
                result.push({ type: 'heading1', content: line.slice(2) });
            } else if (line.startsWith('## ')) {
                result.push({ type: 'heading2', content: line.slice(3) });
            } else if (line.startsWith('### ')) {
                result.push({ type: 'heading3', content: line.slice(4) });
            } else if (line.startsWith('#### ')) {
                result.push({ type: 'heading4', content: line.slice(5) });
            } else if (line.startsWith('> ')) {
                result.push({ type: 'blockquote', runs: this.parseInlineFormatting(line.slice(2)) });
            } else if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('+ ')) {
                result.push({ type: 'list', content: line.slice(2) });
            } else if (/^\d+\.\s/.test(line)) {
                result.push({ type: 'orderedList', content: line.replace(/^\d+\.\s/, '') });
            } else if (line.startsWith('|') && line.endsWith('|')) {
                const cells = line.split('|').filter((c, idx) => idx !== 0 && idx !== line.split('|').length - 1).map(c => c.trim());
                if (cells.length > 0 && !line.match(/^[\s|:|-]+$/)) {
                    result.push({ type: 'tableRow', cells });
                }
            } else if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
                result.push({ type: 'hr' });
            } else if (line.trim() === '') {
                result.push({ type: 'empty' });
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
    supportsImages: boolean = true;

    async export(input: ExportInput): Promise<ExportResult> {
        const start = performance.now();
        const { markdown, theme, options } = input;

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

        const marginMM = options.margins?.left || 20;
        const margin = marginMM * 2.83465;
        const contentWidth = pageWidth - margin * 2;

        let page = pdfDoc.addPage();
        page.setSize(pageWidth, pageHeight);
        let y = pageHeight - margin;

        const accent = this.hexToRgb(theme.ui.accent);
        const textCol = this.hexToRgb(theme.preview.foreground);
        const codeBg = this.hexToRgb(theme.editor.background);

        const fontSize = options.fontSize || 12;
        const lineHeight = fontSize * 1.6;

        const parser = new MarkdownParser();
        const parsed = parser.parse(markdown);

        for (const line of parsed) {
            if (y < margin + 50) {
                page = pdfDoc.addPage();
                page.setSize(pageWidth, pageHeight);
                y = pageHeight - margin;
            }

            switch (line.type) {
                case 'heading1':
                    y -= fontSize * 0.5;
                    const h1Lines = this.wrapText(line.content || '', helveticaBold, 28, contentWidth);
                    for (const txt of h1Lines) {
                        if (y < margin) { page = pdfDoc.addPage(); page.setSize(pageWidth, pageHeight); y = pageHeight - margin; }
                        page.drawText(txt, { x: margin, y, size: 28, font: helveticaBold, color: rgb(accent.r, accent.g, accent.b) });
                        y -= lineHeight * 1.5;
                    }
                    y -= lineHeight * 0.5;
                    break;

                case 'heading2':
                    y -= fontSize * 0.3;
                    const h2Lines = this.wrapText(line.content || '', helveticaBold, 22, contentWidth);
                    for (const txt of h2Lines) {
                        if (y < margin) { page = pdfDoc.addPage(); page.setSize(pageWidth, pageHeight); y = pageHeight - margin; }
                        page.drawText(txt, { x: margin, y, size: 22, font: helveticaBold, color: rgb(textCol.r, textCol.g, textCol.b) });
                        y -= lineHeight * 1.3;
                    }
                    y -= lineHeight * 0.3;
                    break;

                case 'heading3':
                    y -= fontSize * 0.3;
                    const h3Lines = this.wrapText(line.content || '', helveticaBold, 18, contentWidth);
                    for (const txt of h3Lines) {
                        if (y < margin) { page = pdfDoc.addPage(); page.setSize(pageWidth, pageHeight); y = pageHeight - margin; }
                        page.drawText(txt, { x: margin, y, size: 18, font: helveticaBold, color: rgb(textCol.r, textCol.g, textCol.b) });
                        y -= lineHeight * 1.2;
                    }
                    y -= lineHeight * 0.2;
                    break;

                case 'heading4':
                    y -= fontSize * 0.2;
                    const h4Lines = this.wrapText(line.content || '', helveticaBold, 15, contentWidth);
                    for (const txt of h4Lines) {
                        if (y < margin) { page = pdfDoc.addPage(); page.setSize(pageWidth, pageHeight); y = pageHeight - margin; }
                        page.drawText(txt, { x: margin, y, size: 15, font: helveticaBold, color: rgb(textCol.r, textCol.g, textCol.b) });
                        y -= lineHeight;
                    }
                    y -= lineHeight * 0.2;
                    break;

                case 'paragraph':
                    y -= fontSize * 0.3;
                    if (line.runs && line.runs.length > 0) {
                        y = this.drawFormattedText(page, line.runs, margin, y, fontSize, lineHeight, margin, pageWidth, pageHeight, pdfDoc, helvetica, helveticaBold, helveticaOblique, helveticaBoldOblique, courier, accent, textCol, codeBg, contentWidth, rgb);
                    }
                    y -= fontSize * 0.5;
                    break;

                case 'code':
                    y -= fontSize * 0.3;
                    const codeLines = (line.content || '').split('\n');
                    const codeBlockHeight = codeLines.length * lineHeight + 10;
                    const maxCodeWidth = Math.max(...codeLines.map(l => courier.widthOfTextAtSize(l, fontSize * 0.9)));

                    if (y - codeBlockHeight < margin) {
                        page = pdfDoc.addPage();
                        page.setSize(pageWidth, pageHeight);
                        y = pageHeight - margin;
                    }

                    const codeBlockWidth = Math.min(maxCodeWidth + 20, contentWidth);
                    page.drawRectangle({
                        x: margin,
                        y: y - codeBlockHeight,
                        width: codeBlockWidth,
                        height: codeBlockHeight,
                        color: rgb(codeBg.r, codeBg.g, codeBg.b),
                        borderColor: rgb(textCol.r * 0.5, textCol.g * 0.5, textCol.b * 0.5),
                        borderWidth: 0.5
                    });

                    let codeY = y - fontSize;
                    for (const codeLine of codeLines) {
                        page.drawText(codeLine, {
                            x: margin + 8,
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
                            x: margin,
                            y: y - lineHeight,
                            width: 3,
                            height: lineHeight,
                            color: rgb(accent.r, accent.g, accent.b)
                        });
                        y = this.drawFormattedText(page, line.runs, margin + 12, y, fontSize, lineHeight, margin, pageWidth, pageHeight, pdfDoc, helvetica, helveticaBold, helveticaOblique, helveticaBoldOblique, courier, accent, textCol, codeBg, contentWidth - 12, rgb);
                    }
                    y -= fontSize * 0.5;
                    break;

                case 'list':
                    if (line.items) {
                        for (const item of line.items) {
                            y -= fontSize * 0.2;
                            if (y < margin) { page = pdfDoc.addPage(); page.setSize(pageWidth, pageHeight); y = pageHeight - margin; }
                            page.drawText('•', { x: margin, y, size: fontSize, font: helveticaBold, color: rgb(accent.r, accent.g, accent.b) });
                            
                            const itemRuns = parser.parseInlineFormatting(item);
                            y = this.drawFormattedText(page, itemRuns, margin + 15, y, fontSize, lineHeight, margin, pageWidth, pageHeight, pdfDoc, helvetica, helveticaBold, helveticaOblique, helveticaBoldOblique, courier, accent, textCol, codeBg, contentWidth - 15, rgb);
                        }
                    }
                    y -= fontSize * 0.3;
                    break;

                case 'orderedList':
                    if (line.items) {
                        let num = 1;
                        for (const item of line.items) {
                            y -= fontSize * 0.2;
                            if (y < margin) { page = pdfDoc.addPage(); page.setSize(pageWidth, pageHeight); y = pageHeight - margin; }
                            page.drawText(num + '.', { x: margin, y, size: fontSize, font: helveticaBold, color: rgb(accent.r, accent.g, accent.b) });
                            
                            const itemRuns = parser.parseInlineFormatting(item);
                            y = this.drawFormattedText(page, itemRuns, margin + 20, y, fontSize, lineHeight, margin, pageWidth, pageHeight, pdfDoc, helvetica, helveticaBold, helveticaOblique, helveticaBoldOblique, courier, accent, textCol, codeBg, contentWidth - 20, rgb);
                            num++;
                        }
                    }
                    y -= fontSize * 0.3;
                    break;

                case 'tableRow':
                    if (line.cells && line.cells.length > 0) {
                        const colWidth = contentWidth / line.cells.length;
                        const rowHeight = lineHeight;

                        for (let j = 0; j < line.cells.length; j++) {
                            const cellText = line.cells[j];
                            const x = margin + j * colWidth;

                            page.drawRectangle({
                                x,
                                y: y - rowHeight,
                                width: colWidth,
                                height: rowHeight,
                                borderColor: rgb(textCol.r * 0.5, textCol.g * 0.5, textCol.b * 0.5),
                                borderWidth: 0.5
                            });

                            const cellLines = this.wrapText(cellText, helvetica, fontSize, colWidth - 10);
                            if (cellLines.length > 0) {
                                page.drawText(cellLines[0], {
                                    x: x + 5,
                                    y: y - fontSize,
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
                        start: { x: margin, y },
                        end: { x: pageWidth - margin, y },
                        thickness: 1,
                        color: rgb(textCol.r * 0.5, textCol.g * 0.5, textCol.b * 0.5)
                    });
                    y -= fontSize;
                    break;

                case 'empty':
                    y -= fontSize * 0.5;
                    break;
            }
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes] as BlobPart[], { type: this.mimeType });
        const filename = 'document' + this.extension;
        const duration = performance.now() - start;

        return { blob, filename, mimeType: this.mimeType, size: blob.size, duration };
    }

    private drawFormattedText(
        page: any, runs: TextRun[], x: number, y: number, fontSize: number, lineHeight: number,
        margin: number, pageWidth: number, pageHeight: number, pdfDoc: any,
        helvetica: any, helveticaBold: any, helveticaOblique: any, helveticaBoldOblique: any, courier: any,
        accent: any, textCol: any, codeBg: any, maxWidth: number, rgbFunc: any
    ): number {
        let currentX = x;
        let currentY = y;

        for (const run of runs) {
            let font = helvetica;
            if (run.bold && run.italic) font = helveticaBoldOblique;
            else if (run.bold) font = helveticaBold;
            else if (run.italic) font = helveticaOblique;
            else if (run.code) font = courier;

            const color = run.code ? rgbFunc(accent.r, accent.g, accent.b) : rgbFunc(textCol.r, textCol.g, textCol.b);

            // Handle line wrapping for this run
            const words = run.text.split(/(\s+)/);
            for (const word of words) {
                const wordWidth = font.widthOfTextAtSize(word, fontSize);
                
                if (currentX + wordWidth > x + maxWidth && currentX > x) {
                    currentX = x;
                    currentY -= lineHeight;
                    if (currentY < margin) {
                        page = pdfDoc.addPage();
                        page.setSize(pageWidth, pageHeight);
                        currentY = pageHeight - margin;
                    }
                }

                if (run.code) {
                    page.drawRectangle({
                        x: currentX - 2,
                        y: currentY - 2,
                        width: wordWidth + 4,
                        height: fontSize + 4,
                        color: rgbFunc(codeBg.r, codeBg.g, codeBg.b)
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

        return currentY - lineHeight;
    }

    private wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
        if (!text) return [''];
        
        const words = text.split(' ');
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
