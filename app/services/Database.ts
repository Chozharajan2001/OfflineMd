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
  deletedAt?: Date | null; // Soft-delete (trash); null/undefined = visible
  isOpen?: boolean; // For folder expansion state (optional storage)
}

export class MarkdownDB extends Dexie {
  projects!: Table<Project, number>;
  nodes!: Table<FileNode, number>;
  // Keep legacy for migration support if needed, but we'll focus on new system
  documents!: Table<Record<string, unknown>, number>;

  constructor() {
    super('MarkdownConverterDB');
    this.version(2).stores({
      projects: '++id, name, updatedAt',
      nodes: '++id, projectId, parentId, type, name, updatedAt',
      documents: '++id, name, updatedAt' // Legacy support
    });
    // v3: soft-delete. Existing rows get deletedAt=undefined (visible).
    // Indexed on deletedAt so trash queries stay cheap.
    this.version(3).stores({
      projects: '++id, name, updatedAt',
      nodes: '++id, projectId, parentId, type, name, updatedAt, deletedAt',
      documents: '++id, name, updatedAt'
    });
  }
}

export const db = new MarkdownDB();