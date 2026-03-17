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
}

export interface ThemeConfig {
  id: ThemePreset;
  name: string;
  colors: ThemeColors;
}
