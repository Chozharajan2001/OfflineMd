import { db } from '../services/Database';

const MAX_REVISIONS_PER_FILE = 30;

/**
 * Append a history snapshot for a file. Skips when content is unchanged
 * since the latest snapshot; prunes beyond the cap (oldest first).
 */
export async function captureRevision(fileId: number, content: string): Promise<void> {
  try {
    const latest = await db.revisions.where('fileId').equals(fileId).sortBy('createdAt');
    const last = latest[latest.length - 1];
    if (last && last.content === content) return;
    await db.revisions.add({ fileId, content, createdAt: new Date() });
    const all = await db.revisions.where('fileId').equals(fileId).sortBy('createdAt');
    const overflow = all.length - MAX_REVISIONS_PER_FILE;
    for (let i = 0; i < overflow; i++) {
      if (typeof all[i].id === 'number') await db.revisions.delete(all[i].id as number);
    }
  } catch {
    // History is best-effort; saves must never fail because of it
  }
}

export interface DiffLine {
  kind: 'same' | 'add' | 'del';
  text: string;
}

/** Tiny line diff (LCS on lines, no dependency) for the history view. */
export function diffLines(oldText: string, newText: string): DiffLine[] {
  const a = oldText.split('\n');
  const b = newText.split('\n');
  const m = a.length;
  const n = b.length;
  // Cap work for pathological inputs
  if (m * n > 200000) {
    return [{ kind: 'same' as const, text: `Documents too large for inline diff (${m} vs ${n} lines).` }];
  }
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      out.push({ kind: 'same', text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ kind: 'del', text: a[i] });
      i++;
    } else {
      out.push({ kind: 'add', text: b[j] });
      j++;
    }
  }
  while (i < m) out.push({ kind: 'del', text: a[i++] });
  while (j < n) out.push({ kind: 'add', text: b[j++] });
  return out;
}
