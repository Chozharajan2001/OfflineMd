'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Settings, Save, Upload, Menu, ArrowUpDown, Columns2, SquarePen, Eye, ChevronDown, MoreVertical, Copy, Link2, Download } from 'lucide-react';
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
import { Button, IconButton } from './ui';
import { PwaInstallButton, OfflineBadge } from './PwaInstall';
import { copyTextToClipboard } from '../../src/export/utils/clipboard';
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
    const [lastFormat, setLastFormat] = useState<ExportFormat>('pdf');
    const [optionsOpen, setOptionsOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState<number | undefined>(undefined);
    // Run token: cancelling bumps it so a late-resolving export is discarded
    const exportRunId = React.useRef(0);

    // Dialog states
    const [openSaveAsDialog, setOpenSaveAsDialog] = useState(false);
    const [openImportConfirm, setOpenImportConfirm] = useState(false);
    const [openBackupConfirm, setOpenBackupConfirm] = useState(false);
    const [pendingBackupFile, setPendingBackupFile] = useState<File | null>(null);
    const [openUrlImport, setOpenUrlImport] = useState(false);
    const [settingsTab, setSettingsTab] = useState<'appearance' | 'workspace'>('appearance');
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
    const buildExportMetadata = useCallback(async (): Promise<{ title?: string }> => {
        if (activeFileId) {
            const file = await db.nodes.get(activeFileId);
            if (file?.name) {
                return { title: file.name.replace(/\.[^/.]+$/, '') };
            }
        }
        const heading = markdown.match(/^#\s+(.*)/m)?.[1]?.trim();
        return { title: heading || 'document' };
    }, [activeFileId, markdown]);

    const startExport = useCallback((format: ExportFormat) => {
        // md/txt have no options — export directly instead of empty dialog (M-12)
        if (format === 'md' || format === 'txt') {
            void (async () => {
                const runId = ++exportRunId.current;
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
                        onProgress: (p: number) => {
                            if (exportRunId.current === runId) setExportProgress(p);
                        },
                    };
                    const result = await ExportOrchestrator.export(format, input);
                    if (exportRunId.current !== runId) return;
                    await triggerDownload(result.blob, result.filename);
                    toast.success(`Exported ${result.filename}`);
                } catch (error) {
                    if (exportRunId.current !== runId) return;
                    toast.error(error instanceof Error ? error.message : 'Export failed');
                } finally {
                    if (exportRunId.current === runId) {
                        setExporting(false);
                        setExportProgress(undefined);
                    }
                }
            })();
            return;
        }
        setExportFormat(format);
        setOptionsOpen(true);
    }, [toast, buildExportMetadata]);

    const handleFormatSelect = useCallback((format: ExportFormat) => {
        setLastFormat(format);
        startExport(format);
    }, [startExport]);

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
                <IconButton
                    label="Toggle sidebar"
                    onClick={handleSidebarToggle}
                    className="shrink-0"
                >
                    <Menu className="w-5 h-5" />
                </IconButton>
                <p className="text-lg sm:text-xl font-bold tracking-tight truncate">Markdown Converter</p>
            </div>
            <div className="flex gap-1 sm:gap-2 items-center shrink-0">
                <OfflineBadge />
                {/* Primary action */}
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={isSaving}
                    title={canSave ? `Save (${saveShortcutLabel})` : 'Select or create a project to save'}
                    aria-label={isSaving ? 'Saving document' : `Save document (${saveShortcutLabel})`}
                    className="gap-2"
                >
                    <Save className="w-5 h-5" aria-hidden="true" />
                    <span className="hidden sm:inline">Save</span>
                </Button>
                <input id="import-file-input" type="file" accept=".md,.txt" onChange={handleImport} className="sr-only" />

                {/* Export split-button: main repeats last format, chevron opens the menu */}
                <div className="flex items-center" role="group" aria-label="Export">
                    <IconButton
                        label={`Export as ${lastFormat.toUpperCase()} (${exportShortcutLabel})`}
                        onClick={() => startExport(lastFormat)}
                        className="rounded-r-none"
                    >
                        <Download className="w-5 h-5" aria-hidden="true" />
                    </IconButton>
                    <ExportMenu
                        shortcutLabel={exportShortcutLabel}
                        onSelect={handleFormatSelect}
                        activeFormat={lastFormat}
                        trigger={
                            <IconButton label="Choose export format" className="rounded-l-none -ml-2 px-1 min-w-[36px]">
                                <ChevronDown className="w-4 h-4" aria-hidden="true" />
                            </IconButton>
                        }
                    />
                </div>

                <ExportOptionsDialog
                    open={optionsOpen}
                    onOpenChange={setOptionsOpen}
                    format={exportFormat}
                    markdown={markdown}
                    onExport={async (format, options) => {
                        const runId = ++exportRunId.current;
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
                                    if (exportRunId.current === runId) setExportProgress(progress);
                                },
                            };
                            const result = await ExportOrchestrator.export(format, input);
                            // A cancelled run still resolves in the background — discard it
                            if (exportRunId.current !== runId) return;
                            await triggerDownload(result.blob, result.filename);
                            toast.success(`Exported ${result.filename}`);
                        } catch (error) {
                            if (exportRunId.current !== runId) return;
                            const message = error instanceof Error ? error.message : 'Export failed';
                            toast.error(message);
                            throw error;
                        } finally {
                            if (exportRunId.current === runId) {
                                setExporting(false);
                                setExportProgress(undefined);
                            }
                        }
                    }}
                />

                <ExportProgressBar
                    visible={exporting}
                    progress={exportProgress}
                    message={exportProgress ? `Exporting... ${Math.round(exportProgress)}%` : 'Exporting...'}
                    onCancel={() => {
                        // UI-level cancel: hides progress and discards the result.
                        // Generation itself isn't abortable mid-flight (pdf-lib/docx
                        // offer no cancellation hooks), so it finishes silently.
                        exportRunId.current += 1;
                        setExporting(false);
                        setExportProgress(undefined);
                        toast.info('Export cancelled');
                    }}
                />

                <div className="hidden min-[480px]:flex gap-1 border-l border-[var(--header-border)] pl-2 ml-1" role="toolbar" aria-label="View mode">
                    <IconButton
                        label="Editor only"
                        aria-pressed={viewMode === 'editor'}
                        active={viewMode === 'editor'}
                        onClick={() => setViewMode('editor')}
                    >
                        <SquarePen className="w-5 h-5" />
                    </IconButton>
                    <IconButton
                        label="Split view"
                        aria-pressed={viewMode === 'split'}
                        active={viewMode === 'split'}
                        onClick={() => setViewMode('split')}
                    >
                        <Columns2 className="w-5 h-5" />
                    </IconButton>
                    <IconButton
                        label="Preview only"
                        aria-pressed={viewMode === 'preview'}
                        active={viewMode === 'preview'}
                        onClick={() => setViewMode('preview')}
                    >
                        <Eye className="w-5 h-5" />
                    </IconButton>
                </div>

                {/* Overflow: secondary actions live here on all sizes */}
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <IconButton label="More actions">
                            <MoreVertical className="w-5 h-5" aria-hidden="true" />
                        </IconButton>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                        <DropdownMenu.Content
                            className="bg-[var(--dropdown-bg)] border border-[var(--dropdown-border)] rounded p-2 shadow-lg min-w-[220px] z-[120]"
                            sideOffset={5}
                            aria-label="More actions"
                        >
                            <DropdownMenu.Item
                                onSelect={() => document.getElementById('import-file-input')?.click()}
                                className="flex items-center gap-2 p-1 min-h-[36px] hover:bg-[var(--dropdown-hover)] cursor-pointer rounded text-[var(--dropdown-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            >
                                <Upload className="w-4 h-4" aria-hidden="true" />
                                <span className="text-sm">Import file…</span>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                                onSelect={() => setOpenUrlImport(true)}
                                className="flex items-center gap-2 p-1 min-h-[36px] hover:bg-[var(--dropdown-hover)] cursor-pointer rounded text-[var(--dropdown-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            >
                                <Link2 className="w-4 h-4" aria-hidden="true" />
                                <span className="text-sm">Import from URL…</span>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                                onSelect={() => {
                                    void copyTextToClipboard(markdown).then(
                                        () => toast.success('Markdown copied!'),
                                        () => toast.error('Copy failed — select the text manually')
                                    );
                                }}
                                className="flex items-center gap-2 p-1 min-h-[36px] hover:bg-[var(--dropdown-hover)] cursor-pointer rounded text-[var(--dropdown-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            >
                                <Copy className="w-4 h-4" aria-hidden="true" />
                                <span className="text-sm">Copy markdown</span>
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator className="h-px my-1 bg-[var(--dropdown-border)]" />
                            <DropdownMenu.CheckboxItem
                                checked={scrollSyncEnabled}
                                onCheckedChange={() => toggleScrollSyncEnabled()}
                                className="flex items-center gap-2 p-1 min-h-[36px] hover:bg-[var(--dropdown-hover)] cursor-pointer rounded text-[var(--dropdown-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            >
                                <ArrowUpDown className="w-4 h-4" aria-hidden="true" />
                                <span className="text-sm">Scroll sync</span>
                            </DropdownMenu.CheckboxItem>
                            <DropdownMenu.Separator className="h-px my-1 bg-[var(--dropdown-border)]" />
                            <DropdownMenu.Label className="px-1 py-1 text-xs uppercase tracking-wider text-[var(--sidebar-muted)]">
                                View
                            </DropdownMenu.Label>
                            {(['editor', 'split', 'preview'] as const).map((mode) => (
                                <DropdownMenu.CheckboxItem
                                    key={mode}
                                    checked={viewMode === mode}
                                    onCheckedChange={() => setViewMode(mode)}
                                    className="flex items-center gap-2 p-1 min-h-[36px] hover:bg-[var(--dropdown-hover)] cursor-pointer rounded text-[var(--dropdown-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                >
                                    <span className="text-sm capitalize">{mode === 'split' ? 'Split view' : `${mode} only`}</span>
                                </DropdownMenu.CheckboxItem>
                            ))}
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>

                <PwaInstallButton variant="icon" />

                <Dialog.Root open={settingsOpen} onOpenChange={setSettingsOpen}>
                    <Dialog.Trigger asChild>
                        <IconButton label="Open settings">
                            <Settings className="w-5 h-5" />
                        </IconButton>
                    </Dialog.Trigger>                    <Dialog.Portal>
                        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" />
                        <Dialog.Content className="fixed top-1/2 left-1/2 z-[110] transform -translate-x-1/2 -translate-y-1/2 bg-[var(--background)] border border-[var(--header-border)] text-[var(--dialog-fg)] p-6 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
                            <Dialog.Title className="text-lg font-semibold mb-3">Settings</Dialog.Title>

                            <div role="tablist" aria-label="Settings sections" className="flex gap-1 mb-4 rounded bg-[var(--button-secondary-bg)] p-1">
                                {(['appearance', 'workspace'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        type="button"
                                        role="tab"
                                        aria-selected={settingsTab === tab}
                                        onClick={() => setSettingsTab(tab)}
                                        className={`flex-1 min-h-[40px] rounded px-3 text-sm font-medium capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${settingsTab === tab ? 'bg-[var(--dialog-bg)] text-[var(--dialog-fg)] shadow' : 'text-[var(--sidebar-muted)] hover:text-[var(--dialog-fg)]'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {settingsTab === 'appearance' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-medium text-[var(--sidebar-muted)] text-sm uppercase tracking-wider mb-2">Theme preset</h3>
                                    <div role="radiogroup" aria-label="Theme preset" className="max-h-56 overflow-auto rounded border border-[var(--sidebar-border)] divide-y divide-[var(--sidebar-border)]">
                                        {Object.keys(themes).map((key) => {
                                            const preset = themes[key];
                                            const selected = preset.name === theme.name;
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={selected}
                                                    onClick={() => applyPreset(key)}
                                                    className={`flex w-full items-center gap-3 px-3 min-h-[44px] text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--accent)] ${selected ? 'bg-[var(--sidebar-hover)] font-medium' : 'hover:bg-[var(--sidebar-hover)]'}`}
                                                >
                                                    <span className="flex -space-x-1" aria-hidden="true">
                                                        <span className="h-4 w-4 rounded-full border border-black/30" style={{ backgroundColor: preset.ui.background }} />
                                                        <span className="h-4 w-4 rounded-full border border-black/30" style={{ backgroundColor: preset.ui.accent }} />
                                                    </span>
                                                    <span className="flex-1">{preset.name}</span>
                                                    {selected && <span aria-hidden="true">✓</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
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
                                <Button
                                    variant="primary"
                                    onClick={resetTheme}
                                    className="w-full py-2"
                                >
                                    Reset to Defaults
                                </Button>
                            </div>
                            )}

                            {settingsTab === 'workspace' && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-medium text-[var(--sidebar-muted)] text-sm uppercase tracking-wider mb-2">Install</h3>
                                    <PwaInstallButton variant="full" />
                                    <p className="mt-2 text-xs text-[var(--sidebar-muted)]">
                                        Installs to your device for offline use — no browser needed. Already installed? The button hides itself.
                                    </p>
                                </div>
                                <div className="rounded-lg border border-red-500/40 p-4">
                                    <h3 className="font-medium text-sm uppercase tracking-wider mb-2 text-red-500">Danger zone</h3>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                void buildWorkspaceBackup().then(
                                                    async ({ blob, filename }) => {
                                                        await triggerDownload(blob, filename);
                                                        toast.success(`Backup exported (${filename})`);
                                                    },
                                                    (error) => toast.error(error instanceof Error ? error.message : 'Backup failed')
                                                );
                                            }}
                                            className="flex-1"
                                        >
                                            Export all
                                        </Button>
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
                            )}
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
