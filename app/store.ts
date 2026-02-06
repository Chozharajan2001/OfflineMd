import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ThemeConfig {
  name: string;
  ui: {
    background: string;
    foreground: string;
    border: string;
    accent: string;
  };
  editor: {
    background: string;
    foreground: string;
    fontSize: number;
    fontFamily: string;
  };
  preview: {
    background: string;
    foreground: string;
    fontFamily: string;
    fontSize: number;
  };
}

export const themes: Record<string, ThemeConfig> = {
  dark: {
    name: 'Default Dark',
    ui: {
      background: '#09090b', // zinc-950
      foreground: '#fafafa', // zinc-50
      border: '#27272a', // zinc-800
      accent: '#2563eb', // blue-600
    },
    editor: {
      background: '#18181b', // zinc-900
      foreground: '#e4e4e7', // zinc-200
      fontSize: 14,
      fontFamily: "'Fira Code', monospace",
    },
    preview: {
      background: '#09090b',
      foreground: '#e4e4e7',
      fontFamily: "Inter, sans-serif",
      fontSize: 16,
    },
  },
  light: {
    name: 'Default Light',
    ui: {
      background: '#ffffff',
      foreground: '#09090b',
      border: '#e4e4e7', // zinc-200
      accent: '#2563eb', // blue-600
    },
    editor: {
      background: '#ffffff',
      foreground: '#18181b',
      fontSize: 14,
      fontFamily: "'Fira Code', monospace",
    },
    preview: {
      background: '#ffffff',
      foreground: '#09090b',
      fontFamily: "Inter, sans-serif",
      fontSize: 16,
    },
  },
  dracula: {
    name: 'Dracula',
    ui: {
      background: '#282a36',
      foreground: '#f8f8f2',
      border: '#44475a',
      accent: '#bd93f9',
    },
    editor: {
      background: '#282a36',
      foreground: '#f8f8f2',
      fontSize: 14,
      fontFamily: "'Fira Code', monospace",
    },
    preview: {
      background: '#282a36',
      foreground: '#f8f8f2',
      fontFamily: "Inter, sans-serif",
      fontSize: 16,
    },
  },
};

interface MarkdownStore {
  // Editor Content
  markdown: string;
  setMarkdown: (markdown: string) => void;

  // File System State
  activeProjectId: number | null;
  activeFileId: number | null;
  setActiveProject: (id: number | null) => void;
  setActiveFile: (id: number | null) => void;

  // Theme State
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  resetTheme: () => void;
  applyPreset: (presetName: string) => void;
}

export const useMarkdownStore = create<MarkdownStore>()(
  persist(
    (set) => ({
      markdown: '# Hello World\n\nSelect a project to start.',
      setMarkdown: (markdown) => set({ markdown }),

      activeProjectId: null,
      activeFileId: null,
      setActiveProject: (id) => set({ activeProjectId: id }),
      setActiveFile: (id) => set({ activeFileId: id }),

      theme: themes.dark,
      setTheme: (theme) => set({ theme }),
      resetTheme: () => set({ theme: themes.dark }),
      applyPreset: (name) => {
        if (themes[name]) {
          set({ theme: themes[name] });
        }
      }
    }),
    {
      name: 'markdown-converter-storage',
      // We might want to persist activeFileId/ProjectId, but careful if they are deleted.
    }
  )
);