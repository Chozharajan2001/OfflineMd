// app/services/ThemeAdapter.ts
import { ThemeConfig, ThemeColors, ThemePreset } from '@/app/types/theme';

// 1. Define the Presets (The Source of Truth)
const PRESETS: Record<ThemePreset, ThemeConfig> = {
  light: {
    id: 'light',
    name: 'Light',
    colors: {
      background: '#ffffff',
      foreground: '#333333',
      primary: '#0070f3',
      secondary: '#eaeaea',
      border: '#eaeaea',
      editorBackground: '#ffffff',
      editorForeground: '#000000',
      editorLineHighlight: '#f0f0f0',
      editorSelection: '#add6ff',
      editorCursor: '#000000',
      previewBackground: '#ffffff',
      previewText: '#24292e',
      previewLink: '#0366d6',
      previewCodeBackground: '#f6f8fa',
      previewCodeText: '#24292e',
      exportBackground: '#ffffff',
      exportText: '#000000',
      exportHeader: '#000000',
      exportBorder: '#000000',
      // UI Component States
      uiHoverBg: '#f5f5f5',
      uiActiveBg: '#e6e6e6',
      uiDisabledBg: '#f0f0f0',
      uiDisabledText: '#999999',
      // Transparency & Overlays
      overlay: 'rgba(0, 0, 0, 0.5)',
      glass: 'rgba(255, 255, 255, 0.85)',
      borderLight: '#eeeeee',
      borderFocus: '#0070f3',
    },
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    colors: {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      primary: '#3b82f6',
      secondary: '#333333',
      border: '#333333',
      editorBackground: '#1e1e1e',
      editorForeground: '#d4d4d4',
      editorLineHighlight: '#2a2d2e',
      editorSelection: '#264f78',
      editorCursor: '#aeafad',
      previewBackground: '#1e1e1e',
      previewText: '#e1e4e8',
      previewLink: '#58a6ff',
      previewCodeBackground: '#2d333b',
      previewCodeText: '#c9d1d9',
      exportBackground: '#ffffff',
      exportText: '#000000',
      exportHeader: '#000000',
      exportBorder: '#cccccc',
      // UI Component States
      uiHoverBg: '#2d2d2d',
      uiActiveBg: '#3d3d3d',
      uiDisabledBg: '#1a1a1a',
      uiDisabledText: '#555555',
      // Transparency & Overlays
      overlay: 'rgba(0, 0, 0, 0.7)',
      glass: 'rgba(30, 30, 30, 0.85)',
      borderLight: '#333333',
      borderFocus: '#3b82f6',
    },
  },
  sepia: {
    id: 'sepia',
    name: 'Sepia',
    colors: {
      background: '#f4ecd8',
      foreground: '#5b4636',
      primary: '#d3a15d',
      secondary: '#dccfb8',
      border: '#dccfb8',
      editorBackground: '#f4ecd8',
      editorForeground: '#5b4636',
      editorLineHighlight: '#e8dcc8',
      editorSelection: '#d3c7a8',
      editorCursor: '#5b4636',
      previewBackground: '#f4ecd8',
      previewText: '#5b4636',
      previewLink: '#d3a15d',
      previewCodeBackground: '#e8dcc8',
      previewCodeText: '#5b4636',
      exportBackground: '#f4ecd8',
      exportText: '#5b4636',
      exportHeader: '#5b4636',
      exportBorder: '#d3a15d',
      // UI Component States
      uiHoverBg: '#e8dcc8',
      uiActiveBg: '#d9c7a7',
      uiDisabledBg: '#f4ecd8',
      uiDisabledText: '#b8a58e',
      // Transparency & Overlays
      overlay: 'rgba(91, 70, 54, 0.5)',
      glass: 'rgba(244, 236, 216, 0.85)',
      borderLight: '#e8dcc8',
      borderFocus: '#d3a15d',
    },
  },
  night: {
    id: 'night',
    name: 'Night',
    colors: {
      background: '#0d1117',
      foreground: '#c9d1d9',
      primary: '#58a6ff',
      secondary: '#161b22',
      border: '#30363d',
      editorBackground: '#0d1117',
      editorForeground: '#c9d1d9',
      editorLineHighlight: '#161b22',
      editorSelection: '#264f78',
      editorCursor: '#c9d1d9',
      previewBackground: '#0d1117',
      previewText: '#c9d1d9',
      previewLink: '#58a6ff',
      previewCodeBackground: '#161b22',
      previewCodeText: '#c9d1d9',
      exportBackground: '#ffffff',
      exportText: '#000000',
      exportHeader: '#000000',
      exportBorder: '#cccccc',
      // UI Component States
      uiHoverBg: '#161b22',
      uiActiveBg: '#21262d',
      uiDisabledBg: '#0d1117',
      uiDisabledText: '#484f58',
      // Transparency & Overlays
      overlay: 'rgba(0, 0, 0, 0.8)',
      glass: 'rgba(13, 17, 23, 0.85)',
      borderLight: '#21262d',
      borderFocus: '#58a6ff',
    },
  },
};

class ThemeAdapter {
  private currentTheme: ThemeConfig = PRESETS.dark; // Default to dark theme

  // --- GETTERS ---

  getTheme(): ThemeConfig {
    return this.currentTheme;
  }

  getColors(): ThemeColors {
    return this.currentTheme.colors;
  }

  // --- ADAPTERS (Translators) ---

  /**
   * Generates CSS Variables for the React Components (Tailwind/Inline Styles)
   */
  getCSSVariables(): Record<string, string> {
    const c = this.currentTheme.colors;
    return {
      // --- Core Layout ---
      '--background': c.background,
      '--foreground': c.foreground,
      '--border': c.border,
      '--accent': c.primary,
      
      // --- UI States ---
      '--ui-hover-bg': c.uiHoverBg,
      '--ui-active-bg': c.uiActiveBg,
      '--ui-disabled-bg': c.uiDisabledBg,
      '--ui-disabled-text': c.uiDisabledText,
      
      // --- Transparency ---
      '--overlay-bg': c.overlay,
      '--glass-bg': c.glass,
      
      // --- Borders ---
      '--border-light': c.borderLight,
      '--border-focus': c.borderFocus,
      
      // --- Header ---
      '--header-bg': c.background,
      '--header-fg': c.foreground,
      '--header-border': c.border,
      '--header-hover': c.uiHoverBg,
      
      // --- Sidebar ---
      '--sidebar-bg': c.background,
      '--sidebar-fg': c.foreground,
      '--sidebar-border': c.border,
      '--sidebar-muted': c.uiDisabledText,
      '--sidebar-icon': c.secondary,
      '--sidebar-input-bg': c.borderLight,
      '--sidebar-hover': c.uiHoverBg,
      
      // --- Dropdown/Dialog ---
      '--dropdown-bg': c.glass,
      '--dropdown-fg': c.foreground,
      '--dropdown-border': c.border,
      '--dropdown-hover': c.uiHoverBg,
      
      '--dialog-bg': c.glass,
      '--dialog-fg': c.foreground,
      '--dialog-border': c.border,
      
      // --- Inputs ---
      '--input-bg': c.borderLight,
      '--input-fg': c.foreground,
      '--input-border': c.border,
      
      // --- Buttons ---
      '--button-primary-bg': c.primary,
      '--button-primary-hover': c.primary + 'cc',
      '--button-secondary-bg': c.uiHoverBg,
      '--button-secondary-hover': c.uiActiveBg,
      '--button-fg': c.foreground,
      
      // --- Editor ---
      '--editor-bg': c.editorBackground,
      '--preview-bg': c.previewBackground,
    };
  }

  /**
   * Generates Monaco Editor Theme Definition
   */
  getMonacoTheme() {
    const c = this.currentTheme.colors;
    const isDark = this.currentTheme.id === 'dark' || this.currentTheme.id === 'night';
    
    return {
      base: isDark ? 'vs-dark' : 'vs',
      inherit: true,
      rules: [
        { token: '', background: c.editorBackground, foreground: c.editorForeground },
        { token: 'cursor', foreground: c.editorCursor },
      ],
      colors: {
        'editor.background': c.editorBackground,
        'editor.foreground': c.editorForeground,
        'editor.lineHighlightBackground': c.editorLineHighlight,
        'editor.selectionBackground': c.editorSelection,
        'editorCursor.foreground': c.editorCursor,
      },
    };
  }

  /**
   * Generates Export Styles (PDF/Word/PPTX)
   */
  getExportStyles() {
    const c = this.currentTheme.colors;
    return {
      background: c.exportBackground,
      text: c.exportText,
      header: c.exportHeader,
      border: c.exportBorder,
      codeBackground: c.previewCodeBackground,
      codeText: c.previewCodeText,
      link: c.previewLink,
    };
  }

  // --- ACTIONS ---

  setTheme(preset: ThemePreset) {
    if (PRESETS[preset]) {
      this.currentTheme = PRESETS[preset];
    }
  }
}

export default new ThemeAdapter();
