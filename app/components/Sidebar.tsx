'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Folder, FileText, Plus, Trash2, ChevronRight, ChevronDown, FolderPlus, FilePlus, Download } from 'lucide-react';
import { useMarkdownStore } from '../store';
import { db, FileNode } from '../services/Database';
import { useLiveQuery } from 'dexie-react-hooks';
import { ConfirmDialog, InputDialog } from './dialogs';
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
    } = useMarkdownStore();
    const toast = useToast();

    const projects = useLiveQuery(() => db.projects.toArray()) || [];
    const projectNodesResult = useLiveQuery(
        () => (activeProjectId ? db.nodes.where('projectId').equals(activeProjectId).toArray() : []),
        [activeProjectId]
    );
    const projectNodes = useMemo(() => projectNodesResult || [], [projectNodesResult]);
    const [expandedFolders, setExpandedFolders] = useState<Record<number, boolean>>({});
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Dialog states
    const [openCreateProject, setOpenCreateProject] = useState(false);
    const [openCreateNode, setOpenCreateNode] = useState(false);
    const [pendingNodeType, setPendingNodeType] = useState<'file' | 'folder' | null>(null);
    const [pendingParentId, setPendingParentId] = useState<number | null>(null);
    const [openDeleteNode, setOpenDeleteNode] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
    const [openRenameNode, setOpenRenameNode] = useState(false);
    const [pendingRenameNode, setPendingRenameNode] = useState<FileNode | null>(null);
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
        await db.nodes.delete(id);
        if (activeFileId === id) {
            setActiveFile(null);
            setMarkdown('');
            resetSaveState();
        }
    };

    const renameNode = async (id: number, name: string) => {
        await db.nodes.update(id, {
            name,
            updatedAt: new Date(),
        });
    };

    const loadFile = async (id: number) => {
        const file = await db.nodes.get(id);
        if (file && file.type === 'file') {
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
        deleteNode(pendingDeleteId);
        setPendingDeleteId(null);
        toast.success('Item deleted successfully');
    };

    const handleRenameNodeSubmit = async (name: string) => {
        if (!pendingRenameNode?.id) return;
        await renameNode(pendingRenameNode.id, name);
        toast.success(`Renamed to "${name}"`);
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
        setContextMenu({
            open: true,
            x,
            y,
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

    const handleContextAction = async (action: 'open' | 'new-file' | 'rename' | 'delete') => {
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
        const matched = projectNodes.filter((node) => node.name.toLowerCase().includes(normalizedQuery));

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
                            <span className="text-sm">{node.name}</span>
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
                    className="flex-1 flex items-center gap-2 text-left focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded"
                    onClick={() => loadFile(node.id!)}
                    onKeyDown={(e) => {
                        if ((e.shiftKey && e.key === 'F10') || e.key === 'ContextMenu') {
                            e.preventDefault();
                            openContextMenuFromKeyboard(node, e.currentTarget);
                        }
                    }}
                >
                    <FileText size={14} aria-hidden="true" />
                    <span className="truncate">{node.name}</span>
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
        const recents = useLiveQuery(() =>
            db.nodes
                .where('type').equals('file')
                .reverse()
                .sortBy('updatedAt')
        ) || [];

        const recentFiles = recents.slice(0, 5);

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
            <div
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
                    className="lg:hidden absolute top-2 right-2 text-[var(--sidebar-icon)] hover:text-[var(--sidebar-fg)] z-50"
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
                    <div className="flex justify-between items-center mb-2">
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

                {/* Recents */}
                <div className="p-3 border-[var(--sidebar-border)]" role="group" aria-label="Recent files">
                    <h2 className="text-xs font-bold text-[var(--sidebar-muted)] uppercase tracking-wider mb-2">Recents</h2>
                    <RecentsList />
                </div>

                {/* File Tree */}
                <div className="flex-1 overflow-auto p-2" role="group" aria-label="File Explorer">
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
                                    placeholder="Search files..."
                                    aria-label="Search files and folders"
                                    className="w-full bg-[var(--sidebar-input-bg)] text-[var(--sidebar-fg)] text-sm rounded p-1 border border-[var(--sidebar-border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                />
                            </div>
                            {hasFilterMatches ? (
                                <NodeList parentId={null} />
                            ) : (
                                <div className="text-[var(--sidebar-muted)] text-center text-sm mt-8">
                                    No matching files or folders
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-[var(--sidebar-muted)] text-center text-sm mt-10">
                            Select a project to view files
                        </div>
                    )}
                </div>
            </div>

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
                title="Delete Item"
                description="Are you sure you want to delete this item? This action cannot be undone."
                confirmText="Delete"
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
        </>
    );
}
