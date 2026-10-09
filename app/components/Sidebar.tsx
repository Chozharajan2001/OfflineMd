'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Folder, FileText, Plus, Trash2, ChevronRight, ChevronDown, FolderPlus, FilePlus, Download } from 'lucide-react';
import { useMarkdownStore } from '../store';
import { db, FileNode } from '../services/Database';
import { useLiveQuery } from 'dexie-react-hooks';
import { ConfirmDialog, InputDialog } from './dialogs';
import { Button } from './ui';
import { TableOfContents } from './TableOfContents';
import { useToast } from './notifications/useToast';
import { buildProjectZip } from '../utils/zip-project';
import { triggerDownload } from '../../src/export/utils/file-saver';

export function Sidebar() {
    type ContextMenuState = {
        open: boolean;
        x: number;
        y: number;
        node: FileNode | null;
    };

    const {
        activeProjectId,
        activeFileId,
        setActiveProject,
        setActiveFile,
        setMarkdown,
        resetSaveState,
        setSaved,
        sidebarVisible,
        toggleSidebarVisible,
        pendingDeepLink,
        setPendingDeepLink,
    } = useMarkdownStore();
    const toast = useToast();

    const projects = useLiveQuery(() => db.projects.toArray()) || [];
    const projectNodesResult = useLiveQuery(
        () => (activeProjectId ? db.nodes.where('projectId').equals(activeProjectId).toArray() : []),
        [activeProjectId]
    );
    const projectNodes = useMemo(
        () => (projectNodesResult || []).filter((n) => !n.deletedAt),
        [projectNodesResult]
    );
    const trashedNodes = useMemo(
        () => (projectNodesResult || []).filter((n) => n.deletedAt),
        [projectNodesResult]
    );
    const [expandedFolders, setExpandedFolders] = useState<Record<number, boolean>>({});
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const ensuredProject = useRef(false);

    // No project-first awkwardness: guarantee a usable project on boot.
    // Fresh install → auto-create "My Notes" and select it, so New File /
    // Save / import work immediately. Returning user with nothing selected →
    // resume the most recently updated project. Guarded against StrictMode
    // double-effects creating duplicates.
    useEffect(() => {
        if (ensuredProject.current) return;
        ensuredProject.current = true;
        void (async () => {
            try {
                const count = await db.projects.count();
                if (count === 0) {
                    const now = new Date();
                    const id = await db.projects.add({ name: 'My Notes', createdAt: now, updatedAt: now });
                    // Re-check: a concurrent mount may have created one already
                    if ((await db.projects.count()) > 1) {
                        await db.projects.delete(id as number);
                        const first = await db.projects.orderBy('updatedAt').last();
                        if (first?.id) setActiveProject(first.id);
                        return;
                    }
                    setActiveProject(id as number);
                    toast.info('Created “My Notes” — add a file to start writing.');
                } else if (!useMarkdownStore.getState().activeProjectId) {
                    const latest = await db.projects.orderBy('updatedAt').last();
                    if (latest?.id) setActiveProject(latest.id);
                }
            } catch {
                // IndexedDB unavailable (private mode quota, etc.) — app still
                // works unsaved; header save/import paths already handle null.
            }
        })();
    }, [setActiveProject, toast]);

    // Consume one-shot launch intents (PWA shortcut ?new=file). Waits for a
    // project deterministically instead of racing the bootstrap with a timeout.
    useEffect(() => {
        if (pendingDeepLink === 'new-file' && activeProjectId) {
            setPendingDeepLink(null);
            setPendingNodeType('file');
            setPendingParentId(null);
            setOpenCreateNode(true);
        }
    }, [pendingDeepLink, activeProjectId, setPendingDeepLink]);

    // Dialog states
    const [openCreateProject, setOpenCreateProject] = useState(false);
    const [openCreateNode, setOpenCreateNode] = useState(false);
    const [pendingNodeType, setPendingNodeType] = useState<'file' | 'folder' | null>(null);
    const [pendingParentId, setPendingParentId] = useState<number | null>(null);
    const [openDeleteNode, setOpenDeleteNode] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
    const [openRenameNode, setOpenRenameNode] = useState(false);
    const [pendingRenameNode, setPendingRenameNode] = useState<FileNode | null>(null);
    const [openMoveNode, setOpenMoveNode] = useState(false);
    const [pendingMoveNode, setPendingMoveNode] = useState<FileNode | null>(null);
    const [moveTargetId, setMoveTargetId] = useState<string>('root');
    const [trashOpen, setTrashOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        open: false,
        x: 0,
        y: 0,
        node: null,
    });
    const contextMenuRef = useRef<HTMLDivElement | null>(null);

    // Listen for toggle-sidebar event from Header
    useEffect(() => {
        const handleToggle = () => {
            if (window.matchMedia('(min-width: 1024px)').matches) {
                toggleSidebarVisible();
            } else {
                setIsMobileOpen(prev => !prev);
            }
        };
        window.addEventListener('toggle-sidebar', handleToggle);
        return () => window.removeEventListener('toggle-sidebar', handleToggle);
    }, [toggleSidebarVisible]);

    // Listen for global shortcut events dispatched by Header.
    useEffect(() => {
        const handleOpenNewFileDialog = () => {
            if (!activeProjectId) {
                toast.info('Select a project first to create a file.');
                return;
            }
            setPendingNodeType('file');
            setPendingParentId(null);
            setOpenCreateNode(true);
        };

        const handleOpenNewProjectDialog = () => {
            setOpenCreateProject(true);
        };

        window.addEventListener('open-new-file-dialog', handleOpenNewFileDialog);
        window.addEventListener('open-new-project-dialog', handleOpenNewProjectDialog);

        return () => {
            window.removeEventListener('open-new-file-dialog', handleOpenNewFileDialog);
            window.removeEventListener('open-new-project-dialog', handleOpenNewProjectDialog);
        };
    }, [activeProjectId, toast]);

    // -- CRUD Operations --

    const createProject = async (name: string) => {
        const id = await db.projects.add({
            name,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        setActiveProject(id as number);
        toast.success(`Project "${name}" created!`);
    };

    const createNode = async (type: 'file' | 'folder', parentId: number | null, name: string) => {
        if (!activeProjectId) {
            toast.error('Please select a project first');
            return;
        }

        const id = await db.nodes.add({
            projectId: activeProjectId,
            parentId,
            type,
            name,
            content: type === 'file' ? '# New File' : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        if (type === 'file') {
            resetSaveState();
            setActiveFile(id as number);
            setMarkdown('# New File');
            setSaved(new Date().toISOString());
            toast.success(`File "${name}" created!`);
        } else {
            toast.success(`Folder "${name}" created!`);
        }
    };

    const deleteNode = async (id: number) => {
        // Soft-delete: move to trash (filter excludes deletedAt). Folder delete cascades.
        const now = new Date();
        const all = activeProjectId
            ? await db.nodes.where('projectId').equals(activeProjectId).toArray()
            : await db.nodes.where('id').equals(id).toArray();
        const ids = new Set<number>([id]);
        let grew = true;
        while (grew) {
            grew = false;
            for (const n of all) {
                if (typeof n.id === 'number' && !ids.has(n.id) && n.parentId != null && ids.has(n.parentId)) {
                    ids.add(n.id);
                    grew = true;
                }
            }
        }
        for (const delId of ids) {
            await db.nodes.update(delId, { deletedAt: now, updatedAt: now });
        }
        if (activeFileId != null && ids.has(activeFileId)) {
            setActiveFile(null);
            setMarkdown('');
            resetSaveState();
        }
        return [...ids];
    };

    const restoreNode = async (id: number) => {
        // Restore node + ancestors so it is reachable in the tree
        const now = new Date();
        const node = await db.nodes.get(id);
        if (!node) return;
        let parentId = node.parentId;
        while (typeof parentId === 'number') {
            await db.nodes.update(parentId, { deletedAt: null, updatedAt: now });
            const parent = await db.nodes.get(parentId);
            parentId = parent?.parentId ?? null;
        }
        await db.nodes.update(id, { deletedAt: null, updatedAt: now });
        toast.success('Item restored');
    };

    const purgeNode = async (id: number) => {
        // Permanent delete (node + descendants)
        const all = activeProjectId
            ? await db.nodes.where('projectId').equals(activeProjectId).toArray()
            : [];
        const ids = new Set<number>([id]);
        let grew = true;
        while (grew) {
            grew = false;
            for (const n of all) {
                if (typeof n.id === 'number' && !ids.has(n.id) && n.parentId != null && ids.has(n.parentId)) {
                    ids.add(n.id);
                    grew = true;
                }
            }
        }
        for (const delId of ids) {
            await db.nodes.delete(delId);
        }
        if (activeFileId != null && ids.has(activeFileId)) {
            setActiveFile(null);
            setMarkdown('');
            resetSaveState();
        }
    };

    const emptyTrash = async () => {
        for (const n of trashedNodes) {
            if (typeof n.id === 'number') await purgeNode(n.id);
        }
        toast.success('Trash emptied');
    };

    const moveFolders = useMemo(
        () => projectNodes.filter((n) => n.type === 'folder' && typeof n.id === 'number'),
        [projectNodes]
    );

    const handleMoveConfirm = async () => {
        if (!pendingMoveNode?.id) return;
        const target: number | null = moveTargetId === 'root' ? null : Number(moveTargetId);
        // Prevent moving a folder into itself or its descendant
        if (target != null) {
            if (target === pendingMoveNode.id) {
                toast.error('Cannot move a folder into itself.');
                return;
            }
            let p = nodeById.get(target)?.parentId ?? null;
            while (p != null) {
                if (p === pendingMoveNode.id) {
                    toast.error('Cannot move a folder into its own child.');
                    return;
                }
                p = nodeById.get(p)?.parentId ?? null;
            }
        }
        await db.nodes.update(pendingMoveNode.id, { parentId: target, updatedAt: new Date() });
        toast.success(`Moved "${pendingMoveNode.name}"`);
        setOpenMoveNode(false);
        setPendingMoveNode(null);
    };

    const renameNode = async (id: number, name: string) => {
        await db.nodes.update(id, {
            name,
            updatedAt: new Date(),
        });
    };

    const loadFile = async (id: number) => {
        const file = await db.nodes.get(id);
        if (file && file.type === 'file' && !file.deletedAt) {
            resetSaveState();
            setActiveFile(id);
            setMarkdown(file.content || '');
            const timestamp = file.updatedAt instanceof Date
                ? file.updatedAt.toISOString()
                : new Date(file.updatedAt).toISOString();
            setSaved(timestamp);
        }
    };

    // -- Event Handlers for Dialogs --

    const handleCreateProjectSubmit = (name: string) => {
        createProject(name);
    };

    const handleCreateNodeSubmit = (name: string) => {
        if (!pendingNodeType) return;
        createNode(pendingNodeType, pendingParentId, name);
        setPendingNodeType(null);
        setPendingParentId(null);
    };

    const handleDeleteConfirm = () => {
        if (!pendingDeleteId) return;
        const targetId = pendingDeleteId;
        setPendingDeleteId(null);
        void deleteNode(targetId).then((ids) => {
            toast.success('Moved to trash', {
                duration: 6000,
                actionLabel: 'Undo',
                onAction: () => {
                    void (async () => {
                        const now = new Date();
                        for (const restoreId of ids) {
                            await db.nodes.update(restoreId, { deletedAt: null, updatedAt: now });
                        }
                        toast.success('Restored');
                    })();
                },
            });
        });
    };

    const handleRenameNodeSubmit = async (name: string) => {
        if (!pendingRenameNode?.id) return;
        const targetId = pendingRenameNode.id;
        const oldName = pendingRenameNode.name;
        await renameNode(targetId, name);
        toast.success(`Renamed to "${name}"`, {
            duration: 6000,
            actionLabel: 'Undo',
            onAction: () => {
                void renameNode(targetId, oldName).then(() => toast.success(`Restored "${oldName}"`));
            },
        });
        setOpenRenameNode(false);
        setPendingRenameNode(null);
    };

    const handleDownloadProjectZip = async () => {
        if (!activeProjectId) {
            toast.error('Select a project first to download it.');
            return;
        }
        try {
            const result = await buildProjectZip(activeProjectId);
            await triggerDownload(result.blob, result.filename);
            toast.success(`Project ZIP ready (${result.fileCount} file${result.fileCount === 1 ? '' : 's'})`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to download project ZIP';
            toast.error(message);
        }
    };

    const openContextMenuAt = (node: FileNode, x: number, y: number) => {
        // Clamp to viewport so the menu never renders off-screen (m-16)
        const MENU_W = 200;
        const MENU_H = 180;
        const cx = Math.min(Math.max(8, x), Math.max(8, window.innerWidth - MENU_W - 8));
        const cy = Math.min(Math.max(8, y), Math.max(8, window.innerHeight - MENU_H - 8));
        setContextMenu({
            open: true,
            x: cx,
            y: cy,
            node,
        });
    };

    const closeContextMenu = () => {
        setContextMenu((prev) => ({ ...prev, open: false, node: null }));
    };

    const openContextMenuFromKeyboard = (node: FileNode, target: HTMLElement) => {
        const rect = target.getBoundingClientRect();
        openContextMenuAt(node, rect.left + 8, rect.bottom + 4);
    };

    const handleContextAction = async (action: 'open' | 'new-file' | 'rename' | 'delete' | 'move') => {
        const targetNode = contextMenu.node;
        if (!targetNode?.id) return;

        closeContextMenu();

        if (action === 'open' && targetNode.type === 'file') {
            await loadFile(targetNode.id);
            return;
        }

        if (action === 'new-file' && targetNode.type === 'folder') {
            setPendingNodeType('file');
            setPendingParentId(targetNode.id);
            setOpenCreateNode(true);
            return;
        }

        if (action === 'rename') {
            setPendingRenameNode(targetNode);
            setOpenRenameNode(true);
            return;
        }

        if (action === 'move') {
            setPendingMoveNode(targetNode);
            setMoveTargetId('root');
            setOpenMoveNode(true);
            return;
        }

        if (action === 'delete') {
            setPendingDeleteId(targetNode.id);
            setOpenDeleteNode(true);
        }
    };

    useEffect(() => {
        if (!contextMenu.open) return;

        const handleClickOutside = (event: MouseEvent) => {
            const menuEl = contextMenuRef.current;
            if (menuEl && event.target instanceof Node && menuEl.contains(event.target)) return;
            closeContextMenu();
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeContextMenu();
        };
        const handleScroll = () => closeContextMenu();

        window.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('keydown', handleEscape);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            window.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('keydown', handleEscape);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [contextMenu.open]);

    // -- Search / Filter (memoized) --

    const normalizedQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);
    const isFiltering = normalizedQuery.length > 0;

    const nodeById = useMemo(() => {
        const map = new Map<number, FileNode>();
        for (const node of projectNodes) {
            if (typeof node.id === 'number') map.set(node.id, node);
        }
        return map;
    }, [projectNodes]);

    const nodesByParent = useMemo(() => {
        const map = new Map<number | null, FileNode[]>();
        for (const node of projectNodes) {
            const parentKey = node.parentId ?? null;
            const existing = map.get(parentKey);
            if (existing) {
                existing.push(node);
            } else {
                map.set(parentKey, [node]);
            }
        }
        return map;
    }, [projectNodes]);

    const visibleNodeIds = useMemo(() => {
        if (!isFiltering) return null;

        const visible = new Set<number>();
        // Match names AND file content (substring, case-insensitive)
        const matched = projectNodes.filter((node) => {
            if (node.name.toLowerCase().includes(normalizedQuery)) return true;
            if (node.type === 'file' && typeof node.content === 'string') {
                return node.content.toLowerCase().includes(normalizedQuery);
            }
            return false;
        });

        for (const node of matched) {
            if (typeof node.id !== 'number') continue;
            visible.add(node.id);

            // Preserve folder context for matched descendants by including ancestors.
            let parentId = node.parentId;
            while (typeof parentId === 'number') {
                visible.add(parentId);
                parentId = nodeById.get(parentId)?.parentId ?? null;
            }
        }

        return visible;
    }, [isFiltering, nodeById, normalizedQuery, projectNodes]);

    const hasFilterMatches = !isFiltering || ((visibleNodeIds?.size || 0) > 0);

    const toggleFavorite = async (id: number, value: boolean) => {
        await db.nodes.update(id, { isFavorite: value || undefined, updatedAt: new Date() });
    };

    /** Highlight query matches in a file/folder name. */
    const highlightName = (name: string) => {
        if (!isFiltering) return name;
        const idx = name.toLowerCase().indexOf(normalizedQuery);
        if (idx === -1) return name;
        return (
            <>
                {name.slice(0, idx)}
                <mark className="bg-yellow-500/40 rounded-sm">{name.slice(idx, idx + normalizedQuery.length)}</mark>
                {name.slice(idx + normalizedQuery.length)}
            </>
        );
    };

    /** First content line containing the query, for content-only matches. */
    const contentSnippet = (node: FileNode): string | null => {
        if (!isFiltering || node.type !== 'file' || typeof node.content !== 'string') return null;
        if (node.name.toLowerCase().includes(normalizedQuery)) return null;
        const line = node.content.split('\n').find((l) => l.toLowerCase().includes(normalizedQuery));
        if (!line) return null;
        const trimmed = line.trim().slice(0, 80);
        return trimmed.length < line.trim().length ? `${trimmed}…` : trimmed;
    };

    // -- Render Helpers --

    const NodeItem = ({ node }: { node: FileNode }) => {
        const isExpanded = isFiltering ? true : expandedFolders[node.id!];

        if (node.type === 'folder') {
            return (
                <div className="pl-2 group">
                    <div
                        className="flex items-center gap-1 p-1 hover:bg-[var(--sidebar-hover)] rounded text-[var(--sidebar-fg)] focus-within:bg-[var(--sidebar-hover)]"
                        onContextMenu={(e) => {
                            e.preventDefault();
                            openContextMenuAt(node, e.clientX, e.clientY);
                        }}
                    >
                        <button
                            type="button"
                            className="flex-1 flex items-center gap-1 text-left focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded"
                            onClick={() => setExpandedFolders(prev => ({ ...prev, [node.id!]: !prev[node.id!] }))}
                            aria-expanded={isExpanded}
                            onKeyDown={(e) => {
                                if ((e.shiftKey && e.key === 'F10') || e.key === 'ContextMenu') {
                                    e.preventDefault();
                                    openContextMenuFromKeyboard(node, e.currentTarget);
                                }
                            }}
                        >
                            {isExpanded ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
                            <Folder size={14} className="text-[var(--accent)]" aria-hidden="true" />
                            <span className="text-sm">{highlightName(node.name)}</span>
                        </button>
                        <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                            <button
                                type="button"
                                className="focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded p-1"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPendingNodeType('file');
                                    setPendingParentId(node.id!);
                                    setOpenCreateNode(true);
                                }}
                                title="New File (Ctrl/Cmd+Shift+N)"
                                aria-label={`Create new file in ${node.name} (Ctrl/Cmd+Shift+N)`}
                            >
                                <FilePlus size={12} />
                            </button>
                        </div>
                    </div>
                    {isExpanded && <NodeList parentId={node.id!} />}
                </div>
            );
        }

        return (
            <div
                className={`flex items-center gap-2 p-1 pl-4 hover:bg-[var(--sidebar-hover)] rounded text-sm ${activeFileId === node.id ? 'bg-[var(--sidebar-hover)] text-[var(--sidebar-fg)] font-medium' : 'text-[var(--sidebar-muted)]'}`}
                onContextMenu={(e) => {
                    e.preventDefault();
                    openContextMenuAt(node, e.clientX, e.clientY);
                }}
            >
                <button
                    type="button"
                    className="flex-1 flex items-center gap-2 text-left focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded min-w-0"
                    onClick={() => loadFile(node.id!)}
                    onKeyDown={(e) => {
                        if ((e.shiftKey && e.key === 'F10') || e.key === 'ContextMenu') {
                            e.preventDefault();
                            openContextMenuFromKeyboard(node, e.currentTarget);
                        }
                    }}
                >
                    <FileText size={14} aria-hidden="true" className="shrink-0" />
                    <span className="truncate">
                        {highlightName(node.name)}
                        {(() => {
                            const snippet = contentSnippet(node);
                            return snippet ? (
                                <span className="block text-[11px] opacity-70 truncate">…{snippet}</span>
                            ) : null;
                        })()}
                    </span>
                </button>
                <button
                    type="button"
                    className={`rounded p-1 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${node.isFavorite ? 'text-yellow-400' : 'text-[var(--sidebar-icon)] hover:text-yellow-400 opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
                    onClick={() => void toggleFavorite(node.id!, !node.isFavorite)}
                    title={node.isFavorite ? 'Unpin' : 'Pin to favorites'}
                    aria-label={node.isFavorite ? `Unpin ${node.name}` : `Pin ${node.name} to favorites`}
                    aria-pressed={!!node.isFavorite}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={node.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                </button>
                <button
                    type="button"
                    className="ml-auto text-red-500 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
                    onClick={() => {
                        setPendingDeleteId(node.id!);
                        setOpenDeleteNode(true);
                    }}
                    aria-label={`Delete ${node.name}`}
                >
                    <Trash2 size={12} />
                </button>
            </div>
        );
    };

    const NodeList = ({ parentId }: { parentId: number | null }) => {
        const nodes = nodesByParent.get(parentId) || [];
        const filteredNodes = isFiltering && visibleNodeIds
            ? nodes.filter((node) => typeof node.id === 'number' && visibleNodeIds.has(node.id))
            : nodes;

        return (
            <div className="flex flex-col">
                {filteredNodes.map(node => (
                    <NodeItem key={node.id} node={node} />
                ))}
            </div>
        );
    };

    const RecentsList = () => {
        // NOTE: Dexie `reverse()` before `sortBy()` is ignored — sortBy always
        // returns ascending. Take the tail then reverse to show newest 5.
        // Verified against live data shape (updatedAt Date); keep if index added later
        // prefer: db.nodes.orderBy('updatedAt').reverse().limit(5)
        const recents = useLiveQuery(() =>
            db.nodes
                .where('type').equals('file')
                .sortBy('updatedAt')
        ) || [];

        const recentFiles = recents.filter((f) => !f.deletedAt).slice(-5).reverse();

        if (recentFiles.length === 0) return <div className="text-[var(--sidebar-muted)] text-xs italic">No recent files</div>;

        return (
            <div className="space-y-1">
                {recentFiles.map(file => (
                    <button
                        key={file.id}
                        className="flex items-center gap-2 p-1 hover:bg-[var(--sidebar-hover)] rounded w-full text-left text-xs text-[var(--sidebar-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        onClick={() => {
                            if (file.projectId) setActiveProject(file.projectId);
                            loadFile(file.id!);
                        }}
                    >
                        <FileText size={12} aria-hidden="true" />
                        <span className="truncate">{file.name}</span>
                    </button>
                ))}
            </div>
        );
    };

    const FavoritesList = () => {
        // isFavorite is unindexed (booleans aren't valid IndexedDB keys) — filter in memory
        const favs = useLiveQuery(() =>
            db.nodes
                .filter((n) => n.isFavorite === true && !n.deletedAt && n.type === 'file')
                .sortBy('updatedAt')
        ) || [];

        const favorites = [...favs].reverse();

        if (favorites.length === 0) return <div className="text-[var(--sidebar-muted)] text-xs italic">No favorites yet — star a file to pin it</div>;

        return (
            <div className="space-y-1">
                {favorites.map(file => (
                    <button
                        key={file.id}
                        className="flex items-center gap-2 p-1 hover:bg-[var(--sidebar-hover)] rounded w-full text-left text-xs text-[var(--sidebar-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        onClick={() => {
                            if (file.projectId) setActiveProject(file.projectId);
                            loadFile(file.id!);
                        }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400 shrink-0" aria-hidden="true">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span className="truncate">{file.name}</span>
                    </button>
                ))}
            </div>
        );
    };

    return (
        <>
            {/* Mobile overlay */}
            {isMobileOpen && (
                <button
                    type="button"
                    className="fixed inset-0 bg-[var(--overlay-bg)] z-40 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                    aria-label="Close sidebar"
                />
            )}

            {/* Sidebar with responsive classes */}
            <aside
                aria-label="Projects and files"
                aria-hidden={!sidebarVisible && !isMobileOpen}
                inert={!sidebarVisible && !isMobileOpen ? true : undefined}
                className={`
          h-full bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] flex flex-col
          fixed lg:static top-0 left-0 z-50
          transform transition-all duration-300 ease-in-out overflow-hidden
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          ${sidebarVisible ? 'lg:translate-x-0 lg:w-64 lg:border-r lg:pointer-events-auto' : 'lg:-translate-x-full lg:w-0 lg:border-r-0 lg:pointer-events-none'}
          w-64
        `}
            >
                {/* Mobile close button */}
                <button
                    type="button"
                    className="lg:hidden absolute top-3 right-3 min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-full bg-[var(--sidebar-bg)] text-[var(--sidebar-icon)] hover:text-[var(--sidebar-fg)] z-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    onClick={() => setIsMobileOpen(false)}
                    aria-label="Close sidebar"
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                {/* Projects Dropdown / Header */}
                <div className="p-3 border-[var(--sidebar-border)]" role="group" aria-label="Projects">
                    {/* pr reserves room for the mobile close × (36px at right-3 → 48px, lg:hidden) */}
                    <div className="flex justify-between items-center mb-2 pr-12 lg:pr-0">
                        <h2 className="text-xs font-bold text-[var(--sidebar-muted)] uppercase tracking-wider">Projects</h2>
                        <button
                            type="button"
                            onClick={() => setOpenCreateProject(true)}
                            className="text-[var(--sidebar-icon)] hover:text-[var(--sidebar-fg)]"
                            aria-label="Create new project"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                    <select
                        className="w-full bg-[var(--sidebar-input-bg)] text-[var(--sidebar-fg)] text-sm rounded p-1 border border-[var(--sidebar-border)]"
                        value={activeProjectId || ''}
                        onChange={(e) => setActiveProject(Number(e.target.value))}
                        aria-label="Select project"
                    >
                        <option value="" disabled>
                            Select Project...
                        </option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* File Tree */}
                <div className="flex-1 overflow-auto p-2" role="region" aria-label="File Explorer" tabIndex={0}>
                    {activeProjectId ? (
                        <>
                            <div className="flex justify-between items-center px-2 mb-2">
                                <span className="text-xs text-[var(--sidebar-muted)]">Explorer</span>
                                <div className="flex gap-1" role="toolbar" aria-label="Create new items">
                                    <button
                                        type="button"
                                        onClick={() => void handleDownloadProjectZip()}
                                        title="Download Project ZIP"
                                        aria-label="Download current project as zip"
                                    >
                                        <Download size={14} className="text-[var(--sidebar-icon)]" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPendingNodeType('folder');
                                            setPendingParentId(null);
                                            setOpenCreateNode(true);
                                        }}
                                        title="New Folder"
                                        aria-label="Create new folder"
                                    >
                                        <FolderPlus size={14} className="text-[var(--sidebar-icon)]" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPendingNodeType('file');
                                            setPendingParentId(null);
                                            setOpenCreateNode(true);
                                        }}
                                        title="New File (Ctrl/Cmd+Shift+N)"
                                        aria-label="Create new file (Ctrl/Cmd+Shift+N)"
                                    >
                                        <FilePlus size={14} className="text-[var(--sidebar-icon)]" />
                                    </button>
                                </div>
                            </div>
                            <div className="px-2 mb-2">
                                <label htmlFor="sidebar-search" className="sr-only">
                                    Search files and folders
                                </label>
                                <input
                                    id="sidebar-search"
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape' && searchQuery.length > 0) {
                                            e.preventDefault();
                                            setSearchQuery('');
                                        }
                                    }}
                                    placeholder="Search names + content…"
                                    aria-label="Search file names and content"
                                    className="w-full bg-[var(--sidebar-input-bg)] text-[var(--sidebar-fg)] text-sm rounded p-1 border border-[var(--sidebar-border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                />
                            </div>
                            {hasFilterMatches ? (
                                <NodeList parentId={null} />
                            ) : (
                                <div className="text-center text-sm mt-8 px-4">
                                    <p className="text-[var(--sidebar-muted)] mb-3">No matching files or folders</p>
                                    {isFiltering && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="px-3 min-h-[40px] rounded bg-[var(--button-secondary-bg)] hover:bg-[var(--button-secondary-hover)] text-[var(--button-fg)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                        >
                                            Clear search
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center text-sm mt-10 px-4">
                            <p className="text-[var(--sidebar-muted)] mb-3">Select a project to view files</p>
                            <button
                                type="button"
                                onClick={() => setOpenCreateProject(true)}
                                className="px-3 min-h-[40px] rounded bg-[var(--button-primary-bg)] text-[var(--button-fg)] hover:bg-[var(--button-primary-hover)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            >
                                New project
                            </button>
                        </div>
                    )}
                </div>

                {/* In-app table of contents for the open document */}
                {activeFileId && <TableOfContents />}

                {/* Pinned & recent — one list language (4.1) */}
                <div className="p-3 border-t border-[var(--sidebar-border)]" role="group" aria-label="Pinned and recent files">
                    <h2 className="text-xs font-bold text-[var(--sidebar-muted)] uppercase tracking-wider mb-2">Pinned & recent</h2>
                    <FavoritesList />
                    <div className="my-2 border-t border-[var(--sidebar-border)]" aria-hidden="true" />
                    <RecentsList />
                </div>

                {/* Trash — collapsed footer row with count badge (4.1) */}
                {activeProjectId && (
                    <div className="p-2 border-t border-[var(--sidebar-border)]" role="group" aria-label="Trash">
                        <button
                            type="button"
                            onClick={() => setTrashOpen((v) => !v)}
                            aria-expanded={trashOpen}
                            className="flex w-full items-center gap-2 rounded px-2 min-h-[36px] text-xs font-bold uppercase tracking-wider text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        >
                            <Trash2 size={14} aria-hidden="true" />
                            <span className="flex-1 text-left">
                                Trash{trashedNodes.length > 0 ? ` (${trashedNodes.length})` : ''}
                            </span>
                            <ChevronRight size={14} aria-hidden="true" className={`transition-transform ${trashOpen ? 'rotate-90' : ''}`} />
                        </button>
                        {trashOpen && (
                            <div className="mt-1 px-2 pb-1">
                                {trashedNodes.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => void emptyTrash()}
                                        className="mb-1 text-xs text-red-500 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-1 min-h-[36px]"
                                    >
                                        Empty trash
                                    </button>
                                )}
                        {trashedNodes.length === 0 ? (
                            <div className="text-[var(--sidebar-muted)] text-xs italic">Trash is empty</div>
                        ) : (
                            <div className="space-y-1 max-h-40 overflow-auto" role="region" aria-label="Trashed items" tabIndex={0}>
                                {trashedNodes.map((node) => (
                                    <div key={node.id} className="flex items-center gap-1 text-xs text-[var(--sidebar-muted)]">
                                        <span className="flex-1 truncate">{node.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => typeof node.id === 'number' && void restoreNode(node.id)}
                                            className="px-1.5 py-1 hover:bg-[var(--sidebar-hover)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                            aria-label={`Restore ${node.name}`}
                                        >
                                            Restore
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => typeof node.id === 'number' && void purgeNode(node.id).then(() => toast.success('Permanently deleted'))}
                                            className="px-1.5 py-1 text-red-500 hover:text-red-400 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                                            aria-label={`Delete ${node.name} forever`}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                            </div>
                        )}
                    </div>
                )}
            </aside>

            {/* Context Menu */}
            {contextMenu.open && contextMenu.node && (
                <div
                    ref={contextMenuRef}
                    role="menu"
                    aria-label={`${contextMenu.node.type === 'file' ? 'File' : 'Folder'} actions`}
                    className="fixed z-[100] min-w-[160px] bg-[var(--dropdown-bg)] border border-[var(--dropdown-border)] rounded shadow-lg p-1"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    {contextMenu.node.type === 'file' ? (
                        <>
                            <button
                                type="button"
                                role="menuitem"
                                className="w-full text-left px-3 py-1.5 text-sm text-[var(--dropdown-fg)] hover:bg-[var(--dropdown-hover)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                onClick={() => void handleContextAction('open')}
                            >
                                Open
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                className="w-full text-left px-3 py-1.5 text-sm text-[var(--dropdown-fg)] hover:bg-[var(--dropdown-hover)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                onClick={() => void handleContextAction('rename')}
                            >
                                Rename
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                className="w-full text-left px-3 py-1.5 text-sm text-[var(--dropdown-fg)] hover:bg-[var(--dropdown-hover)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                onClick={() => void handleContextAction('move')}
                            >
                                Move to…
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                className="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-[var(--dropdown-hover)] rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                                onClick={() => void handleContextAction('delete')}
                            >
                                Delete
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                role="menuitem"
                                className="w-full text-left px-3 py-1.5 text-sm text-[var(--dropdown-fg)] hover:bg-[var(--dropdown-hover)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                onClick={() => void handleContextAction('new-file')}
                            >
                                New File (Ctrl/Cmd+Shift+N)
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                className="w-full text-left px-3 py-1.5 text-sm text-[var(--dropdown-fg)] hover:bg-[var(--dropdown-hover)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                onClick={() => void handleContextAction('rename')}
                            >
                                Rename
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                className="w-full text-left px-3 py-1.5 text-sm text-[var(--dropdown-fg)] hover:bg-[var(--dropdown-hover)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                onClick={() => void handleContextAction('move')}
                            >
                                Move to…
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                className="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-[var(--dropdown-hover)] rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                                onClick={() => void handleContextAction('delete')}
                            >
                                Delete
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Create Project Dialog */}
            <InputDialog
                open={openCreateProject}
                onOpenChange={setOpenCreateProject}
                title="Create Project"
                description="Enter a name for your new project"
                placeholder="My Project"
                onSubmit={handleCreateProjectSubmit}
                validate={(v) => (!v.trim() ? 'Project name is required' : null)}
            />

            {/* Create Node Dialog (File/Folder) */}
            <InputDialog
                open={openCreateNode}
                onOpenChange={setOpenCreateNode}
                title={`Create New ${pendingNodeType === 'file' ? 'File' : 'Folder'}`}
                description={`Enter a name for your new ${pendingNodeType}`}
                placeholder={pendingNodeType === 'file' ? 'document.md' : 'Folder Name'}
                onSubmit={handleCreateNodeSubmit}
                validate={(v) => (!v.trim() ? 'Name is required' : null)}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={openDeleteNode}
                onOpenChange={setOpenDeleteNode}
                title="Move to trash?"
                description="This item will be moved to trash. You can restore it or delete it forever from the Trash section."
                confirmText="Move to trash"
                cancelText="Cancel"
                onConfirm={handleDeleteConfirm}
                destructive
            />

            {/* Rename Node Dialog */}
            <InputDialog
                open={openRenameNode}
                onOpenChange={(open) => {
                    setOpenRenameNode(open);
                    if (!open) setPendingRenameNode(null);
                }}
                title={`Rename ${pendingRenameNode?.type === 'folder' ? 'Folder' : 'File'}`}
                description="Enter a new name"
                defaultValue={pendingRenameNode?.name || ''}
                placeholder={pendingRenameNode?.type === 'folder' ? 'Folder name' : 'file.md'}
                onSubmit={handleRenameNodeSubmit}
                validate={(v) => (!v.trim() ? 'Name is required' : null)}
                submitText="Rename"
            />

            {/* Move To Dialog */}
            <Dialog.Root
                open={openMoveNode}
                onOpenChange={(open) => {
                    setOpenMoveNode(open);
                    if (!open) setPendingMoveNode(null);
                }}
            >
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                    <Dialog.Content
                        aria-describedby="move-dialog-description"
                        className="fixed top-1/2 left-1/2 w-[360px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded border border-[var(--dialog-border)] bg-[var(--dialog-bg)] p-4 text-[var(--dialog-fg)] shadow-xl z-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    >
                        <Dialog.Title className="text-base font-semibold">
                            Move “{pendingMoveNode?.name}”
                        </Dialog.Title>
                        <Dialog.Description id="move-dialog-description" className="mt-1 text-sm text-[var(--sidebar-muted)]">
                            Choose a destination folder.
                        </Dialog.Description>
                        <label htmlFor="move-target" className="sr-only">
                            Destination folder
                        </label>
                        <select
                            id="move-target"
                            value={moveTargetId}
                            onChange={(e) => setMoveTargetId(e.target.value)}
                            className="mt-4 w-full rounded border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--input-fg)]"
                        >
                            <option value="root">Top level</option>
                            {moveFolders
                                .filter((f) => f.id !== pendingMoveNode?.id)
                                .map((f) => (
                                    <option key={f.id} value={String(f.id)}>
                                        {f.name}
                                    </option>
                                ))}
                        </select>
                        <div className="mt-4 flex justify-end gap-2">
                            <Dialog.Close asChild>
                                <Button variant="secondary">
                                    Cancel
                                </Button>
                            </Dialog.Close>
                            <Button
                                variant="primary"
                                onClick={() => void handleMoveConfirm()}
                            >
                                Move
                            </Button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    );
}
