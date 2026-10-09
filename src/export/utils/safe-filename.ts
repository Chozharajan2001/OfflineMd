export function safeFilename(baseTitle: string | undefined, fallback = 'document'): string {
  const base = (baseTitle || fallback).trim() || fallback;
  return base
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/[^a-z0-9\s\-_]/gi, '_')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 50) || fallback;
}

export function extractTitle(markdown: string, metadataTitle?: string): string {
  if (metadataTitle?.trim()) return metadataTitle.trim();
  const m = markdown.match(/^#\s+(.*)/m);
  return m?.[1]?.trim() || 'document';
}
