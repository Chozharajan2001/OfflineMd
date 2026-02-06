import { Document, Packer, Paragraph, TextRun } from 'docx';

export class ExportService {
    /**
     * Exports a DOM element to PDF using html2pdf.js
     * @param elementId The ID of the HTML element to render (usually the preview container)
     * @param filename Desired filename without extension
     */
    static async exportToPDF(elementId: string, filename: string = 'document') {
        const element = document.querySelector(`.${elementId}`) as HTMLElement;
        if (!element) {
            console.error(`ExportService: Element with class .${elementId} not found`);
            return;
        }

        const { default: html2pdf } = await import('html2pdf.js');

        const opt = {
            margin: [10, 10, 10, 10] as [number, number, number, number], // top, left, bottom, right
            filename: `${filename}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
            enableLinks: true
        };

        html2pdf().set(opt).from(element).save();
    }

    /**
     * Exports raw markdown text to a .docx file using 'docx' library
     * @param markdown The raw markdown content
     * @param filename Desired filename without extension
     */
    static async exportToWord(markdown: string, filename: string = 'document') {
        const { saveAs } = await import('file-saver');

        // TODO: In the future, this should parse the markdown AST and map to Docx classes
        // for a high-fidelity export. For now, it dumps the raw text.
        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [new TextRun(markdown)],
                        }),
                    ],
                },
            ],
        });

        const buffer = await Packer.toBuffer(doc);
        // Cast buffer to any to avoid TS conflict between NodeJS Buffer and Browser BlobPart
        const blob = new Blob([buffer as any], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        saveAs(blob, `${filename}.docx`);
    }

    /**
     * Exports the rendered HTML to a .html file
     * @param htmlContent The rendered HTML string
     * @param filename Desired filename without extension
     */
    static async exportToHTML(htmlContent: string, filename: string = 'document') {
        const { saveAs } = await import('file-saver');
        const blob = new Blob([htmlContent], { type: 'text/html' });
        saveAs(blob, `${filename}.html`);
    }

    /**
     * Exports the raw markdown to a .md file
     * @param markdownContent The raw markdown string
     * @param filename Desired filename without extension
     */
    static async exportToMarkdown(markdownContent: string, filename: string = 'document') {
        const { saveAs } = await import('file-saver');
        const blob = new Blob([markdownContent], { type: 'text/markdown' });
        saveAs(blob, `${filename}.md`);
    }
}
