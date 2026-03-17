'use client';

import React, { useState, useEffect } from 'react';
import { Folder, FileText, Plus, Trash2, ChevronRight, ChevronDown, FolderPlus, FilePlus } from 'lucide-react';
import { useMarkdownStore } from '../store';
import { db, Project, FileNode } from '../services/Database';
import { useLiveQuery } from 'dexie-react-hooks';

export function Sidebar() {
    const {
        activeProjectId, activeFileId,
        setActiveProject, setActiveFile,
        setMarkdown
    } = useMarkdownStore();

    const projects = useLiveQuery(() => db.projects.toArray()) || [];
    const [expandedFolders, setExpandedFolders] = useState<Record<number, boolean>>({});
    const [isMobileOpen, setIsMobileOpen] = useState(false); // Mobile state

    // Listen for toggle-sidebar event from Header
    useEffect(() => {
        const handleToggle = () => setIsMobileOpen(prev => !prev);
        window.addEventListener('toggle-sidebar', handleToggle);
        return () => window.removeEventListener('toggle-sidebar', handleToggle);
    }, []);

    // -- CRUD Operations --

    const createProject = async () => {
        const name = prompt("Project Name:");
        if (!name) return;
        const id = await db.projects.add({
            name,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        setActiveProject(id as number);
    };

    const createNode = async (type: 'file' | 'folder', parentId: number | null = null) => {
        if (!activeProjectId) {
            alert("Please select a project first.");
            return;
        }
        const name = prompt(`New ${type} name:`);
        if (!name) return;

        const id = await db.nodes.add({
            projectId: activeProjectId,
            parentId,
            type,
            name,
            content: type === 'file' ? '# New File' : undefined,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        if (type === 'file') {
            setActiveFile(id as number);
            setMarkdown('# New File');
        }
    };

    const deleteNode = async (id: number) => {
        if (confirm("Are you sure?")) {
            await db.nodes.delete(id);
            if (activeFileId === id) {
                setActiveFile(null);
                setMarkdown('');
            }
        }
    };

    const loadFile = async (id: number) => {
        const file = await db.nodes.get(id);
        if (file && file.type === 'file') {
            setActiveFile(id);
            setMarkdown(file.content || '');
        }
    };

    // -- Render Helpers --

    const NodeItem = ({ node }: { node: FileNode }) => {
        const isExpanded = expandedFolders[node.id!];

        if (node.type === 'folder') {
            return (
                <div className="pl-2">
                    <div
                        className="flex items-center gap-1 p-1 hover:bg-[var(--sidebar-hover)] rounded cursor-pointer text-[var(--sidebar-fg)]"
                        onClick={() => setExpandedFolders(prev => ({ ...prev, [node.id!]: !prev[node.id!] }))}
                    >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <Folder size={14} className="text-[var(--accent)]" />
                        <span className="text-sm">{node.name}</span>
                        <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100">
                            <button onClick={(e) => { e.stopPropagation(); createNode('file', node.id); }} title="New File"><FilePlus size={12} /></button>
                        </div>
                    </div>
                    {isExpanded && <NodeList parentId={node.id!} />}
                </div>
            );
        }

        return (
            <div
                className={`flex items-center gap-2 p-1 pl-4 hover:bg-[var(--sidebar-hover)] rounded cursor-pointer text-sm ${activeFileId === node.id ? 'bg-[var(--sidebar-hover)] text-[var(--sidebar-fg)] font-medium' : 'text-[var(--sidebar-muted)]'}`}
                onClick={() => loadFile(node.id!)}
            >
                <FileText size={14} />
                <span className="truncate">{node.name}</span>
                <button className="ml-auto text-red-500 hover:text-red-400" onClick={(e) => { e.stopPropagation(); deleteNode(node.id!); }}>
                    <Trash2 size={12} />
                </button>
            </div>
        );
    };

    const NodeList = ({ parentId }: { parentId: number | null }) => {
        const nodes = useLiveQuery(
            () => activeProjectId
                ? db.nodes.where({ projectId: activeProjectId, parentId }).toArray()
                : []
            , [activeProjectId, parentId]) || [];

        return (
            <div className="flex flex-col">
                {nodes.map(node => <NodeItem key={node.id} node={node} />)}
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
                    <div
                        key={file.id}
                        className="flex items-center gap-2 p-1 hover:bg-[var(--sidebar-hover)] rounded cursor-pointer text-xs text-[var(--sidebar-muted)]"
                        onClick={() => {
                            if (file.projectId) setActiveProject(file.projectId);
                            loadFile(file.id!);
                        }}
                    >
                        <FileText size={12} />
                        <span className="truncate">{file.name}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            {/* Mobile overlay */}
            {isMobileOpen && (
                <div 
                    className="fixed inset-0 bg-[var(--overlay-bg)] z-40 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
            
            {/* Sidebar with responsive classes */}
            <div className={`
                h-full bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] flex flex-col
                fixed lg:static top-0 left-0 z-50
                transform transition-transform duration-300 ease-in-out
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                w-64 lg:w-64
            `}>
                {/* Mobile close button */}
                <button 
                    className="lg:hidden absolute top-2 right-2 text-[var(--sidebar-icon)] hover:text-[var(--sidebar-fg)] z-50"
                    onClick={() => setIsMobileOpen(false)}
                >
                    <Trash2 size={16} />
                </button>
                
                {/* Projects Dropdown / Header */}
            <div className="p-3 border-[var(--sidebar-border)]">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xs font-bold text-[var(--sidebar-muted)] uppercase tracking-wider">Projects</h2>
                    <button onClick={createProject} className="text-[var(--sidebar-icon)] hover:text-[var(--sidebar-fg)]"><Plus size={14} /></button>
                </div>
                <select
                    className="w-full bg-[var(--sidebar-input-bg)] text-[var(--sidebar-fg)] text-sm rounded p-1 border border-[var(--sidebar-border)]"
                    value={activeProjectId || ''}
                    onChange={(e) => setActiveProject(Number(e.target.value))}
                >
                    <option value="" disabled>Select Project...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>

            {/* Recents */}
            <div className="p-3 border-[var(--sidebar-border)]">
                <h2 className="text-xs font-bold text-[var(--sidebar-muted)] uppercase tracking-wider mb-2">Recents</h2>
                {/* We need a separate component or query for Recents to avoid hooks rules issues if we put useLiveQuery conditionally */}
                <RecentsList />
            </div>

            {/* File Tree */}
            <div className="flex-1 overflow-auto p-2">
                {activeProjectId ? (
                    <>
                        <div className="flex justify-between items-center px-2 mb-2">
                            <span className="text-xs text-[var(--sidebar-muted)]">Explorer</span>
                            <div className="flex gap-1">
                                <button onClick={() => createNode('folder')} title="New Folder"><FolderPlus size={14} className="text-[var(--sidebar-icon)]" /></button>
                                <button onClick={() => createNode('file')} title="New File"><FilePlus size={14} className="text-[var(--sidebar-icon)]" /></button>
                            </div>
                        </div>
                        <NodeList parentId={null} />
                    </>
                ) : (
                    <div className="text-[var(--sidebar-muted)] text-center text-sm mt-10">Select a project to view files</div>
                )}
            </div>
        </div>
        </>
    );
}
