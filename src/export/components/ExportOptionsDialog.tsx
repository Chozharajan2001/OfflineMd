import * as Dialog from '@radix-ui/react-dialog';
import { useState, useEffect } from 'react';
import type { ExportFormat, ExportOptions } from '../types';
import { Button } from '../../../app/components/ui';
import { extractTitle, safeFilename } from '../utils/safe-filename';

const defaultOptions: ExportOptions = {
    includeTheme: true,
    includeTableOfContents: false,
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
    fontSize: 12,
    embedImages: true,
};

interface ExportOptionsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    format: ExportFormat | null;
    onExport: (format: ExportFormat, options: ExportOptions) => Promise<void> | void;
    /** Raw markdown for the filename preview. Omit to hide the summary. */
    markdown?: string;
}

const EXTENSIONS: Record<ExportFormat, string> = {
    md: '.md',
    txt: '.txt',
    html: '.html',
    pdf: '.pdf',
    docx: '.docx',
    pptx: '.pptx',
    png: '.png',
    epub: '.epub',
};

export function ExportOptionsDialog({
    open,
    onOpenChange,
    format,
    onExport,
    markdown,
}: ExportOptionsDialogProps) {
    // Hooks are always called, regardless of props
    const [options, setOptions] = useState<ExportOptions>(defaultOptions);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset options to defaults when dialog opens or format changes
    useEffect(() => {
        if (open && format) {
            setOptions({ ...defaultOptions });
        }
    }, [open, format]);

    // Validation function
    const validate = (): string | null => {
        if (!format) return 'Export format is missing';
        if (!options.pageSize || !['A4', 'Letter', 'A3'].includes(options.pageSize)) {
            return 'Invalid page size.';
        }
        if (!options.orientation || !['portrait', 'landscape'].includes(options.orientation)) {
            return 'Invalid orientation.';
        }
        const m = options.margins;
        if (typeof m !== 'object' || m == null) {
            return 'Margins configuration is invalid.';
        }
        for (const key of ['top', 'right', 'bottom', 'left'] as const) {
            const val = m[key];
            if (typeof val !== 'number' || val < 0 || val > 50) {
                return `Margin ${key} must be a number between 0 and 50.`;
            }
        }
        if (typeof options.fontSize !== 'number' || options.fontSize < 6 || options.fontSize > 24) {
            return 'Font size must be a number between 6 and 24.';
        }
        // Additional validation can be added here as needed
        return null;
    };

    const handleExport = async () => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }
        if (!format) {
            setError('Export format is missing');
            return;
        }
        setError(null);
        setIsSubmitting(true);
        try {
            await onExport(format, options);
            onOpenChange(false);
        } catch (exportError) {
            const message = exportError instanceof Error ? exportError.message : 'Export failed';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // If format is not provided, render nothing (after hooks)
    if (!format) return null;

    const supportsTheme = format === 'html' || format === 'pdf' || format === 'docx' || format === 'pptx' || format === 'png';
    const supportsPageLayout = format === 'pdf';
    const supportsImages = format === 'html' || format === 'pdf';
    const supportsToc = format === 'html';

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <Dialog.Content
                    className="fixed top-1/2 left-1/2 w-[340px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded border border-[var(--dialog-border)] bg-[var(--dialog-bg)] p-4 text-[var(--dialog-fg)] shadow-xl z-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    aria-describedby="export-options-description"
                >
                    <Dialog.Title className="text-base font-semibold">
                        Export Options – {format.toUpperCase()}
                    </Dialog.Title>
                    <Dialog.Description id="export-options-description" className="sr-only">
                        Configure export settings for {format} format
                    </Dialog.Description>

                    {/* Error message area */}
                    {error && (
                        <div className="bg-red-900/50 border border-red-500 text-red-100 p-2 rounded mb-3 text-sm" role="alert">
                            {error}
                        </div>
                    )}

                    <div className="space-y-3 text-sm">
                        {/* Fixed skeleton: Output summary first, then grouped options.
                            Sections keep stable order so the dialog never shape-shifts. */}
                        <section aria-label="Output">
                            <h4 className="font-medium text-[var(--sidebar-muted)] text-xs uppercase tracking-wider mb-1">Output</h4>
                            <p className="truncate text-[var(--sidebar-fg)]" title="Resulting file name">
                                {markdown ? `${safeFilename(extractTitle(markdown))}_…${EXTENSIONS[format]}` : `${format.toUpperCase()} document`}
                                {options.includeTheme && supportsTheme ? ' · themed' : ''}
                            </p>
                        </section>

                        {(supportsTheme || supportsImages || supportsToc) && (
                        <section aria-label="Style" className="space-y-2">
                            <h4 className="font-medium text-[var(--sidebar-muted)] text-xs uppercase tracking-wider">Style</h4>
                        {/* Include Theme */}
                        {supportsTheme && (
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={options.includeTheme}
                                    onChange={e => setOptions(prev => ({ ...prev, includeTheme: e.target.checked }))}
                                    id="option-include-theme"
                                />
                                <span>Include Theme (styles)</span>
                            </label>
                        )}

                        {supportsImages && (
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={options.embedImages}
                                    onChange={e => setOptions(prev => ({ ...prev, embedImages: e.target.checked }))}
                                    id="option-embed-images"
                                />
                                <span>Embed Images</span>
                            </label>
                        )}

                        {supportsToc && (
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={options.includeTableOfContents}
                                    onChange={e => setOptions(prev => ({ ...prev, includeTableOfContents: e.target.checked }))}
                                    id="option-include-toc"
                                />
                                <span>Include table of contents</span>
                            </label>
                        )}
                        </section>
                        )}

                        {supportsPageLayout && (
                            <section aria-label="Page" className="space-y-2">
                                <h4 className="font-medium text-[var(--sidebar-muted)] text-xs uppercase tracking-wider">Page</h4>
                                {/* Page Size */}
                                <label className="flex items-center gap-2">
                                    <span>Page size</span>
                                    <select
                                        value={options.pageSize}
                                        onChange={e => setOptions(prev => ({ ...prev, pageSize: e.target.value as ExportOptions['pageSize'] }))}
                                        className="bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-fg)] p-1 rounded"
                                    >
                                        <option value="A4">A4</option>
                                        <option value="Letter">Letter</option>
                                        <option value="A3">A3</option>
                                    </select>
                                </label>

                                {/* Orientation */}
                                <label className="flex items-center gap-2">
                                    <span>Orientation</span>
                                    <select
                                        value={options.orientation}
                                        onChange={e => setOptions(prev => ({ ...prev, orientation: e.target.value as ExportOptions['orientation'] }))}
                                        className="bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-fg)] p-1 rounded"
                                    >
                                        <option value="portrait">Portrait</option>
                                        <option value="landscape">Landscape</option>
                                    </select>
                                </label>

                                {/* Base font size (pt) */}
                                <label className="flex items-center gap-2">
                                    <span>Font size</span>
                                    <input
                                        type="number"
                                        min={6}
                                        max={24}
                                        step={1}
                                        value={options.fontSize}
                                        onChange={e => {
                                            const n = parseInt(e.target.value, 10);
                                            setOptions(prev => ({ ...prev, fontSize: Number.isFinite(n) ? Math.min(24, Math.max(6, n)) : 12 }));
                                        }}
                                        aria-label="Base font size in points"
                                        className="w-20 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-fg)] p-1 rounded"
                                    />
                                </label>

                                {/* Margins (mm) */}
                                <fieldset>
                                    <legend className="mb-1">Margins (mm)</legend>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['top', 'right', 'bottom', 'left'] as const).map((key) => (
                                            <label key={key} className="flex items-center gap-2 capitalize">
                                                <span className="w-14">{key}</span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={50}
                                                    step={1}
                                                    value={options.margins[key]}
                                                    onChange={e => {
                                                        const n = parseInt(e.target.value, 10);
                                                        setOptions(prev => ({
                                                            ...prev,
                                                            margins: {
                                                                ...prev.margins,
                                                                [key]: Number.isFinite(n) ? Math.min(50, Math.max(0, n)) : 10,
                                                            },
                                                        }));
                                                    }}
                                                    aria-label={`${key} margin in millimeters`}
                                                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-fg)] p-1 rounded"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>
                            </section>
                        )}
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => void handleExport()}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Exporting...' : 'Export'}
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
