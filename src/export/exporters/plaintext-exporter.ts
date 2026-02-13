import type { IExporter, ExportInput, ExportResult, ExportFormat } from '../types';

class MarkdownToPlainText {
    convert(markdown: string): string {
        const lines = markdown.split('\n');
        const result: string[] = [];
        let inCodeBlock = false;
        let codeLanguage = '';
        let codeContent = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.startsWith('```') || line.startsWith('~~~')) {
                if (!inCodeBlock) {
                    inCodeBlock = true;
                    codeLanguage = line.slice(3).trim();
                    codeContent = '';
                } else {
                    result.push('');
                    result.push(`[Code Block${codeLanguage ? ` (${codeLanguage})` : ''}]`);
                    result.push(codeContent);
                    result.push('[End Code Block]');
                    result.push('');
                    inCodeBlock = false;
                    codeLanguage = '';
                }
                continue;
            }

            if (inCodeBlock) {
                codeContent += line;
                continue;
            }

            if (line.startsWith('# ')) {
                result.push('');
                result.push(line.slice(2).toUpperCase());
                result.push('='.repeat(line.slice(2).length));
                result.push('');
            } else if (line.startsWith('## ')) {
                result.push('');
                result.push(line.slice(3));
                result.push('-'.repeat(line.slice(3).length));
                result.push('');
            } else if (line.startsWith('### ')) {
                result.push('');
                result.push('*** ' + line.slice(4) + ' ***');
                result.push('');
            } else if (line.startsWith('#### ')) {
                result.push('');
                result.push('** ' + line.slice(5) + ' **');
                result.push('');
            } else if (line.startsWith('> ')) {
                result.push('  | ' + line.slice(2));
            } else if (line.match(/^[-*+]\s/)) {
                result.push('  • ' + line.slice(2));
            } else if (line.match(/^\d+\.\s/)) {
                const match = line.match(/^(\d+)\.\s(.*)/);
                if (match) {
                    result.push('  ' + match[1] + '. ' + match[2]);
                }
            } else if (line.match(/^\|/) && line.match(/\|$/)) {
                if (!line.match(/^[\s|-]+$/)) {
                    const cells = line.split('|').filter((c, idx) => idx !== 0 && idx !== line.split('|').length - 1).map(c => c.trim());
                    result.push('  ' + cells.join('  |  '));
                }
            } else if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
                result.push('');
                result.push('---');
                result.push('');
            } else if (line.trim() !== '') {
                let text = line
                    .replace(/\*\*([^*]+)\*\*/g, '$1')
                    .replace(/\*([^*]+)\*/g, '$1')
                    .replace(/__([^_]+)__/g, '$1')
                    .replace(/_([^_]+)_/g, '$1')
                    .replace(/`([^`]+)`/g, '$1')
                    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[Image: $1]')
                    .replace(/^(\s)*[-*+]\s/g, '$1• ')
                    .replace(/^(\s)*\d+\.\s/g, '$1');
                
                if (text.trim()) {
                    result.push(text);
                }
            }
        }

        return result.join('\n');
    }
}

export class PlaintextExporter implements IExporter {
    format: ExportFormat = 'txt';
    extension = '.txt';
    mimeType = 'text/plain';
    label = 'Plain Text';
    icon = '📝';

    supportsTheme = false;
    supportsEditing = true;
    supportsImages: boolean = false;

    async export(input: ExportInput): Promise<ExportResult> {
        const start = performance.now();

        const converter = new MarkdownToPlainText();
        const plainText = converter.convert(input.markdown);

        const blob = new Blob([plainText], { type: this.mimeType });
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
}
