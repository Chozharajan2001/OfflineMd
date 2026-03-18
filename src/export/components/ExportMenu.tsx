import React from 'react';
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Download, FileText, File, FileStack, FileSymlink } from "lucide-react";
import type { ExportFormat } from "../types";

interface ExportMenuProps {
    onSelect: (format: ExportFormat) => void;
    shortcutLabel?: string;
}

export function ExportMenu({ onSelect, shortcutLabel }: ExportMenuProps) {
    const formats: { format: ExportFormat; label: string; icon: React.ReactNode }[] = [
        { format: "md", label: "Markdown (.md)", icon: <FileText size={14} /> },
        { format: "txt", label: "Plain Text (.txt)", icon: <FileText size={14} /> },
        { format: "html", label: "HTML (.html)", icon: <File size={14} /> },
        { format: "pdf", label: "PDF (.pdf)", icon: <FileStack size={14} /> },
        { format: "docx", label: "DOCX (.docx)", icon: <FileSymlink size={14} /> },
        { format: "pptx", label: "PPTX (.pptx)", icon: <FileSymlink size={14} /> },
    ];

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    className="p-2 hover:bg-[var(--header-hover)] rounded transition-colors"
                    title={shortcutLabel ? `Export (${shortcutLabel})` : 'Export'}
                    aria-label={shortcutLabel ? `Export document (${shortcutLabel})` : 'Export document'}
                    aria-haspopup="menu"
                >
                    <Download className="w-5 h-5" />
                </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="bg-[var(--dropdown-bg)] border border-[var(--dropdown-border)] rounded p-2 shadow-lg min-w-[200px]"
                    sideOffset={5}
                    aria-label="Export formats"
                >
                    {formats.map((f) => (
                        <DropdownMenu.Item key={f.format} onSelect={() => onSelect(f.format)} className="flex items-center gap-2 p-1 hover:bg-[var(--dropdown-hover)] cursor-pointer text-[var(--dropdown-fg)]">
                            {f.icon}
                            <span className="text-sm">{f.label}</span>
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
