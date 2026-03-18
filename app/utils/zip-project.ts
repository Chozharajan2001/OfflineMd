import JSZip from 'jszip';
import { db, type FileNode } from '../services/Database';

type BuildZipResult = {
    blob: Blob;
    filename: string;
    fileCount: number;
};

function sanitizeSegment(value: string): string {
    const cleaned = value
        .replace(/[\\/:*?"<>|]/g, '_')
        .replace(/\s+/g, ' ')
        .trim();
    return cleaned || 'untitled';
}

function uniqueName(base: string, used: Set<string>): string {
    let candidate = base;
    let index = 2;
    while (used.has(candidate.toLowerCase())) {
        candidate = `${base} (${index})`;
        index += 1;
    }
    used.add(candidate.toLowerCase());
    return candidate;
}

export async function buildProjectZip(projectId: number): Promise<BuildZipResult> {
    const project = await db.projects.get(projectId);
    if (!project) {
        throw new Error('Project not found');
    }

    const nodes = await db.nodes.where('projectId').equals(projectId).toArray();
    const nodesByParent = new Map<number | null, FileNode[]>();
    for (const node of nodes) {
        const parent = node.parentId ?? null;
        const current = nodesByParent.get(parent);
        if (current) current.push(node);
        else nodesByParent.set(parent, [node]);
    }

    const zip = new JSZip();
    let fileCount = 0;

    const walk = (parentId: number | null, path: string) => {
        const children = nodesByParent.get(parentId) || [];
        const used = new Set<string>();
        const sorted = [...children].sort((a, b) => {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
            return a.name.localeCompare(b.name);
        });

        for (const child of sorted) {
            const baseName = sanitizeSegment(child.name);
            const nodeName = uniqueName(baseName, used);

            if (child.type === 'folder') {
                const folderPath = path ? `${path}/${nodeName}` : nodeName;
                zip.folder(folderPath);
                walk(child.id ?? null, folderPath);
            } else {
                const normalizedFileName = /\.[a-z0-9]+$/i.test(nodeName) ? nodeName : `${nodeName}.md`;
                const filePath = path ? `${path}/${normalizedFileName}` : normalizedFileName;
                zip.file(filePath, child.content ?? '');
                fileCount += 1;
            }
        }
    };

    walk(null, '');

    if (fileCount === 0) {
        zip.file('README.txt', `Project "${project.name}" has no files yet.`);
    }

    const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `${sanitizeSegment(project.name).replace(/\s+/g, '-')}_${timestamp}.zip`;

    return { blob, filename, fileCount };
}
