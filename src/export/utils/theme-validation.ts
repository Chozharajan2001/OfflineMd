const HEX_RE = /^#[0-9a-f]{6}$/i;
const FALLBACK = '#000000';

export function safeHex(value: unknown, fallback = FALLBACK): string {
  return typeof value === 'string' && HEX_RE.test(value.trim()) ? value.trim() : fallback;
}

export function safeFontSize(value: unknown, fallback = 14): number {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(72, Math.max(8, n));
}

export function safeFontFamily(value: unknown, fallback = 'Inter, sans-serif'): string {
  if (typeof value !== 'string') return fallback;
  // Allow letters, numbers, spaces, commas, quotes, hyphens — strip <>/& to block </style> breakout
  const cleaned = value.replace(/[<>&/\\]/g, '').slice(0, 120).trim();
  return cleaned || fallback;
}
