import Dexie, { Table } from 'dexie';

export interface Project {
  id?: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileNode {
  id?: number;
  projectId: number;
  parentId: number | null; // null for root level
  type: 'file' | 'folder';
  name: string;
  content?: string; // Only for files
  createdAt: Date;
  updatedAt: Date;
  isOpen?: boolean; // For folder expansion state (optional storage)
}

export class MarkdownDB extends Dexie {
  projects!: Table<Project, number>;
  nodes!: Table<FileNode, number>;
  // Keep legacy for migration support if needed, but we'll focus on new system
  documents!: Table<any, number>;

  constructor() {
    super('MarkdownConverterDB');
    this.version(2).stores({
      projects: '++id, name, updatedAt',
      nodes: '++id, projectId, parentId, type, name, updatedAt',
      documents: '++id, name, updatedAt' // Legacy support
    });
  }
}

export const db = new MarkdownDB();