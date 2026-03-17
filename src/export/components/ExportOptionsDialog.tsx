import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import type { ExportFormat, ExportOptions } from '../types';

interface ExportOptionsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    format: ExportFormat | null;
    onExport: (format: ExportFormat, options: ExportOptions) => void;
}

export function ExportOptionsDialog({
    open,
    onOpenChange,
    format,
    onExport,
}: ExportOptionsDialogProps) {
    if (!format) return null;

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

    const [options, setOptions] = useState<ExportOptions>(defaultOptions);

    const setOption = (field: keyof ExportOptions, value: any) => {
        setOptions(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                <Dialog.Content className="fixed top-1/2 left-1/2 w-[340px] max-w-full -translate-x-1/2 -translate-y-1/2 bg-[var(--dialog-bg)] border border-[var(--dialog-border)] rounded p-4 text-[var(--dialog-fg)]">
                    <Dialog.Title className="text-lg font-medium mb-3">
                        Export Options – {format.toUpperCase()}
                    </Dialog.Title>
                    <div className="space-y-2 text-sm">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={options.includeTheme}
                                onChange={e => setOption('includeTheme', e.target.checked)}
                            />
                            <span>Include Theme (styles)</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={options.includeTableOfContents}
                                onChange={e =>
                                    setOption('includeTableOfContents', e.target.checked)
                                }
                            />
                            <span>Table of Contents</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <span>Page size</span>
                            <select
                                value={options.pageSize}
                                onChange={e =>
                                    setOption('pageSize', e.target.value as any)
                                }
                                className="bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-fg)] p-1 rounded"
                            >
                                <option value="A4">A4</option>
                                <option value="Letter">Letter</option>
                                <option value="A3">A3</option>
                            </select>
                        </label>
                        <label className="flex items-center gap-2">
                            <span>Orientation</span>
                            <select
                                value={options.orientation}
                                onChange={e =>
                                    setOption('orientation', e.target.value as any)
                                }
                                className="bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-fg)] p-1 rounded"
                            >
                                <option value="portrait">Portrait</option>
                                <option value="landscape">Landscape</option>
                            </select>
                        </label>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            onClick={() => onOpenChange(false)}
                            className="px-3 py-1 bg-[var(--button-secondary-bg)] rounded hover:bg-[var(--button-secondary-hover)] text-[var(--button-fg)]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                onExport(format, options);
                                onOpenChange(false);
                            }}
                            className="px-3 py-1 bg-[var(--button-primary-bg)] rounded hover:bg-[var(--button-primary-hover)] text-[var(--button-fg)]"
                        >
                            Export
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
