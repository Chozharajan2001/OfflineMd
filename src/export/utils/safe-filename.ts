export function safeFilename(baseTitle: string | undefined, fallback = 'document'): string {
  const base = (baseTitle || fallback).trim() || fallback;
  return base
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/[^a-z0-9\s\-_]/gi, '_')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 50) || fallback;
}

import { getFrontMatter } from './front-matter';

export function extractTitle(markdown: string, metadataTitle?: string): string {
  if (metadataTitle?.trim()) return metadataTitle.trim();
  const fm = getFrontMatter(markdown);
  if (typeof fm.data.title === 'string' && fm.data.title.trim()) return fm.data.title.trim();
  // Skip the front-matter block when looking for the first H1
  const m = fm.content.match(/^#\s+(.*)/m);
  return m?.[1]?.trim() || 'document';
}
