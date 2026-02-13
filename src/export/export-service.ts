import type { ExportFormat, ExportInput, ExportResult, IExporter } from './types';

export class ExportOrchestrator {
  static async export(format: ExportFormat, input: ExportInput): Promise<ExportResult> {
    const exporter = await this.getExporter(format);
    return exporter.export(input);
  }

  private static async getExporter(format: ExportFormat): Promise<IExporter> {
    switch (format) {
      case 'md':
        return new (await import('./exporters/markdown-exporter')).MarkdownExporter();
      case 'txt':
        return new (await import('./exporters/plaintext-exporter')).PlaintextExporter();
      case 'html':
        return new (await import('./exporters/html-exporter')).HtmlExporter();
      case 'pdf':
        return new (await import('./exporters/pdf-exporter')).PdfExporter();
      case 'docx':
        return new (await import('./exporters/docx-exporter')).DocxExporter();
      case 'pptx':
        return new (await import('./exporters/pptx-exporter')).PptxExporter();
      default:
        throw new Error('Unsupported export format: ' + format);
    }
  }
}
