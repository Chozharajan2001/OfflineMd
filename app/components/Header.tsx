'use client';

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Settings, Save, FolderOpen, Upload, Download } from 'lucide-react';
import { useMarkdownStore, themes } from '../store';
import { ExportOrchestrator } from '../../src/export/export-service';
import type { ExportFormat, ExportOptions } from '../../src/export/types';
import { ExportMenu } from '../../src/export/components/ExportMenu';
import { ExportOptionsDialog } from '../../src/export/components/ExportOptionsDialog';
import { ExportProgressBar } from '../../src/export/components/ExportProgressBar';
import { triggerDownload } from '../../src/export/utils/file-saver';
import { db } from '../services/Database';

export function Header() {
    const {
        markdown, setMarkdown,
        theme, setTheme, resetTheme, applyPreset,
        activeFileId, activeProjectId, setActiveFile // Use new store values
    } = useMarkdownStore();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null);
    const [optionsOpen, setOptionsOpen] = useState(false);
    const [exporting, setExporting] = useState(false);

    const handleSave = async () => {
        if (activeFileId) {
            // Update existing file
            await db.nodes.update(activeFileId, {
                content: markdown,
                updatedAt: new Date()
            });
            alert('File saved!');
        } else {
            // Save as new file (legacy or quick save) behavior
            // We need a project to save to. If none selected, maybe prompt or require selection?
            if (!activeProjectId) {
                alert("Please select a project in the sidebar to save files.");
                return;
            }

            const name = prompt('Enter document name:');
            if (name) {
                const id = await db.nodes.add({
                    projectId: activeProjectId,
                    parentId: null, // Root level for now
                    type: 'file',
                    name,
                    content: markdown,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                setActiveFile(id as number);
                alert('Document saved!');
            }
        }
    };

    const handleLoad = async () => {
        alert("Use the Sidebar to browse and load files.");
    };

    // Import behavior: Create a new file in the current project or just load into editor
    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && (file.type === 'text/plain' || file.name.endsWith('.md'))) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const content = e.target?.result as string;
                setMarkdown(content);
                // Optionally save immediately if project selected? For now just load into editor.
                if (activeProjectId && confirm("Import successful. Save as new file?")) {
                    const id = await db.nodes.add({
                        projectId: activeProjectId,
                        parentId: null,
                        type: 'file',
                        name: file.name.replace('.md', ''),
                        content,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                    setActiveFile(id as number);
                } else {
                    setActiveFile(null); // Treating as unsaved scratchpad
                }
            };
            reader.readAsText(file);
        } else {
            alert('Please select a valid markdown or text file.');
        }
    };

    return (
        <header className="bg-gray-800 text-white p-4 flex justify-between items-center border-b border-gray-700">
            <h1 className="text-xl font-bold tracking-tight">Markdown Converter</h1>
            <div className="flex gap-2 items-center">
                {/* File Operations */}
                <div className="flex gap-1 border-r border-gray-600 pr-2 mr-2">
                    <button onClick={handleSave} className="p-2 hover:bg-gray-700 rounded transition-colors" title="Save Document">
                        <Save className="w-5 h-5" />
                    </button>
                    {/* Load button removed/redirected as Sidebar handles navigation */}
                    {/* <button onClick={handleLoad} className="p-2 hover:bg-gray-700 rounded transition-colors" title="Load Document">
                        <FolderOpen className="w-5 h-5" />
                    </button> */}
                    <label className="p-2 hover:bg-gray-700 rounded transition-colors cursor-pointer" title="Import File">
                        <Upload className="w-5 h-5" />
                        <input type="file" accept=".md,.txt" onChange={handleImport} className="hidden" />
                    </label>
                </div>

                {/* Export Operations – using ExportMenu */}
                <ExportMenu
                    onSelect={(format) => {
                        setExportFormat(format);
                        setOptionsOpen(true);
                    }}
                />

                {/* Export options dialog */}
                <ExportOptionsDialog
                    open={optionsOpen}
                    onOpenChange={setOptionsOpen}
                    format={exportFormat}
                    onExport={async (format, options) => {
                        setExporting(true);
                        try {
                            const { markdown, theme } = useMarkdownStore.getState();
                            const input = {
                                markdown,
                                ast: undefined,
                                theme: theme as any,
                                options,
                                metadata: {}
                            };
                            const result = await ExportOrchestrator.export(format, input);
                            await triggerDownload(result.blob, result.filename);
                        } finally {
                            setExporting(false);
                        }
                    }}
                />

                {/* Export progress overlay */}
                <ExportProgressBar visible={exporting} />

                {/* Settings */}
                <Dialog.Root open={settingsOpen} onOpenChange={setSettingsOpen}>
                    <Dialog.Trigger asChild>
                        <button className="p-2 hover:bg-gray-700 rounded transition-colors" title="Settings">
                            <Settings className="w-5 h-5" />
                        </button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-gray-700 text-white p-6 rounded-lg shadow-xl max-w-md w-full">
                            <Dialog.Title className="text-lg font-semibold mb-4">Theme Settings</Dialog.Title>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-medium text-gray-400 text-sm uppercase tracking-wider mb-2">Presets</h3>
                                    <select
                                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-2 text-white"
                                        onChange={(e) => applyPreset(e.target.value)}
                                        value={Object.keys(themes).find(key => themes[key].name === theme.name) || ''}
                                    >
                                        <option value="" disabled>Select a Preset...</option>
                                        {Object.keys(themes).map(key => (
                                            <option key={key} value={key}>{themes[key].name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <h3 className="font-medium text-gray-400 text-sm uppercase tracking-wider mb-2">Editor</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className="text-sm">
                                            Font Size
                                            <input
                                                type="number"
                                                value={theme.editor.fontSize}
                                                onChange={(e) => setTheme({ ...theme, editor: { ...theme.editor, fontSize: parseInt(e.target.value) } })}
                                                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 mt-1"
                                            />
                                        </label>
                                    </div>
                                </div>
                                <button
                                    onClick={resetTheme}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded transition-colors font-medium"
                                >
                                    Reset to Defaults
                                </button>
                            </div>
                            <Dialog.Close asChild>
                                <button className="absolute top-4 right-4 p-1 hover:bg-gray-800 rounded">×</button>
                            </Dialog.Close>
                        </Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>
            </div>
        </header>
    );
}
