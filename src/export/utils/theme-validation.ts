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

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
}

function relLuminance([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrastRatio(a: string, b: string): number {
  const pa = parseHex(a);
  const pb = parseHex(b);
  if (!pa || !pb) return 1;
  const [l1, l2] = [relLuminance(pa), relLuminance(pb)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/**
 * Text-safe accent: returns the accent unchanged when it already hits 4.5:1
 * on the given background, otherwise mixes it toward the foreground colour.
 * Fixes `--accent`-as-text ≈ 3.85:1 (M-3).
 */
export function accentTextFor(background: string, accent: string, foreground: string): string {
  const safeBg = safeHex(background, '#ffffff');
  const safeAccent = safeHex(accent, '#2563eb');
  const safeFg = safeHex(foreground, '#111111');
  if (contrastRatio(safeAccent, safeBg) >= 4.5) return safeAccent;
  const pa = parseHex(safeAccent);
  const pf = parseHex(safeFg);
  if (!pa || !pf) return safeFg;
  const t = 0.45;
  const mixed = pa.map((c, i) => Math.round(c + (pf[i] - c) * t)) as [number, number, number];
  const out = `#${mixed.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  return contrastRatio(out, safeBg) >= contrastRatio(safeAccent, safeBg) ? out : safeFg;
}
