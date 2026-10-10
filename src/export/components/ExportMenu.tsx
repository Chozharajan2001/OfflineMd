import React from 'react';
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Download, FileText, FileType, FileCode, FileStack, FileSymlink, FileImage, Presentation, Check, BookOpen } from "lucide-react";
import type { ExportFormat } from "../types";
import { IconButton } from '../../../app/components/ui';

interface ExportMenuProps {
    onSelect: (format: ExportFormat) => void;
    shortcutLabel?: string;
    /** Custom trigger element. Defaults to the download icon button. */
    trigger?: React.ReactNode;
    /** Currently preferred format, shown with a check mark. */
    activeFormat?: ExportFormat;
}

export function ExportMenu({ onSelect, shortcutLabel, trigger, activeFormat }: ExportMenuProps) {
    const formats: { format: ExportFormat; label: string; hint: string; icon: React.ReactNode }[] = [
        { format: "md", label: "Markdown (.md)", hint: "Source text", icon: <FileText size={14} /> },
        { format: "txt", label: "Plain Text (.txt)", hint: "Unformatted text", icon: <FileType size={14} /> },
        { format: "html", label: "HTML (.html)", hint: "Styled web page", icon: <FileCode size={14} /> },
        { format: "pdf", label: "PDF (.pdf)", hint: "Paginated document", icon: <FileStack size={14} /> },
        { format: "docx", label: "DOCX (.docx)", hint: "Word document", icon: <FileSymlink size={14} /> },
        { format: "pptx", label: "PPTX (.pptx)", hint: "Slide deck", icon: <Presentation size={14} /> },
        { format: "png", label: "PNG (.png)", hint: "Image snapshot", icon: <FileImage size={14} /> },
        { format: "epub", label: "EPUB (.epub)", hint: "E-book", icon: <BookOpen size={14} /> },
    ];

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                {trigger ?? (
                <IconButton label={shortcutLabel ? `Export document (${shortcutLabel})` : 'Export document'}>
                    <Download className="w-5 h-5" />
                </IconButton>
                )}
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="bg-[var(--dropdown-bg)] border border-[var(--dropdown-border)] rounded p-2 shadow-lg min-w-[200px]"
                    sideOffset={5}
                    aria-label="Export formats"
                >
                    {formats.map((f) => (
                        <DropdownMenu.Item key={f.format} onSelect={() => onSelect(f.format)} className="flex items-center gap-2 p-1 min-h-[36px] hover:bg-[var(--dropdown-hover)] cursor-pointer rounded text-[var(--dropdown-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                            {f.icon}
                            <span className="text-sm">{f.label}</span>
                            <span className="text-xs text-[var(--sidebar-muted)] ml-auto pl-4">{f.hint}</span>
                            {activeFormat === f.format && <Check className="w-4 h-4 shrink-0" aria-label="Last used" />}
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
