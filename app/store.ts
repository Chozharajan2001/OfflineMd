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
            background: '#09090b',
            foreground: '#fafafa',
            border: '#27272a',
            accent: '#2563eb',
        },
        editor: {
            background: '#18181b',
            foreground: '#e4e4e7',
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
            border: '#e4e4e7',
            accent: '#2563eb',
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
    'github-light': {
        name: 'GitHub Light',
        ui: {
            background: '#ffffff',
            foreground: '#24292e',
            border: '#e1e4e8',
            accent: '#0969da',
        },
        editor: {
            background: '#f6f8fa',
            foreground: '#24292e',
            fontSize: 14,
            fontFamily: "'Fira Code', monospace",
        },
        preview: {
            background: '#ffffff',
            foreground: '#24292e',
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
        },
    },
    'github-dark': {
        name: 'GitHub Dark',
        ui: {
            background: '#0d1117',
            foreground: '#c9d1d9',
            border: '#30363d',
            accent: '#58a6ff',
        },
        editor: {
            background: '#161b22',
            foreground: '#c9d1d9',
            fontSize: 14,
            fontFamily: "'Fira Code', monospace",
        },
        preview: {
            background: '#0d1117',
            foreground: '#c9d1d9',
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
        },
    },
    nord: {
        name: 'Nord',
        ui: {
            background: '#2e3440',
            foreground: '#eceff4',
            border: '#4c566a',
            accent: '#81a1c1',
        },
        editor: {
            background: '#3b4252',
            foreground: '#eceff4',
            fontSize: 14,
            fontFamily: "'Fira Code', monospace",
        },
        preview: {
            background: '#2e3440',
            foreground: '#eceff4',
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
        },
    },
    'one-dark-pro': {
        name: 'One Dark Pro',
        ui: {
            background: '#282c34',
            foreground: '#abb2bf',
            border: '#3e4451',
            accent: '#61afef',
        },
        editor: {
            background: '#282c34',
            foreground: '#abb2bf',
            fontSize: 14,
            fontFamily: "'Fira Code', monospace",
        },
        preview: {
            background: '#282c34',
            foreground: '#abb2bf',
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
        },
    },
    'tokyo-night': {
        name: 'Tokyo Night',
        ui: {
            background: '#1a1b26',
            foreground: '#a9b1d6',
            border: '#24283b',
            accent: '#7aa2f7',
        },
        editor: {
            background: '#24283b',
            foreground: '#a9b1d6',
            fontSize: 14,
            fontFamily: "'Fira Code', monospace",
        },
        preview: {
            background: '#1a1b26',
            foreground: '#a9b1d6',
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
        },
    },
    'solarized-light': {
        name: 'Solarized Light',
        ui: {
            background: '#fdf6e3',
            foreground: '#657b83',
            border: '#eee8d5',
            accent: '#268bd2',
        },
        editor: {
            background: '#fdf6e3',
            foreground: '#657b83',
            fontSize: 14,
            fontFamily: "'Fira Code', monospace",
        },
        preview: {
            background: '#fdf6e3',
            foreground: '#657b83',
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
        },
    },
    'solarized-dark': {
        name: 'Solarized Dark',
        ui: {
            background: '#002b36',
            foreground: '#839496',
            border: '#073642',
            accent: '#2aa198',
        },
        editor: {
            background: '#002b36',
            foreground: '#839496',
            fontSize: 14,
            fontFamily: "'Fira Code', monospace",
        },
        preview: {
            background: '#002b36',
            foreground: '#839496',
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
        },
    },
    'monokai-pro': {
        name: 'Monokai Pro',
        ui: {
            background: '#2d2a2e',
            foreground: '#fcfcfa',
            border: '#3e3a3e',
            accent: '#ff6188',
        },
        editor: {
            background: '#2d2a2e',
            foreground: '#fcfcfa',
            fontSize: 14,
            fontFamily: "'Fira Code', monospace",
        },
        preview: {
            background: '#2d2a2e',
            foreground: '#fcfcfa',
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
        },
    },
    'gruvbox-dark': {
        name: 'Gruvbox Dark',
        ui: {
            background: '#282828',
            foreground: '#ebdbb2',
            border: '#3a3838',
            accent: '#fe8019',
        },
        editor: {
            background: '#282828',
            foreground: '#ebdbb2',
            fontSize: 14,
            fontFamily: "'Fira Code', monospace",
        },
        preview: {
            background: '#282828',
            foreground: '#ebdbb2',
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
        },
    },
    notion: {
        name: 'Notion',
        ui: {
            background: '#ffffff',
            foreground: '#37352f',
            border: '#e7e7e9',
            accent: '#006eff',
        },
        editor: {
            background: '#ffffff',
            foreground: '#37352f',
            fontSize: 14,
            fontFamily: "'Fira Code', monospace",
        },
        preview: {
            background: '#ffffff',
            foreground: '#37352f',
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
        },
    },
    obsidian: {
        name: 'Obsidian',
        ui: {
            background: '#1e1e2e',
            foreground: '#cdd6f4',
            border: '#313244',
            accent: '#89b4fa',
        },
        editor: {
            background: '#1e1e2e',
            foreground: '#cdd6f4',
            fontSize: 14,
            fontFamily: "'Fira Code', monospace",
        },
        preview: {
            background: '#1e1e2e',
            foreground: '#cdd6f4',
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
        },
    },
    sepia: {
        name: 'Sepia / Paper',
        ui: {
            background: '#f4ecd8',
            foreground: '#5b4636',
            border: '#e3d7c5',
            accent: '#8f5a4a',
        },
        editor: {
            background: '#f4ecd8',
            foreground: '#5b4636',
            fontSize: 14,
            fontFamily: "'Fira Code', monospace",
        },
        preview: {
            background: '#f4ecd8',
            foreground: '#5b4636',
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
        },
    },
    forest: {
        name: 'Forest',
        ui: {
            background: '#1b2a1b',
            foreground: '#b8d4b8',
            border: '#2d4a2d',
            accent: '#7cb342',
        },
        editor: {
            background: '#1b2a1b',
            foreground: '#b8d4b8',
            fontSize: 14,
            fontFamily: "'Fira Code', monospace",
        },
        preview: {
            background: '#1b2a1b',
            foreground: '#b8d4b8',
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
        },
    },
    ocean: {
        name: 'Ocean',
        ui: {
            background: '#0b1929',
            foreground: '#b3c5d7',
            border: '#143554',
            accent: '#4fc3f7',
        },
        editor: {
            background: '#0b1929',
            foreground: '#b3c5d7',
            fontSize: 14,
            fontFamily: "'Fira Code', monospace",
        },
        preview: {
            background: '#0b1929',
            foreground: '#b3c5d7',
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
