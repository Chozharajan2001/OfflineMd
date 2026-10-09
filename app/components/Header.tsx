'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Settings, Save, Upload, Menu, ArrowUpDown, Columns2, SquarePen, Eye } from 'lucide-react';
import { useMarkdownStore, themes } from '../store';
import { ExportOrchestrator } from '../../src/export/export-service';
import type { ExportFormat, ThemeTokens } from '../../src/export/types';
import { ExportMenu } from '../../src/export/components/ExportMenu';
import { ExportOptionsDialog } from '../../src/export/components/ExportOptionsDialog';
import { ExportProgressBar } from '../../src/export/components/ExportProgressBar';
import { triggerDownload } from '../../src/export/utils/file-saver';
import { db } from '../services/Database';
import { buildWorkspaceBackup, restoreWorkspaceBackup } from '../utils/backup';
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
        viewMode,
        setViewMode,
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
    const [openBackupConfirm, setOpenBackupConfirm] = useState(false);
    const [pendingBackupFile, setPendingBackupFile] = useState<File | null>(null);
    const [openUrlImport, setOpenUrlImport] = useState(false);
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

    const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        // Reset so the same file can be picked twice in a row
        event.target.value = '';
        const validExt = /\.m(d|txt)$/i.test(file?.name || '');
        const validType = file && (file.type === 'text/plain' || file.type === 'text/markdown' || file.type === '');
        if (file && (validExt || validType)) {
            if (file.size > MAX_IMPORT_BYTES) {
                toast.error('File too large (max 2 MB).');
                return;
            }
            const reader = new FileReader();
            reader.onerror = () => toast.error('Import failed while reading file.');
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
                name: pendingImportFile.name.replace(/\.(md|txt)$/i, '') || 'imported',
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

    const handleUrlImportSubmit = async (url: string) => {
        const trimmed = url.trim();
        let parsed: URL;
        try {
            parsed = new URL(trimmed);
        } catch {
            throw new Error('Invalid URL.');
        }
        if (parsed.protocol !== 'https:') throw new Error('Only https URLs are allowed.');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const res = await fetch(parsed.toString(), { signal: controller.signal });
            if (!res.ok) throw new Error(`Fetch failed (${res.status}).`);
            const contentType = res.headers.get('content-type') || '';
            if (contentType && !/text|markdown|plain|octet-stream|github/.test(contentType)) {
                throw new Error(`Refusing to import ${contentType}.`);
            }
            const text = await res.text();
            if (text.length > MAX_IMPORT_BYTES) throw new Error('Content too large (max 2 MB).');
            setMarkdownFromUser(text);
            if (activeProjectId) {
                setPendingImportContent(text);
                // Synthesize a File-like name from the URL path for the save flow
                const base = parsed.pathname.split('/').filter(Boolean).pop() || 'imported.md';
                setPendingImportFile(new File([text], /\.m(d|txt)$/i.test(base) ? base : `${base}.md`, { type: 'text/markdown' }));
                setOpenImportConfirm(true);
            } else {
                setActiveFile(null);
                toast.info('File imported (not saved - select a project to save)');
            }
        } finally {
            clearTimeout(timeout);
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
        <header className="bg-[var(--header-bg)] text-[var(--header-fg)] p-3 sm:p-4 flex justify-between items-center gap-2 border-b border-[var(--header-border)]">
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                    type="button"
                    className="p-2 shrink-0 hover:bg-[var(--header-hover)] rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    onClick={handleSidebarToggle}
                    title="Toggle Sidebar"
                    aria-label="Toggle sidebar"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">Markdown Converter</h1>
            </div>
            <div className="flex gap-1 sm:gap-2 items-center shrink-0">
                <div
                    className="flex gap-1 border-[var(--header-border)] pr-2 mr-1 sm:mr-2"
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
                        htmlFor="import-file-input"
                        className="p-2 hover:bg-[var(--header-hover)] rounded transition-colors cursor-pointer"
                        title="Import File"
                        aria-label="Import file"
                    >
                        <Upload className="w-5 h-5" />
                    </label>
                    <input id="import-file-input" type="file" accept=".md,.txt" onChange={handleImport} className="sr-only" />
                    <button
                        type="button"
                        onClick={() => setOpenUrlImport(true)}
                        className="p-2 hover:bg-[var(--header-hover)] rounded transition-colors"
                        title="Import from URL"
                        aria-label="Import markdown from URL"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                    </button>
                </div>

                <ExportMenu
                    shortcutLabel={exportShortcutLabel}
                    onSelect={(format) => {
                        // md/txt have no options — export directly instead of empty dialog (M-12)
                        if (format === 'md' || format === 'txt') {
                            void (async () => {
                                setExporting(true);
                                setExportProgress(0);
                                try {
                                    const { markdown, theme } = useMarkdownStore.getState();
                                    const input = {
                                        markdown,
                                        ast: undefined,
                                        theme: theme as ThemeTokens,
                                        options: {
                                            includeTheme: false,
                                            includeTableOfContents: false,
                                            pageSize: 'A4' as const,
                                            orientation: 'portrait' as const,
                                            margins: { top: 10, right: 10, bottom: 10, left: 10 },
                                            fontSize: 12,
                                            headerFooter: false,
                                            embedImages: false,
                                            syntaxHighlight: false,
                                        },
                                        metadata: await buildExportMetadata(),
                                        onProgress: (p: number) => setExportProgress(p),
                                    };
                                    const result = await ExportOrchestrator.export(format, input);
                                    await triggerDownload(result.blob, result.filename);
                                    toast.success(`Exported ${result.filename}`);
                                } catch (error) {
                                    toast.error(error instanceof Error ? error.message : 'Export failed');
                                } finally {
                                    setExporting(false);
                                    setExportProgress(undefined);
                                }
                            })();
                            return;
                        }
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

                <button
                    type="button"
                    className="p-2 hover:bg-[var(--header-hover)] rounded transition-colors"
                    title="Copy Markdown"
                    aria-label="Copy markdown to clipboard"
                    onClick={() => {
                        void navigator.clipboard.writeText(markdown).then(
                            () => toast.success('Markdown copied!'),
                            () => toast.error('Copy failed')
                        );
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                </button>

                <div className="hidden md:flex gap-1 border-l border-[var(--header-border)] pl-2 ml-1" role="toolbar" aria-label="View mode">
                    <button
                        type="button"
                        onClick={() => setViewMode('editor')}
                        aria-pressed={viewMode === 'editor'}
                        title="Editor only"
                        aria-label="Editor only"
                        className={`p-2 rounded transition-colors ${viewMode === 'editor' ? 'bg-[var(--header-hover)]' : 'hover:bg-[var(--header-hover)]'}`}
                    >
                        <SquarePen className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('split')}
                        aria-pressed={viewMode === 'split'}
                        title="Split view"
                        aria-label="Split view"
                        className={`p-2 rounded transition-colors ${viewMode === 'split' ? 'bg-[var(--header-hover)]' : 'hover:bg-[var(--header-hover)]'}`}
                    >
                        <Columns2 className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('preview')}
                        aria-pressed={viewMode === 'preview'}
                        title="Preview only"
                        aria-label="Preview only"
                        className={`p-2 rounded transition-colors ${viewMode === 'preview' ? 'bg-[var(--header-hover)]' : 'hover:bg-[var(--header-hover)]'}`}
                    >
                        <Eye className="w-5 h-5" />
                    </button>
                </div>

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
                                                min={8}
                                                max={72}
                                                step={1}
                                                value={theme.editor.fontSize}
                                                onChange={(e) => {
                                                    const n = parseInt(e.target.value, 10);
                                                    const clamped = Number.isFinite(n) ? Math.min(72, Math.max(8, n)) : 14;
                                                    setTheme({ ...theme, editor: { ...theme.editor, fontSize: clamped } });
                                                }}
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

                                <div>
                                    <h3 className="font-medium text-[var(--sidebar-muted)] text-sm uppercase tracking-wider mb-2">Workspace backup</h3>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                void buildWorkspaceBackup().then(
                                                    async ({ blob, filename }) => {
                                                        await triggerDownload(blob, filename);
                                                        toast.success(`Backup exported (${filename})`);
                                                    },
                                                    (error) => toast.error(error instanceof Error ? error.message : 'Backup failed')
                                                );
                                            }}
                                            className="flex-1 px-3 py-2 rounded bg-[var(--button-secondary-bg)] hover:bg-[var(--button-secondary-hover)] text-[var(--button-fg)] font-medium transition-colors"
                                        >
                                            Export all
                                        </button>
                                        <label
                                            htmlFor="backup-restore-input"
                                            className="flex-1 px-3 py-2 rounded bg-[var(--button-secondary-bg)] hover:bg-[var(--button-secondary-hover)] text-[var(--button-fg)] font-medium transition-colors cursor-pointer text-center"
                                        >
                                            Restore…
                                        </label>
                                    </div>
                                    <input
                                        id="backup-restore-input"
                                        type="file"
                                        accept="application/json,.json"
                                        className="sr-only"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            e.target.value = '';
                                            if (!file) return;
                                            setPendingBackupFile(file);
                                            setOpenBackupConfirm(true);
                                        }}
                                    />
                                    <p className="mt-2 text-xs text-[var(--sidebar-muted)]">
                                        Export includes all projects, files and theme. Restore replaces everything.
                                    </p>
                                </div>
                            </div>
                            <Dialog.Close asChild>
                                <button
                                    type="button"
                                    aria-label="Close settings"
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
                open={openUrlImport}
                onOpenChange={setOpenUrlImport}
                title="Import from URL"
                description="Paste an https link to a raw markdown file (e.g. GitHub raw)."
                placeholder="https://raw.githubusercontent.com/…/README.md"
                submitText="Import"
                validate={(v) => (!v.trim() ? 'URL is required.' : null)}
                onSubmit={handleUrlImportSubmit}
            />

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

            <ConfirmDialog
                open={openBackupConfirm}
                onOpenChange={(open) => {
                    setOpenBackupConfirm(open);
                    if (!open) setPendingBackupFile(null);
                }}
                title="Restore backup?"
                description={`"${pendingBackupFile?.name ?? 'backup'}" will REPLACE all projects, files and theme. This cannot be undone.`}
                confirmText="Replace everything"
                cancelText="Cancel"
                destructive
                onConfirm={async () => {
                    if (!pendingBackupFile) return;
                    try {
                        const { projects, files } = await restoreWorkspaceBackup(pendingBackupFile);
                        toast.success(`Restored ${projects} projects, ${files} files`);
                        setSettingsOpen(false);
                    } catch (error) {
                        toast.error(error instanceof Error ? error.message : 'Restore failed');
                        throw error;
                    }
                }}
            />
        </header>
    );
}
