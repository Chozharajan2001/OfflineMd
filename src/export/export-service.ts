import type { ExportFormat, ExportInput, ExportResult, IExporter } from './types';
import { getFrontMatter } from './utils/front-matter';

export class ExportOrchestrator {
  static async export(format: ExportFormat, input: ExportInput): Promise<ExportResult> {
    try {
      // Validate format
      if (!format || typeof format !== 'string') {
        throw new Error('Invalid export format');
      }

      // Front matter is metadata, not body — strip once so every exporter agrees.
      // Keep its title for filenames when no explicit metadata title exists.
      const { content, data } = getFrontMatter(input.markdown);
      const metadata =
        input.metadata?.title || typeof data.title !== 'string'
          ? input.metadata
          : { ...input.metadata, title: data.title };

      const exporter = await this.getExporter(format);
      return await exporter.export({ ...input, markdown: content, metadata });
    } catch (error) {
      console.error(`Export orchestrator failed for format: ${format}`, error);
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async getExporter(format: ExportFormat): Promise<IExporter> {
    try {
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
        case 'png':
          return new (await import('./exporters/png-exporter')).PngExporter();
        case 'epub':
          return new (await import('./exporters/epub-exporter')).EpubExporter();
        default:
          throw new Error('Unsupported export format: ' + format);
      }
    } catch (error) {
      console.error(`Failed to load exporter for format: ${format}`, error);
      throw new Error(`Exporter not available for ${format}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
