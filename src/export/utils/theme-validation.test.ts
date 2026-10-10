import { describe, expect, it } from 'vitest';
import { accentTextFor, safeFontFamily, safeFontSize, safeHex } from './theme-validation';

describe('safeHex', () => {
  it('passes through valid colors', () => {
    expect(safeHex('#ff6188')).toBe('#ff6188');
  });

  it('falls back on breakout attempts', () => {
    expect(safeHex('</style><script>alert(1)</script>')).toBe('#000000');
    expect(safeHex('red')).toBe('#000000');
  });
});

describe('safeFontSize', () => {
  it('clamps to 8..72 and falls back on NaN', () => {
    expect(safeFontSize(200)).toBe(72);
    expect(safeFontSize(2)).toBe(8);
    expect(safeFontSize('')).toBe(14);
    expect(safeFontSize(16)).toBe(16);
  });
});

describe('safeFontFamily', () => {
  it('strips markup chars', () => {
    expect(safeFontFamily('Inter</style>')).toBe('Interstyle');
    expect(safeFontFamily('')).toBe('Inter, sans-serif');
  });
});

describe('accentTextFor', () => {
  it('keeps accents that already pass 4.5:1', () => {
    expect(accentTextFor('#ffffff', '#2563eb', '#111111')).toBe('#2563eb');
  });

  it('mixes failing accents toward the foreground', () => {
    // #9ca3af on white is ~2.5:1 — must not survive unchanged
    const out = accentTextFor('#ffffff', '#9ca3af', '#111111');
    expect(out).not.toBe('#9ca3af');
    expect(out).toMatch(/^#[0-9a-f]{6}$/);
  });
});
