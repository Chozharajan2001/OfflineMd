# Technical Documentation: Markdown Editor & Converter

Comprehensive technical documentation covering architecture, implementation details, data flow, and system design.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Component Deep Dive](#component-deep-dive)
4. [Data Flow](#data-flow)
5. [State Management](#state-management)
6. [Storage System](#storage-system)
7. [Markdown Processing Pipeline](#markdown-processing-pipeline)
8. [Export System Architecture](#export-system-architecture)
9. [Theming System](#theming-system)
10. [Performance Optimizations](#performance-optimizations)
11. [Security Measures](#security-measures)
12. [PWA Implementation](#pwa-implementation)
13. [Known Issues & Limitations](#known-issues--limitations)

---

## System Overview

The Markdown Editor & Converter is a single-page application (SPA) built with Next.js App Router. It operates entirely client-side with no server requirements, storing all data in the browser's IndexedDB.

### Key Characteristics

- **Client-side only**: No API calls, no backend
- **PWA-enabled**: ⚠️ Intended but not wired — no `withPWA` in `next.config.ts`, no service worker registration
- **Module-based exports**: Pluggable export architecture
- **Reactive data**: Live queries for UI updates
- **Theme-aware**: 17 built-in themes with CSS variable system

---

## Architecture

### Layered Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Presentation Layer                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │   Header    │ │   Sidebar   │ │   Editor    │ │  Preview  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                  ThemeProvider                             │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                       │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐  │
│  │   State Management  │  │         Services                │  │
│  │  ┌───────────────┐  │  │  ┌──────────┐  ┌────────────┐  │  │
│  │  │    Zustand    │  │  │  │ Database │  │ Markdown   │  │  │
│  │  │    Store      │◄─┼──┼─►│ (Dexie)  │  │ Parser     │  │  │
│  │  └───────────────┘  │  │  └──────────┘  └────────────┘  │  │
│  │  ┌───────────────┐  │  │  ┌──────────────────────────┐  │  │
│  │  │    Themes     │  │  │  │    Export System         │  │  │
│  │  │   (17 total)  │  │  │  │  ┌────────────────────┐  │  │  │
│  │  └───────────────┘  │  │  │  │ ExportOrchestrator │  │  │  │
│  └─────────────────────┘  │  │  │  └────────────────────┘  │  │  │
│                           │  │  │  ┌────────────────────┐  │  │  │
│                           │  │  │  │ Export Exporters   │  │  │  │
│                           │  │  │  │ • markdown         │  │  │  │
│                           │  │  │  │ • html             │  │  │  │
│                           │  │  │  │ • pdf              │  │  │  │
│                           │  │  │  │ • docx             │  │  │  │
│                           │  │  │  │ • plaintext        │  │  │  │
│                           │  │  │  │ • pptx             │  │  │  │
│                           │  │  │  └────────────────────┘  │  │  │
│                           │  │  └──────────────────────────┘  │  │
│                           │  └─────────────────────────────────┘  │
└───────────────────────────┴───────────────────────────────────────┘
                              │
┌─────────────────────────────┴─────────────────────────────────────┐
│                      Infrastructure Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────────────┐ │
│  │  IndexedDB  │  │LocalStorage │  │    Browser APIs           │ │
│  │  (Dexie.js) │  │(Zustand    │  │ • Monaco Editor          │ │
│  │             │  │ persist)    │  │ • File System Access     │ │
│  └─────────────┘  └─────────────┘  │ • Service Worker         │ │
│                                     │ • Canvas                 │ │
│                                     └───────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

### Component Relationships

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

---

## Component Deep Dive

### 1. Editor Component

**File**: `app/components/Editor.tsx`
**Lines**: 46
**Type**: Client Component ('use client')

#### Implementation Details

```typescript
// Client-side hydration handling
const [isClient, setIsClient] = useState(false);
useEffect(() => { setIsClient(true); }, []);

// Monaco Editor configuration
<MonacoEditor
  height="100%"
  language="markdown"
  value={markdown}
  onChange={(value) => setMarkdown(value || '')}
  theme="vs-dark"
  options={{
    minimap: { enabled: false },
    wordWrap: 'on',
    automaticLayout: true,
    fontSize: theme.editor.fontSize,
    scrollBeyondLastLine: false,
    padding: { top: 16, bottom: 16 },
    fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
    fontLigatures: true,
  }}
/>
```

#### Key Features
- **SSR-safe**: Only renders on client-side to avoid hydration mismatches
- **Theme-responsive**: Font size synced with store theme
- **Markdown mode**: Full syntax highlighting and IntelliSense
- **Font features**: Ligatures enabled for better code readability

#### Dependencies
- `@monaco-editor/react`: Monaco Editor React wrapper
- `useMarkdownStore`: For content and theme access

---

### 2. Preview Component

**File**: `app/components/Preview.tsx`
**Lines**: 256
**Type**: Client Component

#### Implementation Details

**Debounced Parsing**:
```typescript
const debouncedParse = useRef(
  debounce(async (md: string) => {
    const html = await markdownParser.parse(md);
    setRenderedHtml(html);
  }, 150) // 150ms delay
);
```

**Mermaid Diagram Rendering**:
```typescript
useEffect(() => {
  if (!isClient) return;
  const timer = setTimeout(() => {
    const mermaidNodes = document.querySelectorAll('.language-mermaid');
    if (mermaidNodes.length > 0) {
      mermaid.run({ nodes: Array.from(mermaidNodes) })
        .catch((err) => console.debug('Mermaid rendering:', err));
    }
  }, 100);
  return () => clearTimeout(timer);
}, [renderedHtml, isClient]);
```

**Theme-aware Inline Styles**:
The component injects CSS dynamically based on the current theme:
- Typography (h1-h6, p, lists)
- Code blocks and inline code
- Tables and blockquotes
- Links and emphasis
- Mermaid diagram containers

#### Performance Optimizations
1. **Debounced parsing**: Prevents excessive re-renders during typing
2. **Client-side only**: Avoids SSR complexity with HTML injection
3. **Efficient selectors**: QuerySelector for Mermaid nodes
4. **Cleanup**: Proper timeout cleanup in useEffect

---

### 3. Sidebar Component

**File**: `app/components/Sidebar.tsx`
**Lines**: 202
**Type**: Client Component

#### Implementation Details

**Reactive Data with Live Queries**:
```typescript
const projects = useLiveQuery(() => db.projects.toArray()) || [];

const NodeList = ({ parentId }: { parentId: number | null }) => {
  const nodes = useLiveQuery(
    () => activeProjectId
      ? db.nodes.where({ projectId: activeProjectId, parentId }).toArray()
      : []
    , [activeProjectId, parentId]
  ) || [];
  // ...
};
```

**Recursive Folder Rendering**:
```typescript
const NodeItem = ({ node }: { node: FileNode }) => {
  if (node.type === 'folder') {
    return (
      <div className="pl-2">
        <div onClick={toggleExpansion}>
          {isExpanded ? <ChevronDown /> : <ChevronRight />}
          <Folder />
          <span>{node.name}</span>
        </div>
        {isExpanded && <NodeList parentId={node.id!} />}
      </div>
    );
  }
  // File rendering...
};
```

**CRUD Operations**:
- `createProject()`: Prompts for name, adds to DB
- `createNode()`: Creates file/folder with parent reference
- `deleteNode()`: Removes node and updates active file if needed
- `loadFile()`: Fetches content and updates editor

#### State Management
- `expandedFolders`: Local state for folder expansion
- `activeProjectId`, `activeFileId`: Global store state
- `projects`, `nodes`: Reactive database queries

---

### 4. Header Component

**File**: `app/components/Header.tsx`
**Lines**: 205
**Type**: Client Component

#### Implementation Details

**Save Logic**:
```typescript
const handleSave = async () => {
  if (activeFileId) {
    // Update existing file
    await db.nodes.update(activeFileId, {
      content: markdown,
      updatedAt: new Date()
    });
  } else {
    // Create new file
    if (!activeProjectId) {
      alert("Please select a project first.");
      return;
    }
    const id = await db.nodes.add({
      projectId: activeProjectId,
      parentId: null,
      type: 'file',
      name,
      content: markdown,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setActiveFile(id as number);
  }
};
```

**Export Integration**:
```typescript
const handleExport = async (format: ExportFormat, options: ExportOptions) => {
  setExporting(true);
  try {
    const { markdown, theme } = useMarkdownStore.getState();
    const result = await ExportOrchestrator.export(format, {
      markdown,
      theme,
      options,
      metadata: {}
    });
    await triggerDownload(result.blob, result.filename);
  } finally {
    setExporting(false);
  }
};
```

#### UI Components
- **File Operations**: Save, Import (with hidden file input)
- **Export Menu**: Dropdown with 6 format options
- **Settings Dialog**: Theme preset selection, font size
- **Progress Bar**: Loading overlay during export

---

### 5. ThemeProvider Component

**File**: `app/components/ThemeProvider.tsx`
**Lines**: 57
**Type**: Client Component

#### Implementation Details

**CSS Variable Injection**:
```typescript
useEffect(() => {
  if (!isMounted) return;
  const root = document.documentElement;
  root.style.setProperty('--background', theme.ui.background);
  root.style.setProperty('--foreground', theme.ui.foreground);
  root.style.setProperty('--border', theme.ui.border);
  root.style.setProperty('--accent', theme.ui.accent);
  root.style.setProperty('--editor-bg', theme.editor.background);
  root.style.setProperty('--preview-bg', theme.preview.background);
  root.style.transition = 'background-color 150ms ease, color 150ms ease';
}, [theme, isMounted]);
```

**Monaco Theme Synchronization**:
```typescript
useEffect(() => {
  if (!isMounted || !monaco) return;
  monaco.editor.defineTheme('custom-theme', {
    base: theme.ui.background === '#ffffff' ? 'vs' : 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': theme.editor.background,
      'editor.foreground': theme.editor.foreground,
    },
  });
  monaco.editor.setTheme('custom-theme');
}, [theme, monaco, isMounted]);
```

#### Key Features
- Hydration-safe mounting
- Smooth transitions (150ms)
- Automatic Monaco theme switching
- CSS custom properties for Tailwind integration

---

## Data Flow

### Content Update Flow

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

### File Operation Flow

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

## State Management

### Zustand Store Architecture

**File**: `app/store.ts`
**Lines**: 430

#### Store Structure

```typescript
interface MarkdownStore {
  // Content State
  markdown: string;
  setMarkdown: (markdown: string) => void;

  // Navigation State
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

#### Theme Configuration Interface

```typescript
interface ThemeConfig {
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

#### Persistence Configuration

```typescript
export const useMarkdownStore = create<MarkdownStore>()(
  persist(
    (set) => ({ /* store implementation */ }),
    {
      name: 'markdown-converter-storage',
      // Persists: markdown, active IDs, theme
      // Does NOT persist: transient UI state
    }
  )
);
```

#### Available Themes (17 Total)

**Dark Themes** (12):
- dark, dracula, github-dark, nord, one-dark-pro, tokyo-night
- solarized-dark, monokai-pro, gruvbox-dark, obsidian, forest, ocean

**Light Themes** (5):
- light, github-light, solarized-light, notion, sepia

---

## Storage System

### Database Schema

**File**: `app/services/Database.ts`
**Lines**: 38

#### Schema Definition

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
  isOpen?: boolean;         // UI state (optional)
}

export class MarkdownDB extends Dexie {
  projects!: Table<Project, number>;
  nodes!: Table<FileNode, number>;
  documents!: Table<any, number>; // Legacy support

  constructor() {
    super('MarkdownConverterDB');
    this.version(2).stores({
      projects: '++id, name, updatedAt',
      nodes: '++id, projectId, parentId, type, name, updatedAt',
      documents: '++id, name, updatedAt'
    });
  }
}
```

#### Index Strategy

| Table | Primary Key | Secondary Indexes |
|-------|-------------|-------------------|
| projects | ++id (auto) | name, updatedAt |
| nodes | ++id (auto) | projectId, parentId, type, name, updatedAt |
| documents | ++id (auto) | name, updatedAt |

#### Query Patterns

**Get projects**:
```typescript
const projects = await db.projects.toArray();
```

**Get root-level nodes**:
```typescript
const nodes = await db.nodes
  .where({ projectId, parentId: null })
  .toArray();
```

**Get recent files**:
```typescript
const recents = await db.nodes
  .where('type').equals('file')
  .reverse()
  .sortBy('updatedAt');
```

**Update file**:
```typescript
await db.nodes.update(id, {
  content: newContent,
  updatedAt: new Date()
});
```

---

## Markdown Processing Pipeline

### Processing Flow

```
Raw Markdown
     │
     ▼
┌─────────────────┐
│  remark-parse   │  Parse to AST
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  remark-rehype  │  Convert to HTML AST
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  rehype-sanitize│  XSS protection
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  rehype-highlight│ Syntax highlighting
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  rehype-stringify│ Generate HTML
└────────┬────────┘
         │
         ▼
   Safe HTML Output
```

### Implementation

**File**: `app/services/MarkdownParser.ts`
**Lines**: 30

```typescript
export class MarkdownParser {
  private processor = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeSanitize, {
      attributes: {
        '*': ['className', 'class'],
        'code': ['className', 'class'],
        'span': ['className', 'class'],
      }
    })
    .use(rehypeHighlight)
    .use(rehypeStringify);

  async parse(markdown: string): Promise<string> {
    const file = await this.processor.process(markdown);
    return String(file);
  }
}
```

### Security Configuration

**Allowed Attributes**:
- `className` and `class` on all elements
- Additional classes for `code` and `span` elements

**Sanitization Strategy**:
- Removes dangerous HTML (scripts, event handlers)
- Preserves markdown-generated classes for styling
- Allows safe HTML from markdown (links, images, tables)

---

## Export System Architecture

### System Overview

The export system uses a modular architecture with format-specific exporters implementing a common interface.

### Architecture Diagram

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

### Exporter Interface

**File**: `src/export/types.ts`
**Lines**: 113

```typescript
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
```

### Export Input Structure

```typescript
export interface ExportInput {
  markdown: string;           // Raw markdown source
  ast?: any;                  // Parsed AST (optional)
  theme: ThemeTokens;         // Active theme
  options: ExportOptions;     // User-selected options
  metadata: DocumentMetadata; // Title, author, date
}

export interface ExportOptions {
  includeTheme: boolean;
  includeTableOfContents: boolean;
  pageSize: 'A4' | 'Letter' | 'A3';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  fontSize: number;
  headerFooter: boolean;
  embedImages: boolean;
  syntaxHighlight: boolean;
}
```

### Exporter Implementations

#### 1. Markdown Exporter

**File**: `src/export/exporters/markdown-exporter.ts`
**Status**: Complete

```typescript
export class MarkdownExporter implements IExporter {
  format = 'md';
  extension = '.md';
  mimeType = 'text/markdown';
  supportsTheme = false;
  supportsEditing = true;
  supportsImages = false;

  async export({ markdown }: ExportInput): Promise<ExportResult> {
    const start = performance.now();
    const blob = new Blob([markdown], { type: this.mimeType });
    return {
      blob,
      filename: 'document.md',
      mimeType: this.mimeType,
      size: blob.size,
      duration: performance.now() - start
    };
  }
}
```

#### 2. HTML Exporter

**File**: `src/export/exporters/html-exporter.ts`
**Status**: Complete

Features:
- Full HTML document generation
- Theme CSS embedding
- Sanitized HTML content
- Responsive meta tags

#### 3. PDF Exporter

**File**: `src/export/exporters/pdf-exporter.ts`
**Status**: Complete
**Lines**: ~800

**WinAnsi / glyph-safety support** (`pdf-exporter.ts:740`):

```typescript
private toWinAnsiSafeText(text: string, font: PDFFont, fontSize: number): string {
    const normalized = (text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    let safe = '';

    for (const ch of normalized) {
        // Keep visual flow stable: force hard line breaks to become spaces for inline runs.
        const source = ch === '\n' ? ' ' : ch;
        const cached = this.fontCharCache.get(source);
        if (cached !== undefined) {
            safe += cached;
            continue;
        }

        try {
            font.widthOfTextAtSize(source, fontSize);
            this.fontCharCache.set(source, source);
            safe += source;
        } catch {
            this.fontCharCache.set(source, '?');
            safe += '?';
        }
    }

    return safe;
}
```

Rather than a fixed regex table, each character is probed with `font.widthOfTextAtSize`; anything
the selected font cannot render is replaced with `?`, and results are memoised per character.
(The `sanitizeForWinAnsi` regex helper documented here previously no longer exists in the source.)

**Multi-page Support**:
- Automatic page breaks when content exceeds margins
- Text wrapping for long lines
- Standard Helvetica font

**Image Support** (added after this section was first written):
- `![alt](url)` is parsed into an `image` line type
- PNG and JPG are embedded, capped at 10 MB per image (`MAX_IMAGE_BYTES`)
- CORS failures and unsupported formats are skipped gracefully rather than aborting the export

#### 4. DOCX Exporter

**File**: `src/export/exporters/docx-exporter.ts`
**Status**: Complete
**Lines**: ~507

Markdown is parsed into typed lines and converted to real Word structures — `HeadingLevel`
headings, bullet/ordered lists, blockquotes, tables (`Table`/`TableRow`/`TableCell`) and inline
runs with bold/italic/code styling. The earlier "exports raw markdown text only" limitation no
longer applies.

**Remaining gap**: images are not yet embedded in DOCX output.

#### 5. Plaintext Exporter

**File**: `src/export/exporters/plaintext-exporter.ts`
**Status**: Complete

Converts markdown to plain text by stripping formatting.

#### 6. PPTX Exporter

**File**: `src/export/exporters/pptx-exporter.ts`
**Status**: Complete
**Lines**: ~325

Generates a real deck with `pptxgenjs` (dynamic import): a title slide, then one content slide per
markdown section, with text sizing and overflow handling. The earlier "returns a placeholder text
file" note no longer applies.

### Export UI Components

#### ExportMenu

**File**: `src/export/components/ExportMenu.tsx`
**Lines**: 39

- Dropdown menu with 6 format options
- Icons from Lucide React
- Radix UI DropdownMenu primitive

#### ExportOptionsDialog

**File**: `src/export/components/ExportOptionsDialog.tsx`
**Lines**: 115

Options UI:
- Include theme toggle
- Table of contents toggle
- Page size selector (A4, Letter, A3)
- Orientation selector (portrait, landscape)

#### ExportProgressBar

**File**: `src/export/components/ExportProgressBar.tsx`
**Lines**: 44

- Spinner overlay during export
- Cancel button support
- Z-index 50 for overlay

---

## Theming System

### CSS Variable Architecture

Root-level CSS custom properties defined by ThemeProvider:

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

### Tailwind Integration

**File**: `app/globals.css`

```css
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

### Monaco Editor Theming

Theme detection based on background color:
```typescript
const isLight = theme.ui.background === '#ffffff';
monaco.editor.defineTheme('custom-theme', {
  base: isLight ? 'vs' : 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': theme.editor.background,
    'editor.foreground': theme.editor.foreground,
  },
});
```

---

## Performance Optimizations

### 1. Debounced Parsing

**Location**: Preview component
**Delay**: 150ms

Prevents excessive markdown parsing during rapid typing:
```typescript
const debouncedParse = useRef(
  debounce(async (md: string) => {
    const html = await markdownParser.parse(md);
    setRenderedHtml(html);
  }, 150)
);
```

### 2. Dynamic Imports

Heavy libraries loaded only when needed:
```typescript
// PDF Export
const { PDFDocument, StandardFonts } = await import('pdf-lib');

// DOCX Export
const { Document, Packer } = await import('docx');

// File saving
const { saveAs } = await import('file-saver');
```

### 3. Client-side Hydration Guards

Prevents SSR/hydration mismatches:
```typescript
const [isClient, setIsClient] = useState(false);
useEffect(() => { setIsClient(true); }, []);

if (!isClient) return <LoadingState />;
```

### 4. Reactive Queries

Efficient database subscriptions:
```typescript
const projects = useLiveQuery(() => db.projects.toArray());
// Only re-renders when data changes
```

### 5. Memoization Opportunities

Components that could benefit from React.memo:
- Preview (if theme doesn't change often)
- Sidebar nodes (if structure is stable)
- Export dialog (if options rarely change)

---

## Security Measures

### 1. XSS Protection

**Markdown Processing**:
```typescript
.use(rehypeSanitize, {
  attributes: {
    '*': ['className', 'class'],
    'code': ['className', 'class'],
    'span': ['className', 'class'],
  }
})
```

**HTML Export**:
```typescript
const safeHtml = await sanitizeHTML(rawHtml);
```

### 2. Client-side Only

- No server-side rendering of user content
- No API calls or external data transmission
- All processing in browser sandbox

### 3. File Import Validation

```typescript
const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file && (file.type === 'text/plain' || file.name.endsWith('.md'))) {
    // Process file
  } else {
    alert('Please select a valid markdown or text file.');
  }
};
```

### 4. Content Security Policy Ready

- No inline event handlers
- No `eval()` or dynamic code execution
- All dependencies from trusted sources (npm)

---

## PWA Implementation

### Configuration

**File**: `next.config.ts` (Serwist — `next-pwa@5` was removed: incompatible with Next 16)

```typescript
import withSerwist from "@serwist/next";

const withSW = withSerwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSW(nextConfig);
```

Registration: `app/components/SwRegister.tsx` registers `/sw.js` on mount in production.
The generated `public/sw.js` is git-ignored; stale `next-pwa`/`workbox-*` artefacts were deleted.

### Manifest Configuration

**File**: `app/layout.tsx`

```typescript
export const metadata: Metadata = {
  title: "Markdown Converter",
  description: "A powerful markdown editor and converter with offline support",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MD Editor",
  },
  viewport: {
    width: "device-width",
    initialScale: 1
  },
  icons: {
    icon: "/favicon.ico",
  }
};
```

### Service Worker

Generated by Serwist (`@serwist/next`, `app/sw.ts`):
- Precaches the app shell + runtime-caches static assets (`defaultCache`)
- `skipWaiting` + `clientsClaim` + navigation preload
- Registered once on mount by `SwRegister` (production only)

### Offline Capabilities

- All code bundled and cached
- IndexedDB persists data offline
- No external dependencies required after initial load

---

## Known Issues & Limitations

### Current Issues

Re-verified against the source on 2026-10-04 (`npx tsc --noEmit` passes with **zero** errors).

1. **TypeScript Errors** — ~~listed previously~~: all four reported errors (`plaintext-exporter.ts`
   being empty, the PDF `Uint8Array` mismatch, the ExportMenu JSX namespace issue, and the
   `next.config.ts` `withPWA` type mismatch) are gone. The type check is clean.

2. **Export Limitations** — the three listed items are all fixed:
   - ~~PPTX export is placeholder only~~ — real `pptxgenjs` generation
   - ~~DOCX export lacks markdown formatting~~ — headings/lists/blockquotes/tables/inline runs
   - ~~PDF export is text-only (no images)~~ — PNG/JPG embedding with a 10 MB per-image cap
   - Still true: DOCX does not embed images

3. **Dead code** — removed 2026-10-09 (was: `app/services/ExportService.ts` old html2pdf.js path,
   `app/services/ThemeAdapter.ts` stale 4-preset adapter, `public/sw.js` + `public/workbox-*`
   stale artefacts, `types/next-pwa.d.ts`). Live paths: `ExportOrchestrator` + pdf-lib,
   `ThemeProvider.tsx`, Serwist-generated `public/sw.js` (git-ignored). `html2pdf.js` is no longer
   reachable — follow-up: uninstall the dependency.

4. **Theming**: resolved — `ThemeProvider.tsx` computes WCAG relative luminance and calls
   `monaco.editor.setTheme('custom-theme')`; `Editor.tsx` now passes `theme="custom-theme"`;
   the crude `ThemeAdapter.getMonacoTheme()` is deleted with its file.

5. **UI/UX**:
   - ~~No mobile-optimized layout~~ — an overlay sidebar with a header toggle exists; toolbar and
     touch-gesture polish is still missing
   - Keyboard shortcuts now cover `Ctrl/Cmd+S` save, `Ctrl/Cmd+E` export, `Ctrl/Cmd+Shift+N` new
     file (requires an active project) and `Ctrl/Cmd+Alt+N` or `Ctrl/Cmd+Shift+P` new project
     (`Header.tsx:231-268`)

### Performance Considerations

1. **Large Files**:
   - No virtualized rendering for large documents
   - Monaco Editor may lag with >10k lines
   - PDF export builds entire document in memory

2. **Memory Usage**:
   - Monaco Editor keeps full document in memory
   - Preview renders entire HTML at once
   - No document pagination

### Future Enhancements

Items below were re-checked against the source on 2026-10-04.

1. **Export System**:
   - ~~Complete PPTX implementation~~ — done (`pptx-exporter.ts`, 325 lines, `pptxgenjs`)
   - ~~Rich DOCX formatting~~ — done (headings, lists, blockquotes, tables, inline runs)
   - ~~Image embedding in PDF~~ — done (PNG/JPG, 10 MB cap)
   - ~~Bulk export for projects~~ — done (`app/utils/zip-project.ts` → sidebar)
   - Remaining: image embedding in DOCX; EPUB / ODF / LaTeX

2. **Editor**:
   - Vim/Emacs keybindings
   - Edit-only and preview-only view modes — today `ResizableLayout.tsx` is always a split with
     `defaultSize={50} minSize={20}` panels and no toggle
   - Word count (Monaco's built-in find/replace is available, so that item is effectively done)

3. **Performance**:
   - Virtualized lists for large projects
   - Lazy loading for preview
   - ~~Lazy loading for export~~ — already done: `export-service.ts:21-34` dynamic-imports each exporter
   - Web Workers for export

4. **Mobile**:
   - ~~Responsive sidebar~~ — done (`Sidebar.tsx` overlay + `toggle-sidebar` event, `Header.tsx:58`)
   - Touch gestures
   - Mobile-optimized toolbar

---

## Deployment

### Production Build

```bash
npm run build
```

### Static Export

For static hosting (loses PWA features):
```bash
next export
```

### Server Requirements

- **None**: Client-side only application
- Can be deployed to any static hosting (Vercel, Netlify, GitHub Pages)
- CDN recommended for asset delivery

### Environment Variables

None required. All configuration is:
- Build-time: next.config.ts
- Runtime: User preferences in localStorage/IndexedDB

---

## Debugging

### Browser DevTools

1. **Application Tab**:
   - IndexedDB: Inspect stored projects and files
   - Local Storage: View persisted store state
   - Service Workers: Check PWA status

2. **Console**:
   - Export errors logged here
   - Monaco initialization messages
   - Mermaid rendering debug info

3. **Network**:
   - Dynamic imports visible
   - Monaco loader requests
   - Service worker caching

### Common Debug Scenarios

**Editor not loading**:
- Check Monaco webpack configuration
- Verify client-side hydration

**Export failing**:
- Check console for import errors
- Verify file-saver permissions

**Theme not applying**:
- Inspect CSS variables in DevTools
- Check Monaco theme definition

**Database errors**:
- Clear IndexedDB and reload
- Check schema version compatibility

---

## Conclusion

The Markdown Editor & Converter is a well-architected, production-ready application with:
- Solid component architecture with clear separation of concerns
- Efficient state management with Zustand
- Robust storage system with Dexie.js
- Modular export system ready for extension
- Comprehensive theming system
- Strong security posture with XSS protection

The codebase is ready for production use and welcomes contributions, particularly in completing the PPTX export and enhancing mobile responsiveness.
