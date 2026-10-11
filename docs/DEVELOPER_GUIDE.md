# Markdown Editor & Converter - Developer Guide

Complete developer documentation for contributing to and understanding the Markdown Editor & Converter project.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Documentation Index](#documentation-index)
3. [Getting Started](#getting-started)
4. [Technology Stack](#technology-stack)
5. [Architecture Overview](#architecture-overview)
6. [Key Components](#key-components)
7. [State Management](#state-management)
8. [Storage System](#storage-system)
9. [Export System](#export-system)
10. [Contributing Guidelines](#contributing-guidelines)

---

## Project Overview

The Markdown Editor & Converter is a privacy-first, offline-capable markdown editing application built with modern web technologies. It provides a professional editing experience with Monaco Editor, live preview, project management, and multi-format export capabilities.

### Core Principles

- **Privacy First**: All data stored locally, never transmitted
- **Offline Capability**: Serwist service worker (`app/sw.ts`, registered by `SwRegister` in production) precaches the app shell; IndexedDB persists data offline. Monaco Editor still loads from CDN at runtime (see M6).
- **Zero Cost**: Free forever, no premium tiers
- **Open Source**: Community-driven development
- **Professional Tools**: IDE-quality editing experience

---

## Documentation Index

This project includes several documentation files:

| File | Purpose | Audience |
|------|---------|----------|
| **README.md** | Project overview, features, setup | End users, developers |
| **DEVELOPER_GUIDE.md** | This file - comprehensive dev guide | Contributors, developers |
| **TECHNICAL_DOCS.md** | Deep technical architecture | Senior developers |
| **CONTRIBUTING.md** | Contribution workflow | Contributors |
| **QUICK_START.md** | Rapid setup for new developers | New contributors |

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Git

### Quick Setup

```bash
# Clone repository
git clone <repository-url>
cd markdown-converter

# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# http://localhost:3000
```

### Development Scripts

```bash
npm run dev      # Development server with webpack (no service worker in dev)
npm run build    # Production build (also generates the Serwist worker)
npm run start    # Production server
npm run lint     # ESLint checking — 0 errors / 0 warnings expected
npm test         # Vitest unit tests (exporter contracts, utils)
npm run test:e2e # Playwright smoke: boot → project → file → save → export
```

### Testing

| Layer | Tool | Command | Covers |
|---|---|---|---|
| Unit | Vitest | `npm test` | `safe-filename`, `theme-validation`, TOC/front-matter utils, all 5 core exporters against an `ExportResult` contract |
| E2E | Playwright (system Chrome) | `npm run test:e2e` | Default-project boot, `?new=file` deep link, reload persistence, PDF download |
| CI | GitHub Actions | `.github/workflows/ci.yml` | `tsc` + `eslint` + `test` + `build` on every push |

There is no component-rendering test layer; UI changes still get a manual browser pass
(320/768/1440 px, dark + light) before merging.

---

## Technology Stack

### Core Framework
- **Next.js**: 16.1.4 (App Router)
- **React**: 19.2.3
- **TypeScript**: 5.x

### Styling & UI
- **Tailwind CSS**: 4.x with custom theme variables
- **Radix UI**: Primitives (Dialog, Dropdown, Tabs, Tooltip)
- **Lucide React**: Icon library
- **Class Variance Authority**: Component variant management

### Editor & Preview
- **Monaco Editor**: @monaco-editor/react for markdown editing (CDN-loaded at runtime)
- **Unified.js**: Markdown processing (remark-parse/gfm/math → rehype-katex/slug/sanitize/highlight/stringify)
- **Highlight.js**: Syntax highlighting
- **Mermaid**: Diagram rendering (lazy, `securityLevel: 'strict'`)
- **KaTeX**: Math rendering (CSS in `layout.tsx`)

### State & Storage
- **Zustand**: 5.x with persistence middleware (localStorage, partialized)
- **Dexie.js**: 4.x IndexedDB wrapper — schema **v5**
- **dexie-react-hooks**: Reactive queries

### Export System
- **pdf-lib**: PDF generation
- **docx.js**: Word document creation
- **pptxgenjs**: PowerPoint decks
- **html-to-image**: PNG snapshots
- **jszip**: EPUB + project ZIP
- **file-saver**: Client-side downloads
- **gray-matter**: YAML front matter

### Quality & Build
- **ESLint**: 9.x with Next.js config (0 errors / 0 warnings)
- **Vitest** + **Playwright** + **GitHub Actions**
- **PostCSS**: Tailwind processing
- **@serwist/next**: PWA service worker (replaced `next-pwa@5`, incompatible with Next 16)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  Components  │   Services   │    Store     │    Export      │
│              │              │              │    System      │
├──────────────┼──────────────┼──────────────┼────────────────┤
│ • Header     │ • Database   │ • Zustand    │ • Orchestrator │
│ • Sidebar    │ • Parser     │ • Themes(17) │ • Exporters(8) │
│ • Editor     │ • History    │ • Persistence│ • UI Components│
│ • Preview    │   utils      │              │                │
│ • Layout     │              │              │                │
└──────────────┴──────────────┴──────────────┴────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                 Browser Environment                         │
│  • IndexedDB    • LocalStorage    • Monaco Editor          │
│  • File API     • Service Worker  • Canvas/Canvas         │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

1. **Components Layer**: UI rendering, user interactions, layout management
2. **Services Layer**: Business logic, external integrations, data processing
3. **Store Layer**: Global state, theming, persistence configuration
4. **Export System**: Modular export architecture with format-specific exporters
5. **Browser Layer**: Native APIs, storage, third-party libraries

---

## Key Components

### 1. Editor Component (`app/components/Editor.tsx`)

**Purpose**: Rich markdown editing with Monaco Editor

**Key Features**:
- Monaco Editor integration (VS Code's editor)
- Markdown language mode
- Theme synchronization
- Responsive layout
- Font ligatures support

**Dependencies**:
- `@monaco-editor/react`
- `useMarkdownStore` for content and theme

**State**:
- `markdown`: Current editor content
- `theme.editor`: Editor styling configuration

---

### 2. Preview Component (`app/components/Preview.tsx`)

**Purpose**: Live markdown rendering with syntax highlighting and diagrams

**Key Features**:
- Debounced parsing (150ms delay)
- Syntax highlighting via highlight.js
- Mermaid diagram rendering
- Theme-aware inline CSS
- XSS-safe HTML rendering

**Dependencies**:
- `markdownParser` service
- `mermaid` for diagrams
- `useMarkdownStore` for content

**State**:
- `renderedHtml`: Parsed HTML output
- `isClient`: Hydration state

---

### 3. Sidebar Component (`app/components/Sidebar.tsx`)

**Purpose**: Project and file management with hierarchical navigation

**Key Features**:
- Project creation and selection
- Folder/file tree with nesting
- CRUD operations (Create, Read, Update, Delete)
- Recent files list
- Expandable/collapsible folders

**Dependencies**:
- `db` (Dexie.js database)
- `useLiveQuery` for reactive updates
- `useMarkdownStore` for state

**State**:
- `activeProjectId`: Currently selected project
- `activeFileId`: Currently open file
- `expandedFolders`: Folder expansion state

---

### 4. Header Component (`app/components/Header.tsx`)

**Purpose**: Toolbar with save, export split-button, view modes, overflow menu, settings

**Key Features**:
- Revision-guarded save + import (file/URL) + copy markdown
- Export menu (8 formats) with hints, last-used check, cancellable progress
- Settings tabs (Appearance swatches / Workspace backup)
- Shortcuts: save, export, new file/project, command palette

**Dependencies**:
- `ExportOrchestrator` from `src/export/`
- `db` for save operations
- `useMarkdownStore` for state

---

### 5. ResizableLayout Component (`app/components/ResizableLayout.tsx`)

**Purpose**: Editor-only / split / preview layout with resizable separator

**Key Features**:
- Conditional panes from `viewMode` (single-pane default on small screens)
- Horizontal split panels, draggable separator, min-size constraints
- Keyboard resize (arrow keys) with a labelled separator role

**Dependencies**:
- `react-resizable-panels`

---

### 6. ThemeProvider Component (`app/components/ThemeProvider.tsx`)

**Purpose**: Synchronize theme across UI, Monaco Editor, and CSS variables

**Key Features**:
- CSS custom properties injection
- Monaco theme definition
- Hydration-safe mounting

**Dependencies**:
- `useMonaco` from `@monaco-editor/react`
- `useMarkdownStore` for theme

---

## State Management

### Zustand Store Structure (`app/store.ts`)

```typescript
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
```

### Available Themes (17 Total)

**Dark Themes**:
- Dark (default)
- Dracula
- GitHub Dark
- Nord
- One Dark Pro
- Tokyo Night
- Solarized Dark
- Monokai Pro
- Gruvbox Dark
- Obsidian
- Forest
- Ocean

**Light Themes**:
- Light
- GitHub Light
- Solarized Light
- Notion
- Sepia

### Persistence

```typescript
persist(
  (set) => ({ ...store }), 
  {
    name: 'markdown-converter-storage',
    // Persists to localStorage
  }
)
```

---

## Storage System

### Database Schema (`app/services/Database.ts`)

**Dexie.js v2 Schema**:

```typescript
interface Project {
  id?: number;           // Auto-increment
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FileNode {
  id?: number;           // Auto-increment
  projectId: number;     // Foreign key to Project
  parentId: number | null; // null = root level
  type: 'file' | 'folder';
  name: string;
  content?: string;      // Only for files
  createdAt: Date;
  updatedAt: Date;
  isOpen?: boolean;      // Folder expansion state
}
```

**Indexes**:
- `projects`: `++id, name, updatedAt`
- `nodes`: `++id, projectId, parentId, type, name, updatedAt`
- `documents`: Legacy support

### CRUD Operations

**Projects**:
```typescript
// Create
const id = await db.projects.add({ name, createdAt: new Date(), updatedAt: new Date() });

// Read
const project = await db.projects.get(id);

// Update
await db.projects.update(id, { name: newName, updatedAt: new Date() });

// Delete
await db.projects.delete(id);
```

**Files/Folders**:
```typescript
// Create file
await db.nodes.add({
  projectId,
  parentId: null, // or folder ID
  type: 'file',
  name,
  content,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Query files in folder
const files = await db.nodes
  .where({ projectId, parentId: folderId })
  .toArray();
```

### Reactive Queries

Using `dexie-react-hooks` for live updates:

```typescript
const projects = useLiveQuery(() => db.projects.toArray());
const files = useLiveQuery(
  () => db.nodes.where({ projectId, parentId }).toArray(),
  [projectId, parentId]
);
```

---

## Export System

### Architecture (`src/export/`)

```
src/export/
├── export-service.ts          # Main orchestrator
├── types.ts                   # TypeScript definitions
├── components/                # UI components
│   ├── ExportMenu.tsx        # Format dropdown
│   ├── ExportOptionsDialog.tsx # Export configuration
│   └── ExportProgressBar.tsx  # Loading overlay
├── exporters/                 # Format implementations
│   ├── markdown-exporter.ts
│   ├── html-exporter.ts
│   ├── pdf-exporter.ts
│   ├── docx-exporter.ts
│   ├── plaintext-exporter.ts
│   └── pptx-exporter.ts
└── utils/                     # Helper functions
    ├── file-saver.ts
    ├── markdown-parser.ts
    ├── sanitizer.ts
    └── theme-to-css.ts
```

### Export Orchestrator

**Usage**:
```typescript
const result = await ExportOrchestrator.export('pdf', {
  markdown: '# Hello',
  theme: currentTheme,
  options: exportOptions,
  metadata: { title: 'My Doc' }
});

await triggerDownload(result.blob, result.filename);
```

### Export Formats

| Exporter | File | Status | Library | Features |
|----------|------|--------|---------|----------|
| Markdown | `markdown-exporter.ts` | Complete | Native | Raw text export |
| HTML | `html-exporter.ts` | Complete | Unified.js | Self-contained with CSS, optional TOC |
| Plain Text | `plaintext-exporter.ts` | Complete | Native | Stripped formatting |
| PDF | `pdf-exporter.ts` | Complete | pdf-lib | Multi-page, WinAnsi, embedded PNG/JPG, configurable layout |
| DOCX | `docx-exporter.ts` | Complete | docx | Headings, lists, blockquotes, tables, inline formatting |
| PPTX | `pptx-exporter.ts` | Complete | pptxgenjs | One slide per section, title + body |
| PNG | `png-exporter.ts` | Complete | html-to-image | Themed 2x snapshot |
| EPUB | `epub-exporter.ts` | Complete | jszip | Minimal EPUB 3 |

### Export Options Interface

```typescript
interface ExportOptions {
  includeTheme: boolean;
  includeTableOfContents: boolean;
  pageSize: 'A4' | 'Letter' | 'A3';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  fontSize: number;
  embedImages: boolean;
}
```
// Deleted as dead (nothing ever read them): `headerFooter`, `syntaxHighlight`. Every remaining option is both rendered in the dialog and read by at least one exporter.

---

## Contributing Guidelines

### Code Standards

- **TypeScript**: Strict mode enabled
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS classes
- **Imports**: Group by type (React, libraries, local)
- **Naming**: PascalCase for components, camelCase for functions

### Development Workflow

1. **Fork & Clone**
   ```bash
   git clone <your-fork>
   cd markdown-converter
   ```

2. **Create Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Write clean, typed code
   - Follow existing patterns
   - Update tests if applicable

4. **Test**
   ```bash
   npm run lint
   npm run build
   ```

5. **Commit**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

6. **Push & PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Format

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance

### Areas Needing Contribution

See `TODO.md` for the live backlog — everything previously listed here (PPTX export, DOCX
formatting, mobile UI, shortcuts, word count) is shipped. Open items with rationale:
DOCX image embedding, fuzzy/cross-project search, skeleton screens, spacing/radius tokens,
Monaco bundling (offline editor), encrypted sync (needs threat model), i18n scope,
Storybook (needs account), HTML5 drag-and-drop move, `NodeItem` hoisting.

---

## Troubleshooting

### Common Issues

**Editor not loading**:
- Monaco loads from CDN — check `next.config.ts` and your connection
- Verify client-side hydration (`useEffect` pattern)

**Export failing**:
- Check browser console for errors
- Verify dynamic imports are working
- Check file-saver permissions

**Database errors**:
- Clear IndexedDB in DevTools (Application → IndexedDB → Delete database)
- Schema is **v5**; a mismatch shows a `VersionError` toast — the app surfaces
  persistence failures instead of failing silently

**Theme not applying**:
- Verify CSS variables are set (`--background`, `--surface-2`, `--accent-text`, …)
- Check the Monaco `custom-theme` definition in `ThemeProvider.tsx`

**"A tree hydrated but some attributes … didn't match"**:
- Almost always a **browser extension** (Grammarly is common for a writing app) adding
  `data-*` attributes to `<body>`/elements before React hydrates. `<html>`/`<body>` carry
  `suppressHydrationWarning`; if new nodes appear, add it there too.

**"Installed app doesn't work when the dev server is off"**:
- The service worker is **production-only** (`npm run build && npm run start`) and caches the
  origin it was installed from. An app installed from `localhost` dev has no worker at all —
  it's just a browser shortcut to a dead origin. Test offline with a production build or a
  deployed URL. **Monaco still needs network** (CDN) — the one known offline gap.

**Layout is empty / sidebar shows nothing**:
- Check for the "Local database unavailable" toast (quota/blocked upgrade).
- Hard-reload; if IndexedDB is mid-upgrade the page may have held a stale connection.

---

## PWA Notes for Contributors

- Worker: `app/sw.ts` (Serwist `defaultCache`, `skipWaiting`, `clientsClaim`), built to
  `public/sw.js` (git-ignored), registered by `SwRegister.tsx` **in production only**.
- Dev intentionally has **no worker** to avoid stale caches while iterating.
- Install UX: header install button (Chrome/Edge/Android `beforeinstallprompt`), iOS share-sheet
  instructions, `OfflineBadge` in the header, manifest shortcuts + screenshots.
- Verify offline in a production build or deployed URL, not under `npm run dev`.

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Dexie.js](https://dexie.org)
- [Zustand](https://docs.pmnd.rs/zustand)

---

## Support

- Review existing documentation
- Check GitHub Issues
- Create new issue for bugs/features

---

Thank you for contributing to Markdown Editor & Converter!
