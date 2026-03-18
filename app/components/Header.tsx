'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Settings, Save, Upload, Menu, ArrowUpDown } from 'lucide-react';
import { useMarkdownStore, themes } from '../store';
import { ExportOrchestrator } from '../../src/export/export-service';
import type { ExportFormat, ThemeTokens } from '../../src/export/types';
import { ExportMenu } from '../../src/export/components/ExportMenu';
import { ExportOptionsDialog } from '../../src/export/components/ExportOptionsDialog';
import { ExportProgressBar } from '../../src/export/components/ExportProgressBar';
import { triggerDownload } from '../../src/export/utils/file-saver';
import { db } from '../services/Database';
import { ConfirmDialog, InputDialog } from './dialogs';
import { useToast } from './notifications/useToast';

export function Header() {
    const {
        markdown,
        setMarkdownFromUser,
        theme,
        setTheme,
        resetTheme,
        applyPreset,
        activeFileId,
        activeProjectId,
        setActiveFile,
        documentStatus,
        revision,
        setSaving,
        setSaved,
        setSaveError,
        markDirty,
        scrollSyncEnabled,
        toggleScrollSyncEnabled,
    } = useMarkdownStore();
    const toast = useToast();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null);
    const [optionsOpen, setOptionsOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState<number | undefined>(undefined);

    // Dialog states
    const [openSaveAsDialog, setOpenSaveAsDialog] = useState(false);
    const [openImportConfirm, setOpenImportConfirm] = useState(false);
    const [pendingImportContent, setPendingImportContent] = useState<string | null>(null);
    const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
    const [isMacPlatform, setIsMacPlatform] = useState(false);

    // Compute if Save should be disabled
    const isSaving = documentStatus === 'saving';
    const canSave = activeFileId || activeProjectId;
    const shortcutModLabel = isMacPlatform ? 'Cmd' : 'Ctrl';
    const saveShortcutLabel = `${shortcutModLabel}+S`;
    const exportShortcutLabel = `${shortcutModLabel}+E`;

    const handleSidebarToggle = useCallback(() => {
        window.dispatchEvent(new CustomEvent('toggle-sidebar'));
    }, []);

    const openExportDialog = useMemo(
        () => () => {
            setExportFormat((prev) => prev ?? 'pdf');
            setOptionsOpen(true);
        },
        []
    );

    const handleSave = useCallback(async () => {
        if (isSaving) return;

        if (activeFileId) {
            const currentRevision = revision; // capture revision at save start
            setSaving();
            try {
                await db.nodes.update(activeFileId, {
                    content: markdown,
                    updatedAt: new Date(),
                });
                // Check if any edits occurred during the save
                if (useMarkdownStore.getState().revision === currentRevision) {
                    setSaved();
                } else {
                    markDirty(); // content changed during save, ensure dirty state
                }
                toast.success('File saved!');
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Save failed';
                setSaveError(message);
                toast.error(message);
            }
        } else {
            if (!activeProjectId) {
                toast.error('Please select a project in the sidebar to save files.');
                return;
            }
            setOpenSaveAsDialog(true);
        }
    }, [
        activeFileId,
        activeProjectId,
        isSaving,
        markdown,
        markDirty,
        revision,
        setSaveError,
        setSaved,
        setSaving,
        toast,
    ]);

    const handleSaveAsSubmit = async (name: string) => {
        if (!activeProjectId) return;

        try {
            const currentRevision = revision;
            setSaving();
            const id = await db.nodes.add({
                projectId: activeProjectId,
                parentId: null,
                type: 'file',
                name,
                content: markdown,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            setActiveFile(id as number);
            // After creating, if no edits happened during the operation, mark as saved
            if (useMarkdownStore.getState().revision === currentRevision) {
                setSaved();
            } else {
                markDirty();
            }
            toast.success('Document saved!');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Save failed';
            setSaveError(message);
            toast.error(message);
        }
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && (file.type === 'text/plain' || file.name.endsWith('.md'))) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const content = e.target?.result as string;
                setMarkdownFromUser(content);

                if (activeProjectId) {
                    setPendingImportContent(content);
                    setPendingImportFile(file);
                    setOpenImportConfirm(true);
                } else {
                    setActiveFile(null);
                    toast.info('File imported (not saved - select a project to save)');
                }
            };
            reader.readAsText(file);
        } else {
            toast.error('Please select a valid markdown or text file.');
        }
    };

    const handleImportConfirm = async () => {
        if (!pendingImportContent || !pendingImportFile || !activeProjectId) return;

        try {
            const currentRevision = revision;
            setSaving();
            const id = await db.nodes.add({
                projectId: activeProjectId,
                parentId: null,
                type: 'file',
                name: pendingImportFile.name.replace('.md', ''),
                content: pendingImportContent,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            setActiveFile(id as number);
            if (useMarkdownStore.getState().revision === currentRevision) {
                setSaved();
            } else {
                markDirty();
            }
            toast.success('File imported successfully!');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Import failed';
            setSaveError(message);
            toast.error(message);
        } finally {
            setPendingImportContent(null);
            setPendingImportFile(null);
            setOpenImportConfirm(false);
        }
    };

    const buildExportMetadata = async (): Promise<{ title?: string }> => {
        if (activeFileId) {
            const file = await db.nodes.get(activeFileId);
            if (file?.name) {
                return { title: file.name.replace(/\.[^/.]+$/, '') };
            }
        }
        const heading = markdown.match(/^#\s+(.*)/m)?.[1]?.trim();
        return { title: heading || 'document' };
    };

    useEffect(() => {
        setIsMacPlatform(/Mac|iPhone|iPad|iPod/i.test(navigator.platform));
    }, []);

    useEffect(() => {
        const isEditableTarget = (target: EventTarget | null): boolean => {
            if (!(target instanceof HTMLElement)) return false;
            const tag = target.tagName.toLowerCase();
            return (
                tag === 'input' ||
                tag === 'textarea' ||
                tag === 'select' ||
                target.isContentEditable ||
                !!target.closest('[contenteditable="true"]')
            );
        };

        const isMonacoTarget = (target: EventTarget | null): boolean => {
            return target instanceof HTMLElement && !!target.closest('.monaco-editor');
        };

        const handleGlobalShortcuts = (e: KeyboardEvent) => {
            const mod = e.ctrlKey || e.metaKey;
            if (!mod) return;

            const key = e.key.toLowerCase();
            const editableTarget = isEditableTarget(e.target);

            if (key === 's' && !e.shiftKey && !e.altKey) {
                // Allow Save inside Monaco, ignore inside other editable inputs.
                if (editableTarget && !isMonacoTarget(e.target)) return;
                e.preventDefault();
                void handleSave();
                return;
            }

            // Ignore non-save shortcuts while user is typing in form fields/dialog inputs.
            if (editableTarget) return;

            if (key === 'n' && e.shiftKey && !e.altKey) {
                e.preventDefault();
                if (!activeProjectId) {
                    toast.info('Select a project first to create a file.');
                    return;
                }
                window.dispatchEvent(new CustomEvent('open-new-file-dialog'));
                return;
            }

            if ((key === 'n' && e.altKey && !e.shiftKey) || (key === 'p' && e.shiftKey && !e.altKey)) {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('open-new-project-dialog'));
                return;
            }

            if (key === 'e' && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                openExportDialog();
            }
        };

        window.addEventListener('keydown', handleGlobalShortcuts);
        return () => window.removeEventListener('keydown', handleGlobalShortcuts);
    }, [activeProjectId, openExportDialog, toast, handleSave]);

    return (
        <header className="bg-[var(--header-bg)] text-[var(--header-fg)] p-4 flex justify-between items-center border-b border-[var(--header-border)]">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    className="p-2 hover:bg-[var(--header-hover)] rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    onClick={handleSidebarToggle}
                    title="Toggle Sidebar"
                    aria-label="Toggle sidebar"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold tracking-tight">Markdown Converter</h1>
            </div>
            <div className="flex gap-2 items-center">
                <div
                    className="flex gap-1 border-[var(--header-border)] pr-2 mr-2"
                    role="toolbar"
                    aria-label="File operations"
                >
                    <button
                        type="button"
                        onClick={handleSave}
                        className="p-2 hover:bg-[var(--header-hover)] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`Save (${saveShortcutLabel})`}
                        aria-label={isSaving ? 'Saving document' : `Save document (${saveShortcutLabel})`}
                        disabled={isSaving || !canSave}
                    >
                        <Save className="w-5 h-5" />
                    </button>
                    <label
                        className="p-2 hover:bg-[var(--header-hover)] rounded transition-colors cursor-pointer"
                        title="Import File"
                        aria-label="Import file"
                    >
                        <Upload className="w-5 h-5" />
                        <input type="file" accept=".md,.txt" onChange={handleImport} className="hidden" />
                    </label>
                </div>

                <ExportMenu
                    shortcutLabel={exportShortcutLabel}
                    onSelect={(format) => {
                        setExportFormat(format);
                        setOptionsOpen(true);
                    }}
                />

                <ExportOptionsDialog
                    open={optionsOpen}
                    onOpenChange={setOptionsOpen}
                    format={exportFormat}
                    onExport={async (format, options) => {
                        setExporting(true);
                        setExportProgress(0);
                        try {
                            const { markdown, theme } = useMarkdownStore.getState();

                            const input = {
                                markdown,
                                ast: undefined,
                                theme: theme as ThemeTokens,
                                options,
                                metadata: await buildExportMetadata(),
                                onProgress: (progress: number) => {
                                    setExportProgress(progress);
                                },
                            };
                            const result = await ExportOrchestrator.export(format, input);
                            await triggerDownload(result.blob, result.filename);
                            toast.success(`Exported ${result.filename}`);
                        } catch (error) {
                            const message = error instanceof Error ? error.message : 'Export failed';
                            toast.error(message);
                            throw error;
                        } finally {
                            setExporting(false);
                            setExportProgress(undefined);
                        }
                    }}
                />

                <ExportProgressBar
                    visible={exporting}
                    progress={exportProgress}
                    message={exportProgress ? `Exporting... ${Math.round(exportProgress)}%` : 'Exporting...'}
                />

                <button
                    type="button"
                    className={`p-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${scrollSyncEnabled ? 'bg-[var(--header-hover)] text-[var(--header-fg)]' : 'hover:bg-[var(--header-hover)] text-[var(--sidebar-muted)]'}`}
                    title={scrollSyncEnabled ? 'Disable Scroll Sync' : 'Enable Scroll Sync'}
                    aria-label={scrollSyncEnabled ? 'Disable scroll sync' : 'Enable scroll sync'}
                    aria-pressed={scrollSyncEnabled}
                    onClick={toggleScrollSyncEnabled}
                >
                    <ArrowUpDown className="w-5 h-5" />
                </button>

                <Dialog.Root open={settingsOpen} onOpenChange={setSettingsOpen}>
                    <Dialog.Trigger asChild>
                        <button
                            type="button"
                            className="p-2 hover:bg-[var(--header-hover)] rounded transition-colors"
                            title="Settings"
                            aria-label="Open settings"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" />
                        <Dialog.Content className="fixed top-1/2 left-1/2 z-[110] transform -translate-x-1/2 -translate-y-1/2 bg-[var(--background)] border border-[var(--header-border)] text-[var(--dialog-fg)] p-6 rounded-lg shadow-xl max-w-md w-full">
                            <Dialog.Title className="text-lg font-semibold mb-4">Theme Settings</Dialog.Title>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-medium text-[var(--sidebar-muted)] text-sm uppercase tracking-wider mb-2">Presets</h3>
                                    <select
                                        className="w-full bg-[var(--sidebar-input-bg)] border border-[var(--sidebar-border)] rounded px-2 py-2 text-[var(--sidebar-fg)]"
                                        onChange={(e) => applyPreset(e.target.value)}
                                        value={Object.keys(themes).find((key) => themes[key].name === theme.name) || ''}
                                    >
                                        <option value="" disabled>
                                            Select a Preset...
                                        </option>
                                        {Object.keys(themes).map((key) => (
                                            <option key={key} value={key}>
                                                {themes[key].name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <h3 className="font-medium text-[var(--sidebar-muted)] text-sm uppercase tracking-wider mb-2">Editor</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className="text-sm">
                                            Font Size
                                            <input
                                                type="number"
                                                value={theme.editor.fontSize}
                                                onChange={(e) => setTheme({ ...theme, editor: { ...theme.editor, fontSize: parseInt(e.target.value) } })}
                                                className="w-full bg-[var(--sidebar-input-bg)] border border-[var(--sidebar-border)] rounded px-2 py-1 mt-1 text-[var(--sidebar-fg)]"
                                            />
                                        </label>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={resetTheme}
                                    className="w-full bg-[var(--button-primary-bg)] hover:bg-[var(--button-primary-hover)] text-[var(--button-fg)] py-2 rounded transition-colors font-medium"
                                >
                                    Reset to Defaults
                                </button>
                            </div>
                            <Dialog.Close asChild>
                                <button
                                    type="button"
                                    className="absolute top-4 right-4 p-1 hover:bg-[var(--sidebar-hover)] rounded text-[var(--sidebar-fg)]"
                                >
                                    ×
                                </button>
                            </Dialog.Close>
                        </Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>
            </div>

            <InputDialog
                open={openSaveAsDialog}
                onOpenChange={setOpenSaveAsDialog}
                title="Save document"
                description="Enter a file name for this document."
                placeholder="document.md"
                onSubmit={handleSaveAsSubmit}
                validate={(v) => (!v.trim() ? 'File name is required.' : null)}
                submitText="Save"
            />

            <ConfirmDialog
                open={openImportConfirm}
                onOpenChange={setOpenImportConfirm}
                title="Save imported file?"
                description="Import successful. Do you want to save it as a new file in the current project?"
                confirmText="Save as new file"
                cancelText="Keep unsaved"
                onConfirm={handleImportConfirm}
            />
        </header>
    );
}
