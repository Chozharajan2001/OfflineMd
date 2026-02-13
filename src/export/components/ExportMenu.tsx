import React from 'react';
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Download, FileText, File, FileStack, FileSymlink } from "lucide-react";
import type { ExportFormat } from "../types";

interface ExportMenuProps {
    onSelect: (format: ExportFormat) => void;
}

export function ExportMenu({ onSelect }: ExportMenuProps) {
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
                <button className="p-2 hover:bg-gray-700 rounded transition-colors" title="Export">
                    <Download className="w-5 h-5" />
                </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content className="bg-gray-800 border border-gray-700 rounded p-2 shadow-lg min-w-[200px]" sideOffset={5}>
                    {formats.map((f) => (
                        <DropdownMenu.Item key={f.format} onSelect={() => onSelect(f.format)} className="flex items-center gap-2 p-1 hover:bg-gray-700 cursor-pointer">
                            {f.icon}
                            <span className="text-sm">{f.label}</span>
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
