import { db } from '../services/Database';
import { themes, useMarkdownStore } from '../store';

const BACKUP_VERSION = 1;

interface BackupPayload {
  version: number;
  exportedAt: string;
  projects: unknown[];
  nodes: unknown[];
  themeName: string | null;
}

/**
 * Export the whole workspace (all projects + nodes + theme) as a single JSON file.
 * Complements the per-project ZIP in zip-project.ts.
 */
export async function buildWorkspaceBackup(): Promise<{ blob: Blob; filename: string }> {
  const [projects, nodes] = await Promise.all([
    db.projects.toArray(),
    db.nodes.toArray(),
  ]);
  const themeName =
    Object.entries(themes).find(([, t]) => t.name === useMarkdownStore.getState().theme.name)?.[0] ?? null;

  const payload: BackupPayload = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    projects,
    nodes,
    themeName,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return { blob, filename: `markdown-backup_${timestamp}.json` };
}

/**
 * Restore a workspace backup. Validates shape, then replaces all projects/nodes
 * in a single Dexie transaction and re-applies the saved theme.
 * Returns counts for the success toast.
 */
export async function restoreWorkspaceBackup(file: File): Promise<{ projects: number; files: number }> {
  if (file.size > 20 * 1024 * 1024) throw new Error('Backup too large (max 20 MB).');
  const text = await file.text();
  let parsed: BackupPayload;
  try {
    parsed = JSON.parse(text) as BackupPayload;
  } catch {
    throw new Error('Invalid backup file (not JSON).');
  }
  if (
    typeof parsed !== 'object' || parsed === null ||
    parsed.version !== BACKUP_VERSION ||
    !Array.isArray(parsed.projects) || !Array.isArray(parsed.nodes)
  ) {
    throw new Error('Invalid backup file (bad shape or version).');
  }
  for (const p of parsed.projects as Array<Record<string, unknown>>) {
    if (typeof p.name !== 'string') throw new Error('Invalid backup file (bad project).');
  }
  for (const n of parsed.nodes as Array<Record<string, unknown>>) {
    if (typeof n.projectId !== 'number' || typeof n.name !== 'string') {
      throw new Error('Invalid backup file (bad node).');
    }
  }

  await db.transaction('rw', db.projects, db.nodes, async () => {
    await db.nodes.clear();
    await db.projects.clear();
    // bulkPut preserves original ids so parentId links stay intact
    await db.projects.bulkPut(parsed.projects as never[]);
    await db.nodes.bulkPut(parsed.nodes as never[]);
  });

  if (parsed.themeName) {
    try {
      useMarkdownStore.getState().applyPreset(parsed.themeName);
    } catch {
      // Theme preset missing in this build — ignore, data matters more
    }
  }
  useMarkdownStore.getState().setActiveProject(null);
  useMarkdownStore.getState().setActiveFile(null);
  useMarkdownStore.getState().resetSaveState();

  return {
    projects: parsed.projects.length,
    files: (parsed.nodes as Array<{ type?: string }>).filter((n) => n.type === 'file').length,
  };
}
