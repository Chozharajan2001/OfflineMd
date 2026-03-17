// app/types/theme.ts

export type ThemePreset = 'light' | 'dark' | 'sepia' | 'night';

export interface ThemeColors {
  // UI Colors (Sidebar, Topbar, Backgrounds)
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  border: string;
  
  // Editor Specific (Monaco)
  editorBackground: string;
  editorForeground: string;
  editorLineHighlight: string;
  editorSelection: string;
  editorCursor: string;

  // Preview Specific (HTML/CSS)
  previewBackground: string;
  previewText: string;
  previewLink: string;
  previewCodeBackground: string;
  previewCodeText: string;

  // Export Specific (PDF/Word)
  exportBackground: string;
  exportText: string;
  exportHeader: string;
  exportBorder: string;

  // --- UI Component States ---
  uiHoverBg: string;       // Background when hovering over buttons/items
  uiActiveBg: string;      // Background when clicked/selected
  uiDisabledBg: string;    // Background for disabled elements
  uiDisabledText: string;  // Text color for disabled elements
  
  // --- Transparency & Overlays ---
  overlay: string;         // Modal backdrop (e.g., rgba(0,0,0,0.5))
  glass: string;           // Glassmorphism effect (e.g., rgba(255,255,255,0.8))
  borderLight: string;     // Subtle border for separation
  borderFocus: string;     // Border color when focused
}

export interface ThemeConfig {
  id: ThemePreset;
  name: string;
  colors: ThemeColors;
}
