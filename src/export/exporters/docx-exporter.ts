import type { IExporter, ExportInput, ExportResult, ExportFormat, ThemeTokens } from '../types';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, ShadingType, Table, TableRow, TableCell, WidthType } from 'docx';

interface MarkdownLine {
    type: string;
    content: string;
    level?: number;
    language?: string;
    items?: string[];
    cells?: string[][];
}

class MarkdownParser {
    parse(markdown: string): MarkdownLine[] {
        const lines = markdown.split('\n');
        const result: MarkdownLine[] = [];
        let inCodeBlock = false;
        let codeContent = '';
        let codeLanguage = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.startsWith('```') || line.startsWith('~~~')) {
                if (!inCodeBlock) {
                    inCodeBlock = true;
                    codeLanguage = line.slice(3).trim();
                    codeContent = '';
                } else {
                    result.push({ type: 'code', content: codeContent, language: codeLanguage });
                    inCodeBlock = false;
                    codeLanguage = '';
                }
                continue;
            }

            if (inCodeBlock) {
                codeContent += (codeContent ? '\n' : '') + line;
                continue;
            }

            if (line.startsWith('# ')) {
                result.push({ type: 'h1', content: line.slice(2) });
            } else if (line.startsWith('## ')) {
                result.push({ type: 'h2', content: line.slice(3) });
            } else if (line.startsWith('### ')) {
                result.push({ type: 'h3', content: line.slice(4) });
            } else if (line.startsWith('#### ')) {
                result.push({ type: 'h4', content: line.slice(5) });
            } else if (line.startsWith('##### ')) {
                result.push({ type: 'h5', content: line.slice(6) });
            } else if (line.startsWith('###### ')) {
                result.push({ type: 'h6', content: line.slice(7) });
            } else if (line.startsWith('> ')) {
                result.push({ type: 'blockquote', content: line.slice(2) });
            } else if (line.match(/^[-*+]\s/)) {
                result.push({ type: 'list', content: line.slice(2), items: [line.slice(2)] });
            } else if (line.match(/^\d+\.\s/)) {
                result.push({ type: 'orderedList', content: line.replace(/^\d+\.\s/, ''), items: [line.replace(/^\d+\.\s/, '')] });
            } else if (line.match(/^\|/) && line.match(/\|$/)) {
                const cells = line.split('|').filter((c, idx) => idx !== 0 && idx !== line.split('|').length - 1).map(c => c.trim());
                if (!line.match(/^[\s|-]+$/)) {
                    const tableRow: string[] = [];
                    for (const cell of cells) {
                        tableRow.push(cell);
                    }
                    const lastRow = result[result.length - 1];
                    if (lastRow && lastRow.type === 'table') {
                        lastRow.cells?.push(tableRow);
                    } else {
                        result.push({ type: 'table', content: '', cells: [tableRow] });
                    }
                }
            } else if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
                result.push({ type: 'hr', content: '' });
            } else if (line.trim() !== '') {
                result.push({ type: 'p', content: line });
            }
        }

        return this.mergeLists(result);
    }

    private mergeLists(lines: MarkdownLine[]): MarkdownLine[] {
        const result: MarkdownLine[] = [];
        let currentList: MarkdownLine | null = null;

        for (const line of lines) {
            if (line.type === 'list') {
                if (currentList && currentList.type === 'list') {
                    currentList.items?.push(line.content);
                } else {
                    if (currentList) result.push(currentList);
                    currentList = { type: 'list', content: '', items: [line.content] };
                }
            } else if (line.type === 'orderedList') {
                if (currentList && currentList.type === 'orderedList') {
                    currentList.items?.push(line.content);
                } else {
                    if (currentList) result.push(currentList);
                    currentList = { type: 'orderedList', content: '', items: [line.content] };
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

export class DocxExporter implements IExporter {
    format: ExportFormat = 'docx';
    extension = '.docx';
    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    label = 'DOCX';
    icon = '📄';

    supportsTheme = true;
    supportsEditing = false;
    supportsImages: boolean = true;

    async export(input: ExportInput): Promise<ExportResult> {
        const start = performance.now();
        const { markdown, theme } = input;

        const parser = new MarkdownParser();
        const parsed = parser.parse(markdown);

        const children: any[] = [];
        const accentColor = this.hexToRgb(theme.ui.accent);
        const textColor = this.hexToRgb(theme.preview.foreground);
        const codeBgColor = this.hexToRgb(theme.editor.background);

        for (const line of parsed) {
            switch (line.type) {
                case 'h1':
                    children.push(
                        new Paragraph({
                            text: line.content,
                            heading: HeadingLevel.HEADING_1,
                            spacing: { before: 400, after: 200 },
                            style: 'heading1'
                        })
                    );
                    break;
                case 'h2':
                    children.push(
                        new Paragraph({
                            text: line.content,
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 300, after: 150 },
                            style: 'heading2'
                        })
                    );
                    break;
                case 'h3':
                    children.push(
                        new Paragraph({
                            text: line.content,
                            heading: HeadingLevel.HEADING_3,
                            spacing: { before: 200, after: 100 },
                            style: 'heading3'
                        })
                    );
                    break;
                case 'h4':
                case 'h5':
                case 'h6':
                    children.push(
                        new Paragraph({
                            text: line.content,
                            heading: HeadingLevel.HEADING_4,
                            spacing: { before: 150, after: 100 }
                        })
                    );
                    break;
                case 'p':
                    const runs = this.parseInlineFormatting(line.content, textColor, accentColor, codeBgColor);
                    if (runs.length > 0) {
                        children.push(
                            new Paragraph({
                                children: runs,
                                spacing: { before: 100, after: 100 }
                            })
                        );
                    }
                    break;
                case 'code':
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: line.content,
                                    font: 'Courier New',
                                    size: 20,
                                    shading: { fill: this.rgbToHex(codeBgColor) }
                                })
                            ],
                            spacing: { before: 150, after: 150 },
                            indent: { left: 720 }
                        })
                    );
                    break;
                case 'blockquote':
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: line.content,
                                    italics: true,
                                    color: this.rgbToHex({ r: textColor.r * 0.8, g: textColor.g * 0.8, b: textColor.b * 0.8 })
                                })
                            ],
                            spacing: { before: 150, after: 150 },
                            indent: { left: 720 },
                    border: {
                        left: { color: this.rgbToHex(accentColor), space: 0, style: BorderStyle.SINGLE, size: 6 },
                        top: undefined,
                        bottom: undefined,
                        right: undefined
                    }
                        })
                    );
                    break;
                case 'list':
                    if (line.items) {
                        for (const item of line.items) {
                            children.push(
                                new Paragraph({
                                    text: item,
                                    bullet: { level: 0 },
                                    spacing: { before: 50, after: 50 },
                                    indent: { left: 720 }
                                })
                            );
                        }
                    }
                    break;
                case 'orderedList':
                    if (line.items) {
                        let num = 1;
                        for (const item of line.items) {
                            children.push(
                                new Paragraph({
                                    text: item,
                                    numbering: {
                                        reference: 'ordered-list',
                                        level: 0
                                    },
                                    spacing: { before: 50, after: 50 },
                                    indent: { left: 720 }
                                })
                            );
                            num++;
                        }
                    }
                    break;
                case 'table':
                    if (line.cells && line.cells.length > 0) {
                        const tableRows = line.cells.map(row => 
                            new TableRow({
                                children: row.map(cell => 
                                    new TableCell({
                                        children: [
                                            new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: cell,
                                                        bold: false
                                                    })
                                                ]
                                            })
                                        ]
                                    })
                                )
                            })
                        );
                        children.push(
                            new Table({
                                rows: tableRows,
                                width: { size: 100, type: WidthType.PERCENTAGE }
                            })
                        );
                    }
                    break;
                case 'hr':
                    children.push(
                        new Paragraph({
                            text: '',
                            border: {
                                bottom: { color: 'auto', space: 0, style: BorderStyle.SINGLE, size: 6 }
                            },
                            spacing: { before: 200, after: 200 }
                        })
                    );
                    break;
            }
        }

        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: children
                }
            ]
        });

        const buffer = await Packer.toBuffer(doc);
        const blob = new Blob([buffer] as BlobPart[], { type: this.mimeType });
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

    private parseInlineFormatting(text: string, textColor: { r: number; g: number; b: number }, accentColor: { r: number; g: number; b: number }, codeBgColor: { r: number; g: number; b: number }): TextRun[] {
        const runs: TextRun[] = [];
        let remaining = text;

        while (remaining.length > 0) {
            const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
            const italicMatch = remaining.match(/\*([^*]+)\*/);
            const codeMatch = remaining.match(/`([^`]+)`/);

            let nextMatch: RegExpMatchArray | null = null;
            let matchType = '';
            let matchIndex = Infinity;

            if (boldMatch && boldMatch.index !== undefined) {
                nextMatch = boldMatch;
                matchType = 'bold';
                matchIndex = boldMatch.index;
            }

            if (italicMatch && italicMatch.index !== undefined && italicMatch.index < matchIndex) {
                nextMatch = italicMatch;
                matchType = 'italic';
                matchIndex = italicMatch.index;
            }

            if (codeMatch && codeMatch.index !== undefined && codeMatch.index < matchIndex) {
                nextMatch = codeMatch;
                matchType = 'code';
                matchIndex = codeMatch.index;
            }

            if (matchIndex > 0) {
                runs.push(
                    new TextRun({
                        text: remaining.slice(0, matchIndex),
                        color: this.rgbToHex(textColor)
                    })
                );
            }

            if (nextMatch) {
                const textContent = nextMatch[1];
                
                if (matchType === 'bold') {
                    runs.push(
                        new TextRun({
                            text: textContent,
                            bold: true,
                            color: this.rgbToHex(textColor)
                        })
                    );
                } else if (matchType === 'italic') {
                    runs.push(
                        new TextRun({
                            text: textContent,
                            italics: true,
                            color: this.rgbToHex(textColor)
                        })
                    );
                } else if (matchType === 'code') {
                    runs.push(
                        new TextRun({
                            text: textContent,
                            font: 'Courier New',
                            shading: { fill: this.rgbToHex(codeBgColor) },
                            color: this.rgbToHex(accentColor)
                        })
                    );
                }

                remaining = remaining.slice(matchIndex + nextMatch[0].length);
            } else {
                if (remaining.length > 0) {
                    runs.push(
                        new TextRun({
                            text: remaining,
                            color: this.rgbToHex(textColor)
                        })
                    );
                }
                break;
            }
        }

        return runs.length > 0 ? runs : [new TextRun({ text: '', color: this.rgbToHex(textColor) })];
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
        return `${r}${g}${b}`;
    }
}
