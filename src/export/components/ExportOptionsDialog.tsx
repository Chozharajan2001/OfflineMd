import * as Dialog from '@radix-ui/react-dialog';
import { useState, useEffect } from 'react';
import type { ExportFormat, ExportOptions } from '../types';

const defaultOptions: ExportOptions = {
    includeTheme: true,
    includeTableOfContents: false,
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
    fontSize: 12,
    headerFooter: false,
    embedImages: true,
    syntaxHighlight: true,
};

interface ExportOptionsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    format: ExportFormat | null;
    onExport: (format: ExportFormat, options: ExportOptions) => Promise<void> | void;
}

export function ExportOptionsDialog({
    open,
    onOpenChange,
    format,
    onExport,
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

    const supportsTheme = format === 'html' || format === 'pdf' || format === 'docx' || format === 'pptx';
    const supportsPageLayout = format === 'pdf';
    const supportsImages = format === 'html' || format === 'pdf';

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

                    <div className="space-y-2 text-sm">
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

                        {supportsPageLayout && (
                            <>
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
                            </>
                        )}
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="px-3 py-1 bg-[var(--button-secondary-bg)] rounded hover:bg-[var(--button-secondary-hover)] text-[var(--button-fg)] disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleExport()}
                            className="px-3 py-1 bg-[var(--button-primary-bg)] rounded hover:bg-[var(--button-primary-hover)] text-[var(--button-fg)] disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Exporting...' : 'Export'}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
