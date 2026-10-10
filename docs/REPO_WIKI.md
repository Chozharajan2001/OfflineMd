# Repo Wiki: Markdown Editor & Converter

Complete documentation and knowledge base for the Markdown Editor & Converter project.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Links](#quick-links)
3. [Technology Stack](#technology-stack)
4. [Architecture](#architecture)
5. [Core Features](#core-features)
6. [Component Reference](#component-reference)
7. [Services Reference](#services-reference)
8. [Export System](#export-system)
9. [State Management](#state-management)
10. [Database Schema](#database-schema)
11. [Theming System](#theming-system)
12. [Development Guide](#development-guide)
13. [Troubleshooting](#troubleshooting)
14. [FAQ](#faq)

---

## Project Overview

**Markdown Editor & Converter** is a privacy-first, offline-capable markdown editor built with Next.js 16 and React 19. It provides a professional editing experience with Monaco Editor (the same editor powering VS Code), live preview, hierarchical project management, and multi-format export capabilities.

### Core Identity

- **Privacy First**: 100% client-side storage using IndexedDB - your documents never leave your device
- **Offline Capable**: ⚠️ Claimed but not delivered — no service worker is registered (see Privacy & Offline)
- **Zero Cost**: Completely free, no subscriptions or premium tiers
- **Open Source**: Community-driven development
- **Professional Tools**: IDE-quality editing experience with Monaco Editor

### Key Statistics

- **Version**: 0.1.0
- **Framework**: Next.js 16.1.4 (App Router)
- **React**: 19.2.3
- **Language**: TypeScript 5
- **Themes**: 17 built-in themes (12 dark, 5 light)
- **Export Formats**: 8 formats (Markdown, HTML, Plain Text, PDF, DOCX, PPTX, PNG, EPUB)

---

## Quick Links

### Documentation Files
- **[README.md](./README.md)** - Project overview, features, and quick start
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Comprehensive developer guide
- **[TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md)** - Deep technical architecture
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines
- **[QUICK_START.md](./QUICK_START.md)** - Rapid setup guide

### Key Directories
- **`app/`** - Next.js App Router, components, services, store
- **`src/export/`** - Export system (orchestrator, exporters, UI components)
- **`public/`** - Static assets, manifest.json
- **`types/`** - TypeScript type definitions

### Important Files
- **`app/store.ts`** - Zustand state management (430 lines)
- **`app/components/`** - All UI components (Editor, Preview, Sidebar, Header, etc.)
- **`app/services/`** - Database, Markdown Parser, Export Service
- **`src/export/types.ts`** - Export type definitions and interfaces

---

## Technology Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.4 | React framework with App Router |
| **React** | 19.2.3 | UI library |
| **TypeScript** | 5.x | Type safety |

### Styling & UI
| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **Radix UI** | Latest | Accessible UI primitives (Dialog, Dropdown, Tabs, Tooltip) |
| **Lucide React** | 0.562.0 | Icon library |
| **Class Variance Authority** | 0.7.1 | Component variant management |
| **clsx** | 2.1.1 | Conditional class merging |
| **tailwind-merge** | 3.4.0 | Tailwind class merging |
| **tailwindcss-animate** | 1.0.7 | Animation utilities |

### Editor & Preview
| Technology | Version | Purpose |
|------------|---------|---------|
| **@monaco-editor/react** | 4.7.0 | Monaco Editor React wrapper |
| **unified** | 15.0.1 | Markdown processing platform |
| **remark-parse** | 11.0.0 | Parse markdown to AST |
| **remark-gfm** | 3.0.1 | GitHub Flavored Markdown support |
| **remark-emoji** | 2.1.0 | Emoji support |
| **remark-rehype** | 11.1.2 | Convert remark (markdown) AST to rehype (HTML) AST |
| **rehype-stringify** | 10.0.1 | Serialize HTML AST to string |
| **rehype-sanitize** | 6.0.0 | XSS protection |
| **rehype-highlight** | 7.0.2 | Syntax highlighting |
| **highlight.js** | 11.11.1 | Syntax highlighting engine |
| **mermaid** | 11.12.2 | Diagram rendering |
| **unist-util-visit** | 5.0.0 | AST traversal |

### State & Storage
| Technology | Version | Purpose |
|------------|---------|---------|
| **Zustand** | 5.0.10 | State management |
| **dexie** | 4.2.1 | IndexedDB wrapper |
| **dexie-react-hooks** | 4.2.0 | Reactive database queries |

### Export System
| Technology | Version | Purpose |
|------------|---------|---------|
| **pdf-lib** | 1.17.1 | PDF generation |
| **docx** | 9.5.1 | Word document creation |
| **pptxgenjs** | 3.12.0 | PowerPoint creation |
| **file-saver** | 2.0.5 | Client-side file saving |

### Build & PWA
| Technology | Version | Purpose |
|------------|---------|---------|
| **@serwist/next** | 9.x | PWA service worker (replaced `next-pwa@5`) |
| **ESLint** | 9.x | Code linting |
| **PostCSS** | 4.x | CSS processing |
| **@tailwindcss/postcss** | 4.x | Tailwind PostCSS plugin |

### Development Dependencies
| Technology | Version | Purpose |
|------------|---------|---------|
| **@types/node** | 20 | Node.js type definitions |
| **@types/react** | 19 | React type definitions |
| **@types/react-dom** | 19 | React DOM type definitions |
| **@types/file-saver** | 2.0.7 | File-saver type definitions |
| **eslint-config-next** | 16.1.4 | Next.js ESLint config |

---

## Architecture

### High-Level System Overview

```mermaid
flowchart TD
    subgraph UI_Layer[`User Interface Layer`]
        User["👤 User"]
        Editor[Editor Component]
        Preview[Preview Component]
        ResizableLayout[ResizableLayout]
        Header[Header Component]
        ThemeProvider[ThemeProvider]
    end

    subgraph State_Layer[`State Management Layer`]
        Store[Zustand Store]
    end

    subgraph Service_Layer[`Service Layer`]
        MarkdownParser[MarkdownParser]
        ExportOrchestrator[ExportOrchestrator]
    end

    subgraph Export_Layer[`Export Implementations`]
        MarkdownExporter[MarkdownExporter]
        HtmlExporter[HtmlExporter]
        PdfExporter[PdfExporter]
        DocxExporter[DocxExporter]
        PlaintextExporter[PlaintextExporter]
        PptxExporter[PptxExporter]
        PngExporter[PngExporter]
        EpubExporter[EpubExporter]
    end

    subgraph Storage_Layer[`Storage Layer`]
        Database[MarkdownDB]
    end

    %% Main Flow: Editor and Preview
    User -->|Input markdown| Editor
    Editor -->|Update content| Store
    Store -->|Get content| MarkdownParser
    MarkdownParser -->|Parse to HTML| Preview
    Preview -->|Display| User

    %% Layout Management
    ResizableLayout -->|Contains| Editor
    ResizableLayout -->|Contains| Preview

    %% Theme Flow
    User -->|Select theme| Header
    Header -->|Update theme| Store
    Store -->|Apply theme| ThemeProvider
    ThemeProvider -->|Apply styles| Editor
    ThemeProvider -->|Apply styles| Preview

    %% Export Flow
    User -->|Request export| Header
    Header -->|Trigger export| ExportService
    ExportService -->|Orchestrate| ExportOrchestrator
    ExportOrchestrator -->|Select format| MarkdownExporter
    ExportOrchestrator -->|Select format| HtmlExporter
    ExportOrchestrator -->|Select format| PdfExporter
    ExportOrchestrator -->|Select format| DocxExporter
    ExportOrchestrator -->|Select format| PlaintextExporter
    ExportOrchestrator -->|Select format| PptxExporter
    ExportOrchestrator -->|Select format| PngExporter
    ExportOrchestrator -->|Select format| EpubExporter

    %% Storage Flow
    Store -->|Save content| Database
    Database -->|Load content| Store
    Store -->|Get content| Editor
```

### Component Relationships

```mermaid
                    ┌──────────────┐
                    │ ThemeProvider│
                    └──────┬───────┘
                           │ provides theme context
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │   Header    │ │   Editor    │ │   Preview   │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │
           │    ┌──────────┴──────────┐    │
           │    │                     │    │
           └────►   Zustand Store     ◄────┘
                │                     │
                │  • markdown         │
                │  • activeProjectId  │
                │  • activeFileId     │
                │  • theme            │
                └──────────┬──────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
         ┌──────▼──────┐       ┌──────▼──────┐
         │  Database   │       │  Export     │
         │  (Dexie)    │       │  System     │
         └─────────────┘       └─────────────┘
```

### Class Diagram

```mermaid
classDiagram
    %% UI Components
    class Editor {
        +markdown: string
        +setMarkdown(markdown: string) void
    }
    
    class Preview {
        +renderedHtml: string
        +theme: ThemeConfig
        +renderMarkdown(markdown: string) Promise~string~
    }
    
    class ResizableLayout {
        +Editor: Component
        +Preview: Component
    }
    
    class Header {
        +exportMenu: Component
    }
    
    class Sidebar {
        +activeProjectId: number
        +activeFileId: number
    }
    
    class ThemeProvider {
        +theme: ThemeConfig
        +setTheme(theme: ThemeConfig) void
        +applyPreset(presetName: string) void
    }
    
    %% Services
    class MarkdownParser {
        +parse(markdown: string) Promise~string~
    }
    
    class MarkdownDB {
        +projects: Table~Project~
        +files: Table~FileNode~
    }
    
    class ExportOrchestrator {
        +export(format: ExportFormat, input: ExportInput) Promise~ExportResult~
    }
    
    %% Export System
    class IExporter {
        <<interface>>
        +format: ExportFormat
        +extension: string
        +mimeType: string
        +export(input: ExportInput) Promise~ExportResult~
    }
    
    class MarkdownExporter {
        +export(input: ExportInput) Promise~ExportResult~
    }
    
    class HtmlExporter {
        +export(input: ExportInput) Promise~ExportResult~
    }
    
    class PdfExporter {
        +export(input: ExportInput) Promise~ExportResult~
    }
    
    class DocxExporter {
        +export(input: ExportInput) Promise~ExportResult~
    }
    
    class PlaintextExporter {
        +export(input: ExportInput) Promise~ExportResult~
    }
    
    class PptxExporter {
        +export(input: ExportInput) Promise~ExportResult~
    }
    
    class PngExporter {
        +export(input: ExportInput) Promise~ExportResult~
    }
    
    class EpubExporter {
        +export(input: ExportInput) Promise~ExportResult~
    }
    
    %% Export UI Components
    class ExportMenu {
        +onSelect(format: ExportFormat) void
    }
    
    class ExportOptionsDialog {
        +format: ExportFormat
        +options: ExportOptions
        +onExport(format: ExportFormat, options: ExportOptions) void
    }
    
    class ExportProgressBar {
        +visible: boolean
        +message: string
    }
    
    %% Store
    class MarkdownStore {
        +markdown: string
        +theme: ThemeConfig
        +activeProjectId: number
        +activeFileId: number
        +setMarkdown(markdown: string) void
        +setTheme(theme: ThemeConfig) void
    }
    
    %% Relationships
    MarkdownStore --> Editor : provides state
    MarkdownStore --> Preview : provides state
    MarkdownStore --> ThemeProvider : provides theme
    
    Editor --> MarkdownParser : uses
    Preview --> MarkdownParser : uses
    
    ResizableLayout --> Editor : contains
    ResizableLayout --> Preview : contains
    
    Header --> ExportMenu : contains
    ExportMenu --> ExportOptionsDialog : triggers
    ExportOptionsDialog --> ExportOrchestrator : initiates export
    
    ExportOrchestrator --> IExporter : uses
    MarkdownExporter ..|> IExporter : implements
    HtmlExporter ..|> IExporter : implements
    PdfExporter ..|> IExporter : implements
    DocxExporter ..|> IExporter : implements
    PlaintextExporter ..|> IExporter : implements
    PptxExporter ..|> IExporter : implements
    PngExporter ..|> IExporter : implements
    EpubExporter ..|> IExporter : implements
    
    MarkdownDB --> MarkdownStore : persists state
    
    ThemeProvider --> Editor : applies theme
    ThemeProvider --> Preview : applies theme
    
    ExportOrchestrator --> ExportProgressBar : shows progress
```

### Data Flow Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Editor
    participant MarkdownParser
    participant Preview
    participant ResizableLayout
    participant ThemeProvider
    participant Store
    participant ExportMenu
    participant ExportOptionsDialog
    participant ExportOrchestrator
    participant IExporter
    participant FileSaver

    %% Markdown Editing and Preview Flow
    User->>Editor: Input markdown content
    activate Editor
    Editor->>Store: Update markdown state
    Store-->>Editor: State updated
    Editor->>MarkdownParser: Parse markdown
    activate MarkdownParser
    MarkdownParser-->>Editor: Return HTML
    deactivate MarkdownParser
    Editor->>Preview: Update preview content
    activate Preview
    Preview-->>Editor: Render complete
    deactivate Preview
    deactivate Editor
    Editor->>ResizableLayout: Notify content change
    activate ResizableLayout
    ResizableLayout-->>Editor: Layout adjusted
    deactivate ResizableLayout

    %% Theme Switching Flow
    User->>ThemeProvider: Select new theme
    activate ThemeProvider
    ThemeProvider->>Store: Update theme state
    Store-->>ThemeProvider: State updated
    ThemeProvider->>Editor: Apply new theme
    ThemeProvider->>Preview: Apply new theme
    ThemeProvider->>ResizableLayout: Apply new theme
    deactivate ThemeProvider

    %% Export Function Flow
    User->>ExportMenu: Click export button
    activate ExportMenu
    ExportMenu-->>User: Show format options
    User->>ExportMenu: Select export format
    ExportMenu->>ExportOptionsDialog: Open options dialog
    activate ExportOptionsDialog
    ExportOptionsDialog-->>User: Display export options
    User->>ExportOptionsDialog: Confirm options
    ExportOptionsDialog->>ExportOrchestrator: Request export
    activate ExportOrchestrator
    ExportOrchestrator->>IExporter: Get specific exporter
    activate IExporter
    IExporter-->>ExportOrchestrator: Return exporter instance
    deactivate IExporter
    ExportOrchestrator->>IExporter: Execute export
    activate IExporter
    IExporter-->>ExportOrchestrator: Return ExportResult (Blob)
    deactivate IExporter
    ExportOrchestrator->>FileSaver: Save file
    activate FileSaver
    FileSaver-->>ExportOrchestrator: File saved
    deactivate FileSaver
    ExportOrchestrator-->>ExportOptionsDialog: Export complete
    deactivate ExportOrchestrator
    ExportOptionsDialog-->>User: Close dialog
    deactivate ExportOptionsDialog
    deactivate ExportMenu
```

### Detailed Architecture Diagram
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────┐ │
│  │   Header    │ │   Sidebar   │ │   Editor    │ │Preview │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  ThemeProvider                           │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
                              │
┌───────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                        │
│  ┌─────────────────────┐  ┌────────────────────────────────┐ │
│  │   State Management  │  │         Services               │ │
│  │  ┌───────────────┐  │  │  ┌──────────┐  ┌────────────┐ │ │
│  │  │    Zustand    │  │  │  │ Database │  │ Markdown   │ │ │
│  │  │    Store      │◄─┼──┼─►│ (Dexie)  │  │ Parser     │ │ │
│  │  └───────────────┘  │  │  └──────────┘  └────────────┘ │ │
│  │  ┌───────────────┐  │  │  ┌──────────────────────────┐ │ │
│  │  │    Themes     │  │  │  │    Export System         │ │ │
│  │  │   (17 total)  │  │  │  │  ┌────────────────────┐  │ │ │
│  │  └───────────────┘  │  │  │  │ ExportOrchestrator │  │ │ │
│  └─────────────────────┘  │  │  │  └────────────────────┘  │ │ │
│                           │  │  │  ┌────────────────────┐  │ │ │
│                           │  │  │  │ Exporters (8)      │  │ │ │
│                           │  │  │  │ • md/txt/html      │  │ │ │
│                           │  │  │  │ • pdf/docx/pptx     │  │ │ │
│                           │  │  │  │ • png/epub         │  │ │ │
│                           │  │  │  └────────────────────┘  │ │ │
│                           │  │  └──────────────────────────┘  │ │
│                           │  └────────────────────────────────┘ │
└───────────────────────────┴─────────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                    Infrastructure Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  IndexedDB  │  │ LocalStorage│  │   Browser APIs          │ │
│  │  (Dexie.js) │  │ (Zustand    │  │ • Monaco Editor         │ │
│  │             │  │  persist)   │  │ • File System Access    │ │
│  └─────────────┘  └─────────────┘  │ • Service Worker        │ │
│                                     │ • Canvas                │ │
│                                     └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### High-Level System Overview

```
                    ┌──────────────┐
                    │ ThemeProvider│
                    └──────┬───────┘
                           │ provides theme context
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │   Header    │ │   Editor    │ │   Preview   │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │
           │    ┌──────────┴──────────┐    │
           │    │                     │    │
           └────►   Zustand Store     ◄────┘
                │                     │
                │  • markdown         │
                │  • activeProjectId  │
                │  • activeFileId     │
                │  • theme            │
                └──────────┬──────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
         ┌──────▼──────┐       ┌──────▼──────┐
         │  Database   │       │  Export     │
         │  (Dexie)    │       │  System     │
         └─────────────┘       └─────────────┘
```

### Data Flow

#### Content Update Flow
```
User Types in Editor
         │
         ▼
┌─────────────────┐
│  Monaco Editor  │
│  onChange event │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   setMarkdown   │ (Zustand action)
│   Store Update  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌─────────────┐
│ Sidebar│ │   Preview   │
│(Recents│ │  Component  │
│update) │ │             │
└────────┘ └──────┬──────┘
                  │
                  ▼
         ┌────────────────┐
         │ Debounced Parse│
         │   (150ms)      │
         └────────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │ MarkdownParser │
         │   Service      │
         └────────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │   HTML Output  │
         │   + Styling    │
         └────────────────┘
```

#### File Operation Flow
```
User Action (Create/Delete/Load)
         │
         ▼
┌─────────────────┐
│ Sidebar Handler │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Dexie.js DB   │
│   Operation     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  IndexedDB      │
│  Persistence    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ useLiveQuery    │
│ Re-renders UI   │
└─────────────────┘
```

---

## Core Features

### 1. Privacy & Offline
- ✅ 100% client-side storage using IndexedDB (via Dexie.js)
- ✅ No backend data service — all data stays on your device
- ✅ Offline/PWA support via Serwist (`app/sw.ts`, registered by `SwRegister` in production)
- ✅ Service worker caching of static assets (precache + runtime `defaultCache`)
- ✅ No account required, no data collection

### 2. Editor Features
- ✅ **Monaco Editor** integration - the same editor powering VS Code
- ✅ Live markdown preview with split-pane layout
- ✅ Syntax highlighting for code blocks (via highlight.js)
- ✅ Mermaid diagram support (flowcharts, sequence diagrams, etc.)
- ✅ Responsive resizable panels
- ✅ Font ligatures support
- ✅ Word wrap enabled
- ✅ Automatic layout adjustment

### 3. Organization System
- ✅ **Projects** - Create multiple projects for different contexts
- ✅ **Hierarchical folders** - Organize files with nested folder support
- ✅ **File management** - Create, rename and delete files and folders (move/reparent is not implemented)
- ✅ **Recent files** - Quick access to recently edited documents
- ✅ Reactive database queries with dexie-react-hooks

### 4. Theming System
- ✅ **17 Built-in Themes**:
  - **Dark (12)**: Dark, Dracula, GitHub Dark, Nord, One Dark Pro, Tokyo Night, Solarized Dark, Monokai Pro, Gruvbox Dark, Obsidian, Forest, Ocean
  - **Light (5)**: Light, GitHub Light, Solarized Light, Notion, Sepia
- ✅ Customizable editor fonts and sizes
- ✅ Theme-aware preview rendering
- ✅ CSS variable-based theming
- ✅ Monaco Editor theme synchronization

### 5. Export Options

| Format | Status | Library | Features |
|--------|--------|---------|----------|
| **Markdown (.md)** | ✅ Complete | Native | Raw markdown export |
| **HTML (.html)** | ✅ Complete | Unified.js | Self-contained with theme CSS |
| **Plain Text (.txt)** | ✅ Complete | Native | Stripped markdown formatting |
| **PDF (.pdf)** | ✅ Complete | pdf-lib | Multi-page, glyph-safe text, embedded PNG/JPG |
| **Word (.docx)** | ✅ Complete | docx | Headings, lists, blockquotes, tables, inline formatting |
| **PowerPoint (.pptx)** | ✅ Complete | pptxgenjs | One slide per markdown section |
| **Project archive (.zip)** | ✅ Complete | jszip | Whole project tree from the sidebar |

---

## Component Reference

### Main Components Directory: `app/components/`

#### 1. **Editor** ([`Editor.tsx`](app/components/Editor.tsx))
- **Type**: Client Component ('use client')
- **Purpose**: Monaco Editor integration for markdown editing
- **Key Features**:
  - SSR-safe hydration handling + autosave (2.5s idle, revision-guarded)
  - Theme-responsive font sizing; `custom-theme` defined by ThemeProvider
  - Single status surface (state dot + stats in the status bar)
  - Markdown language mode, ligatures, word wrap, minimap disabled
- **Dependencies**: `@monaco-editor/react`, `useMarkdownStore`, `db` (autosave)

```typescript
// Key implementation details
const [isClient, setIsClient] = useState(false);
useEffect(() => { setIsClient(true); }, []);

// Monaco configuration options:
{
  minimap: { enabled: false },
  wordWrap: 'on',
  automaticLayout: true,
  fontSize: theme.editor.fontSize,
  theme: "custom-theme", // luminance-based base, set by ThemeProvider
  fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
  fontLigatures: true,
}
```

#### 2. **Preview** ([`Preview.tsx`](app/components/Preview.tsx))
- **Type**: Client Component
- **Purpose**: Live markdown preview with syntax highlighting, KaTeX math and Mermaid diagrams
- **Key Features**:
  - Debounced parsing (150ms) with race-token guard + double sanitization
  - Mermaid rendering (scoped to preview, `securityLevel: 'strict'`)
  - Front-matter badge, guided empty-state card, preview-local toolbar
  - `toc-navigate` jumps, theme-aware inline styles, XSS-safe HTML rendering
- **Dependencies**: `markdownParser`, `mermaid` (lazy), `useMarkdownStore`

```typescript
// Debounced parsing with stale-parse guard (see source for full pipeline)
const html = await markdownParser.parse(md);
const safeHtml = DOMPurify.sanitize(html, { /* strict allowlist */ });

// Mermaid rendering — scoped, never document-wide
scope.querySelectorAll('pre > code.language-mermaid').forEach((codeEl) => { /* … */ });
```

#### 3. **Sidebar** ([`Sidebar.tsx`](app/components/Sidebar.tsx))
- **Type**: Client Component
- **Purpose**: Projects, nested tree, name+content search, recents, favorites, contents, trash, move/history dialogs
- **Key Features**:
  - Project creation/selection (+ "My Notes" auto-bootstrap)
  - Folder/file tree with nesting, context menu, undo toasts
  - Content search with snippets + highlighting, favorites, trash footer
- **Dependencies**: `db` (Dexie.js), `useLiveQuery`, `useMarkdownStore`

```typescript
// Reactive database queries (single project query; tree/search/trash derive)
const projects = useLiveQuery(() => db.projects.toArray()) || [];
const projectNodesResult = useLiveQuery(
  () => (activeProjectId ? db.nodes.where('projectId').equals(activeProjectId).toArray() : []),
  [activeProjectId]
);
```

#### 4. **Header** ([`Header.tsx`](app/components/Header.tsx))
- **Type**: Client Component
- **Purpose**: Save primary, export split-button, view modes, overflow menu, settings tabs
- **Key Features**:
  - Revision-guarded save/import (toast feedback, history capture)
  - Export menu (8 formats + hints + last-used) with cancellable progress
  - Appearance (swatch radios) / Workspace (backup) settings tabs
  - Shortcuts: save, export, new file/project, palette
- **Dependencies**: `ExportOrchestrator`, `db`, `useMarkdownStore`

```typescript
// Save logic (revision-guarded, toast feedback — never alert())
const handleSave = async () => {
  if (isSaving) return;
  if (activeFileId) {
    /* guarded update + captureRevision + toast */
  } else if (!activeProjectId) {
    toast.error('Please select a project…');
  } else {
    setOpenSaveAsDialog(true);
  }
};

// Export integration (run-token cancellation)
const result = await ExportOrchestrator.export(format, {
  markdown, theme, options,
  metadata: await buildExportMetadata(),
  onProgress: (p) => { if (exportRunId.current === runId) setExportProgress(p); },
});
await triggerDownload(result.blob, result.filename);
```

#### 5. **ResizableLayout** ([`ResizableLayout.tsx`](app/components/ResizableLayout.tsx))
- **Type**: Client Component
- **Purpose**: Editor-only / split / preview modes (`viewMode`) + resizable split
- **Key Features**:
  - Conditional panes (single-pane default on small screens)
  - Horizontal split panels with draggable separator
  - Keyboard resize (arrows, imperative group handle), labeled separator
  - Minimum size constraints
- **Dependencies**: `react-resizable-panels`

#### 6. **ThemeProvider** ([`ThemeProvider.tsx`](app/components/ThemeProvider.tsx))
- **Type**: Client Component
- **Purpose**: Theme tokens (surfaces, semantics, `--accent-text`), Monaco sync, `theme-color` meta
- **Key Features**:
  - CSS custom properties injection (luminance-derived, `useSyncExternalStore` mount)
  - Monaco `custom-theme` definition (luminance-based base)
  - Hydration-safe mounting
  - Smooth transitions (150ms)
- **Dependencies**: `useMonaco`, `useMarkdownStore`

```typescript
// CSS variable injection (surfaces, semantics, accent-text, theme-color meta)
const isDark = getLuminance(theme.ui.background) < 0.5;

// Monaco theme synchronization (luminance-based, not a color-name check)
monaco.editor.defineTheme('custom-theme', {
  base: isDark ? 'vs-dark' : 'vs',
  ...
});
monaco.editor.setTheme('custom-theme');
```

---

## Services Reference

### Services Directory: `app/services/` (live: `Database.ts`, `MarkdownParser.ts` — the legacy
`ExportService.ts`/`ThemeAdapter.ts` were deleted; theming lives in `ThemeProvider.tsx`)

```typescript
export class MarkdownDB extends Dexie {
  projects!: Table<Project, number>;
  nodes!: Table<FileNode, number>; // +deletedAt (v3 trash), +isFavorite (v4)
  revisions!: Table<Revision, number>; // v5: version history
  documents!: Table<Record<string, unknown>, number>; // Legacy support

  constructor() {
    super('MarkdownConverterDB');
    // versions 2→5 (see source for exact stores)
  }
}

export const db = new MarkdownDB();
```

#### 2. **Markdown Parser** ([`MarkdownParser.ts`](app/services/MarkdownParser.ts))
- **Lines**: 40
- **Library**: Unified.js ecosystem
- **Purpose**: Parse markdown to sanitized HTML

```typescript
export class MarkdownParser {
  private processor: Processor<MdastRoot, MdastRoot, HastRoot, HastRoot, string>;

  constructor() {
    this.processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeKatex)
      .use(rehypeSlug)
      .use(rehypeSanitize, { /* strict allowlist incl. KaTeX MathML */ })
      .use(rehypeHighlight)
      .use(rehypeForceSafeLinks)
      .use(rehypeStringify, { allowDangerousHtml: true });
  }

  async parse(markdown: string): Promise<string> {
    const { content } = getFrontMatter(markdown); // gray-matter, never throws
    const file = await this.processor.process(content);
    return String(file);
  }
}

export const markdownParser = new MarkdownParser();
```

#### 3. ~~Export Service~~ — removed
`app/services/ExportService.ts` (legacy html2pdf path) was deleted; all exports go through `src/export/` (`ExportOrchestrator`). The `html2pdf.js` dependency was uninstalled with it.

---

## Export System

### Export System Directory: `src/export/`

### Architecture

```
                    Export Request
                         │
                         ▼
              ┌────────────────────┐
              │ ExportOrchestrator │
              │   (Factory)        │
              └─────────┬──────────┘
                        │
         ┌──────────────┼──────────────┬──────────────┐
         │              │              │              │
         ▼              ▼              ▼              ▼
┌────────────────┐ ┌────────┐ ┌────────────────┐ ┌────────────────┐
│ getExporter()  │ │ Markdown│ │     HTML       │ │      PDF       │
│                │ │Exporter │ │   Exporter     │ │   Exporter     │
│ Dynamic Import │ │        │ │                │ │                │
└────────┬───────┘ └────┬───┘ └────────┬───────┘ └────────┬───────┘
         │              │              │                  │
         │              ▼              ▼                  ▼
         │         ┌──────────────────────────────────────────┐
         │         │           IExporter Interface            │
         │         │  • format, extension, mimeType, label   │
         │         │  • supportsTheme, supportsEditing       │
         │         │  • supportsImages                       │
         │         │  • export(): Promise<ExportResult>      │
         │         └──────────────────────────────────────────┘
         │
         ▼
┌────────────────┐
│ ExportResult   │
│  • blob        │
│  • filename    │
│  • mimeType    │
│  • size        │
│  • duration    │
└────────────────┘
```

### Export Orchestrator ([`export-service.ts`](src/export/export-service.ts))

```typescript
export class ExportOrchestrator {
  static async export(format: ExportFormat, input: ExportInput): Promise<ExportResult> {
    const exporter = await this.getExporter(format);
    return exporter.export(input);
  }

  private static async getExporter(format: ExportFormat): Promise<IExporter> {
    switch (format) {
      case 'md':
        return new (await import('./exporters/markdown-exporter')).MarkdownExporter();
      case 'txt':
        return new (await import('./exporters/plaintext-exporter')).PlaintextExporter();
      case 'html':
        return new (await import('./exporters/html-exporter')).HtmlExporter();
      case 'pdf':
        return new (await import('./exporters/pdf-exporter')).PdfExporter();
      case 'docx':
        return new (await import('./exporters/docx-exporter')).DocxExporter();
      case 'pptx':
        return new (await import('./exporters/pptx-exporter')).PptxExporter();
      case 'png':
        return new (await import('./exporters/png-exporter')).PngExporter();
      case 'epub':
        return new (await import('./exporters/epub-exporter')).EpubExporter();
      default:
        throw new Error('Unsupported export format: ' + format);
    }
  }
}
```

### Export Types ([`types.ts`](src/export/types.ts))

```typescript
export type ExportFormat = 'md' | 'txt' | 'html' | 'pdf' | 'docx' | 'pptx' | 'png' | 'epub';

export interface IExporter {
  format: ExportFormat;
  extension: string;
  mimeType: string;
  label: string;
  icon?: string;

  supportsTheme: boolean;
  supportsEditing: boolean;
  supportsImages: boolean;

  export(content: ExportInput): Promise<ExportResult>;
  preview?(content: ExportInput): Promise<string | Blob>;
  estimateSize?(content: ExportInput): number;
}

export interface ExportInput {
  markdown: string;
  ast?: any;
  theme: ThemeTokens;
  options: ExportOptions;
  metadata: DocumentMetadata;
}

export interface ExportOptions {
  includeTheme: boolean;
  includeTableOfContents: boolean;
  pageSize: 'A4' | 'Letter' | 'A3';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  fontSize: number;
  embedImages: boolean;
}
```

### Exporters

#### 1. **Markdown Exporter** ([`markdown-exporter.ts`](src/export/exporters/markdown-exporter.ts))
- **Status**: ✅ Complete
- **Features**: Raw markdown export

#### 2. **HTML Exporter** ([`html-exporter.ts`](src/export/exporters/html-exporter.ts))
- **Status**: ✅ Complete
- **Features**: Full HTML document with theme CSS

#### 3. **PDF Exporter** ([`pdf-exporter.ts`](src/export/exporters/pdf-exporter.ts))
- **Status**: ✅ Complete
- **Lines**: 81
- **Features**: 
  - Multi-page support
  - WinAnsi encoding
  - Automatic page breaks
  - Text wrapping
- **Special**: Includes `sanitizeForWinAnsi()` method for character encoding

#### 4. **DOCX Exporter** ([`docx-exporter.ts`](src/export/exporters/docx-exporter.ts))
- **Status**: ✅ Complete
- **Features**: Converts markdown into real Word structures — headings, bullet/ordered lists,
  blockquotes, tables and inline bold/italic/code runs
- **Limitation**: images are not embedded in DOCX output

#### 5. **Plaintext Exporter** ([`plaintext-exporter.ts`](src/export/exporters/plaintext-exporter.ts))
- **Status**: ✅ Complete
- **Features**: Strips markdown formatting

#### 6. **PPTX Exporter** ([`pptx-exporter.ts`](src/export/exporters/pptx-exporter.ts))
- **Status**: ✅ Complete
- **Note**: Uses `pptxgenjs` (dynamically imported) to build a title slide plus one content slide
  per markdown section

#### 7. **PNG Exporter** ([`png-exporter.ts`](src/export/exporters/png-exporter.ts))
- **Status**: ✅ Complete
- **Note**: Themed 2x off-screen snapshot via `html-to-image` (dynamically imported)

#### 8. **EPUB Exporter** ([`epub-exporter.ts`](src/export/exporters/epub-exporter.ts))
- **Status**: ✅ Complete
- **Note**: Minimal EPUB 3 via JSZip (stored mimetype first, container, package, XHTML spine)

### Export UI Components

#### ExportMenu ([`ExportMenu.tsx`](src/export/components/ExportMenu.tsx))
- **Features**: Dropdown menu with 8 format options + outcome hints + last-used check

#### ExportOptionsDialog ([`ExportOptionsDialog.tsx`](src/export/components/ExportOptionsDialog.tsx))
- **Features**: Fixed-skeleton export configuration (Output summary, Style, Page) with validation + cancellable run

#### ExportProgressBar ([`ExportProgressBar.tsx`](src/export/components/ExportProgressBar.tsx))
- **Features**: Cancellable loading overlay with percentage

---

## State Management

### Zustand Store ([`store.ts`](app/store.ts))

```typescript
interface MarkdownStore {
  // Editor Content (+ save lifecycle: idle|dirty|saving|saved|error, revision race guard)
  markdown: string;
  setMarkdown: (markdown: string) => void;
  setMarkdownFromUser: (markdown: string) => void;

  // File System State
  activeProjectId: number | null;
  activeFileId: number | null;

  // UI State (persisted, except pendingDeepLink)
  viewMode: 'editor' | 'split' | 'preview';
  pendingDeepLink: string | null; // one-shot launch intent (?new=file)

  // Theme State (17 presets)
  theme: ThemeConfig;
  // …setters, resetTheme, applyPreset
}
```

### Persistence

```typescript
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
      // Persists selection, save state, UI flags, theme — but NOT the full
      // markdown text (lives in Dexie) or pendingDeepLink (one-shot).
    }
  )
);
```

---

## Database Schema

### Database Location: [`Database.ts`](app/services/Database.ts)

### Schema Definition

```typescript
export interface Project {
  id?: number;              // Auto-increment primary key
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileNode {
  id?: number;              // Auto-increment primary key
  projectId: number;        // Foreign key to Project
  parentId: number | null;  // Self-referential for folders
  type: 'file' | 'folder';
  name: string;
  content?: string;         // Only populated for files
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;  // v3: trash
  isFavorite?: boolean;     // v4: pinning (unindexed)
  isOpen?: boolean;
}

export interface Revision {  // v5: version history
  id?: number;
  fileId: number;
  content: string;
  createdAt: Date;
}
```

### Indexes

| Table | Primary Key | Secondary Indexes |
|-------|-------------|-------------------|
| projects | ++id (auto) | name, updatedAt |
| nodes | ++id (auto) | projectId, parentId, type, name, updatedAt, deletedAt |
| revisions | ++id (auto) | fileId, createdAt |
| documents | ++id (auto) | name, updatedAt |

### Common Queries

```typescript
// Get all projects
const projects = await db.projects.toArray();

// Get root-level nodes
const nodes = await db.nodes
  .where({ projectId, parentId: null })
  .toArray();

// Get recent files
// NOTE: reverse() before sortBy() is ignored — sortBy is always ascending
const recents = await db.nodes
  .where('type').equals('file')
  .sortBy('updatedAt');
const recentFiles = recents.filter((f) => !f.deletedAt).slice(-5).reverse();

// Update file
await db.nodes.update(id, {
  content: newContent,
  updatedAt: new Date()
});
```

---

## Theming System

### Available Themes (17 Total)

#### Dark Themes (12)
1. **dark** - Default dark theme
2. **dracula** - Dracula theme
3. **github-dark** - GitHub Dark theme
4. **nord** - Nord theme
5. **one-dark-pro** - One Dark Pro (Atom's default)
6. **tokyo-night** - Tokyo Night theme
7. **solarized-dark** - Solarized Dark
8. **monokai-pro** - Monokai Pro
9. **gruvbox-dark** - Gruvbox Dark
10. **obsidian** - Obsidian theme
11. **forest** - Forest theme
12. **ocean** - Ocean theme

#### Light Themes (5)
1. **light** - Default light theme
2. **github-light** - GitHub Light theme
3. **solarized-light** - Solarized Light
4. **notion** - Notion-like theme
5. **sepia** - Sepia / Paper theme

### Theme Configuration Structure

```typescript
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
```

### CSS Variables

ThemeProvider injects these CSS custom properties:

```css
:root {
  /* UI Colors */
  --background: #09090b;
  --foreground: #fafafa;
  --border: #27272a;
  --accent: #2563eb;

  /* Editor Colors */
  --editor-bg: #18181b;
  --editor-fg: #e4e4e7;

  /* Preview Colors */
  --preview-bg: #09090b;
  --preview-fg: #e4e4e7;
}
```

---

## Development Guide

### Prerequisites
- Node.js 18+
- npm, yarn, pnpm, or bun
- Git

### Installation

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

### Available Scripts

```bash
npm run dev      # Start development server with webpack
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Project Structure

```
markdown-converter/
├── app/                          # Next.js App Router
│   ├── components/               # React components
│   │   ├── Editor.tsx           # Monaco Editor wrapper
│   │   ├── Preview.tsx          # Markdown preview with Mermaid
│   │   ├── Header.tsx           # Toolbar with export/settings
│   │   ├── Sidebar.tsx          # Project/file navigation
│   │   ├── ResizableLayout.tsx  # Split-pane layout
│   │   └── ThemeProvider.tsx    # Theme synchronization
│   ├── services/                # Business logic
│   │   ├── Database.ts          # Dexie.js IndexedDB schema
│   │   ├── MarkdownParser.ts    # Unified.js processor
│   │   └── ExportService.ts     # Legacy export (deprecated)
│   ├── store.ts                 # Zustand state management
│   ├── layout.tsx               # Root layout with PWA config
│   ├── page.tsx                 # Main page
│   └── globals.css              # Global styles & Tailwind
├── src/export/                  # New export system
│   ├── export-service.ts        # Export orchestrator
│   ├── types.ts                 # Export type definitions
│   ├── components/              # Export UI components
│   └── exporters/               # Format-specific exporters
│       ├── markdown-exporter.ts
│       ├── html-exporter.ts
│       ├── pdf-exporter.ts
│       ├── docx-exporter.ts
│       ├── plaintext-exporter.ts
│       └── pptx-exporter.ts
├── types/                       # TypeScript declarations
├── public/                      # Static assets
└── Documentation files
```

### Code Standards

- **TypeScript**: Strict mode enabled
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS classes
- **Imports**: Group by type (React, libraries, local)
- **Naming**: PascalCase for components, camelCase for functions

### Commit Message Format

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance

---

## Troubleshooting

### Common Issues

#### Editor not loading
**Problem**: Monaco Editor doesn't render  
**Solutions**:
- Check Monaco Editor webpack configuration in `next.config.ts`
- Verify client-side hydration (`useEffect` pattern)
- Check browser console for errors

#### Export failing
**Problem**: Export throws errors or doesn't download  
**Solutions**:
- Check browser console for import errors
- Verify dynamic imports are working
- Check file-saver permissions in browser
- Ensure export format is supported

#### Database errors
**Problem**: Can't save/load files  
**Solutions**:
- Clear IndexedDB in DevTools Application tab
- Check Dexie.js version compatibility
- Verify database schema version

#### Theme not applying
**Problem**: Theme changes don't reflect  
**Solutions**:
- Inspect CSS variables in DevTools
- Check Monaco theme definition
- Verify ThemeProvider is mounted

#### TypeScript errors
**Known non-blocking errors**:
- `plaintext-exporter.ts` empty file causing module errors
- PDF exporter Uint8Array type mismatch
- ExportMenu JSX namespace issue
- next.config.ts withPWA type mismatch

### Performance Considerations

1. **Large Files**: No virtualized rendering, may lag with >10k lines
2. **Memory Usage**: Monaco keeps full document in memory
3. **PDF Export**: Builds entire document in memory before saving

---

## FAQ

### Q: Is my data stored locally?
**A**: Yes! All data is stored in your browser's IndexedDB. Nothing is transmitted to servers.

### Q: Can I use this offline?
**A**: Yes — a Serwist service worker (`app/sw.ts`) precaches the app shell and runtime-caches
static assets, and notes live in IndexedDB. Caveat: Monaco Editor loads from CDN at runtime, so
the editor pane needs network until Monaco is bundled (M6).

### Q: How do I export my documents?
**A**: Click the Export button in the header, choose your format (Markdown, HTML, PDF, DOCX, TXT, PPTX, PNG, or EPUB), configure options, and download.

### Q: Can I organize files into folders?
**A**: Yes! The app supports hierarchical folder structures within projects.

### Q: How many themes are available?
**A**: There are 17 built-in themes: 12 dark themes and 5 light themes.

### Q: Does it support syntax highlighting for code?
**A**: Yes! Code blocks are highlighted using highlight.js with support for many programming languages.

### Q: Can I create diagrams?
**A**: Yes! Mermaid diagram syntax is supported for flowcharts, sequence diagrams, and more.

### Q: Is it really free?
**A**: Yes, completely free with no premium tiers or subscriptions.

### Q: Can I contribute to the project?
**A**: Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Q: What browsers are supported?
**A**: Chrome/Edge 90+, Firefox 88+, Safari 14+, Opera 76+. Requires IndexedDB support.

### Q: Where is the export system located?
**A**: The new modular export system is in `src/export/`. The old `app/services/ExportService.ts` is deprecated.

### Q: Why are there TypeScript errors?
**A**: There are none — `npx tsc --noEmit` is clean and `npx eslint .` reports 0 errors / 0 warnings. An older revision of this FAQ listed four historical errors; all were fixed.

---

## Additional Resources

### External Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Dexie.js](https://dexie.org)
- [Zustand](https://docs.pmnd.rs/zustand)
- [Unified.js](https://unifiedjs.com/)
- [Mermaid](https://mermaid.js.org/)

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

**Requirement**: IndexedDB support for file storage

---

*Last Updated: March 15, 2026*  
*Project Version: 0.1.0*
