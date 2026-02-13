// Export types and IExporter interface definitions

/**
 * Supported export formats.
 */
export type ExportFormat = 'md' | 'txt' | 'html' | 'pdf' | 'docx' | 'pptx';

/**
 * Theme token definitions used for styling exports.
 */
export interface ThemeTokens {
    ui: {
        background: string;
        foreground: string;
        border: string;
        accent: string;
    };
    editor: {
        background: string;
        foreground: string;
        fontSize: number;
        fontFamily: string;
    };
    preview: {
        background: string;
        foreground: string;
        fontFamily: string;
        fontSize: number;
    };
}

/**
 * Optional metadata for the exported document.
 */
export interface DocumentMetadata {
    title?: string;
    author?: string;
    date?: string;
}

/**
 * Input required for an export operation.
 */
export interface ExportInput {
    markdown: string;           // Raw markdown source
    ast?: any;                  // Parsed Markdown AST (optional, depending on exporter)
    theme: ThemeTokens;          // Active theme tokens
    options: ExportOptions;      // User‑specified export options
    metadata: DocumentMetadata; // Document metadata (title, author, date, etc.)
}

/**
 * Export options common across many formats.
 */
export interface ExportOptions {
    includeTheme: boolean;          // Apply theme styling (CSS, colors, etc.)
    includeTableOfContents: boolean;
    pageSize: 'A4' | 'Letter' | 'A3';
    orientation: 'portrait' | 'landscape';
    margins: { top: number; right: number; bottom: number; left: number };
    fontSize: number;
    headerFooter: boolean;
    embedImages: boolean;           // Base64‑encode images into the export
    syntaxHighlight: boolean;      // Apply syntax highlighting to code blocks
}

/**
 * Result of a successful export operation.
 */
export interface ExportResult {
    blob: Blob;               // File data
    filename: string;         // Suggested file name (including extension)
    mimeType: string;         // MIME type for the Blob
    size: number;            // Size in bytes
    duration: number;        // Time taken (ms) to generate the export
}

/**
 * Interface each exporter must implement.
 */
export interface IExporter {
    /** Export format identifier */
    format: ExportFormat;
    /** File extension including the leading dot (e.g. ".md") */
    extension: string;
    /** MIME type for the generated file */
    mimeType: string;
    /** Human‑readable label for UI displays */
    label: string;
    /** Icon identifier or SVG path for UI (optional) */
    icon?: string;

    /** Does the exporter apply the currently selected theme? */
    supportsTheme: boolean;
    /** Does the exporter preserve the ability to edit the exported file later? */
    supportsEditing: boolean;
    /** Does the exporter embed images (as data URIs) when exporting? */
    supportsImages: boolean;

    /**
     * Core export method. Must return a fully populated {@link ExportResult}.
     *
     * @param content The full export input payload.
     */
    export(content: ExportInput): Promise<ExportResult>;

    /** Optional preview method (e.g. for PDF or HTML) */
    preview?(content: ExportInput): Promise<string | Blob>;

    /** Optional size estimation for a given payload */
    estimateSize?(content: ExportInput): number;
}
