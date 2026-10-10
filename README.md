# Markdown Editor & Converter

A powerful, privacy-first markdown editor with live preview, project management, and multi-format
export capabilities. Built with Next.js and React.

> **Offline note (2026-10-10):** Serwist service worker caches the app shell in production
> builds; documents live in IndexedDB. Monaco Editor still loads from CDN (see TODO.md M6).

## Core Identity

**A privacy-first markdown editor with professional export features.**

---

## Key Features

### Privacy & Offline
- 100% client-side storage using IndexedDB (via Dexie.js)
- No backend data service - all data stays on your device
- ✅ App shell cached offline in production (Serwist); Monaco Editor still CDN-loaded
- No account required, no data collection

### Editor Features
- **Monaco Editor** integration - the same editor powering VS Code
- Live markdown preview with split-pane layout
- Syntax highlighting for code blocks (via highlight.js)
- Mermaid diagram support (flowcharts, sequence diagrams, etc.)
- Responsive resizable panels

### Organization System
- **Projects** - Create multiple projects for different contexts
- **Hierarchical folders** - Organize files with nested folder support
- **File management** - Create, rename, move, trash/restore, delete (with undo toasts)
- **Recent files** - Quick access to recently edited documents
- **Favorites, content search, version history, command palette, autosave**

### Theming System
- **17 Built-in Themes**: Dark, Light, Dracula, GitHub Light/Dark, Nord, One Dark Pro, Tokyo Night, Solarized Light/Dark, Monokai Pro, Gruvbox Dark, Notion, Obsidian, Sepia, Forest, Ocean
- Customizable editor fonts and sizes
- Theme-aware preview rendering
- CSS variable-based theming

### Export Options
| Format | Status | Notes |
|--------|--------|-------|
| **Markdown (.md)** | Ready | Raw markdown export |
| **HTML (.html)** | Ready | Self-contained with theme CSS, optional TOC |
| **Plain Text (.txt)** | Ready | Stripped markdown formatting |
| **PDF (.pdf)** | Ready | pdf-lib: multi-page, WinAnsi encoding, embedded PNG/JPG images, configurable layout |
| **Word (.docx)** | Ready | Headings, lists, blockquotes, tables and inline formatting (not raw text) |
| **PowerPoint (.pptx)** | Ready | `pptxgenjs`, one slide per section with title and body text |
| **PNG (.png)** | Ready | Themed 2x image snapshot |
| **EPUB (.epub)** | Ready | Minimal EPUB 3 e-book |
| **Project archive (.zip)** | Ready | Whole project tree as folder structure, from the sidebar |

---

## Tech Stack

- **Framework**: Next.js 16.1.4 with React 19.2.3
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with custom theme variables
- **Editor**: Monaco Editor (@monaco-editor/react)
- **State Management**: Zustand 5 with persistence middleware
- **Storage**: Dexie.js (IndexedDB wrapper)
- **Markdown Processing**: Unified.js ecosystem (remark-parse, remark-rehype, rehype-highlight, rehype-sanitize)
- **Diagrams**: Mermaid 11.12.2
- **Export Libraries**: 
  - pdf-lib (PDF generation)
  - docx (Word documents)
  - pptxgenjs (PowerPoint decks)
  - jszip (project ZIP export)
  - file-saver (Downloads)
- **UI Components**: Radix UI primitives (Dialog, Dropdown Menu, Tabs, Tooltip)
- **Icons**: Lucide React
- **PWA**: `@serwist/next` service worker + install button + offline badge + manifest shortcuts

---

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd markdown-converter

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Available Scripts

```bash
npm run dev      # Start development server with webpack
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Project Structure

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
│   │   ├── Database.ts          # Dexie.js IndexedDB schema (v5: projects/nodes/revisions)
│   │   └── MarkdownParser.ts    # Unified.js processor (GFM, math, sanitize, highlight)
│   ├── store.ts                 # Zustand state management + 17 theme presets
│   ├── layout.tsx               # Root layout; links the web-app manifest (no service worker)
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
└── Documentation files (README, CONTRIBUTING, etc.)
```

---

## Architecture

### Data Flow
```
User Input → Editor Component → Zustand Store → Preview Component → Rendered HTML
                  ↓
            IndexedDB (Dexie.js)
```

### State Management
- **Global State**: Zustand store with localStorage persistence
- **Database**: Dexie.js for file/project storage in IndexedDB
- **Reactive Queries**: dexie-react-hooks for live UI updates

### Security
- All HTML sanitized via `rehype-sanitize`
- XSS protection on rendered content
- No external data transmission

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

**Note**: Requires IndexedDB support for file storage.

---

## Unique Selling Points

1. **True Privacy** - Your documents never leave your device
2. **Zero Cost** - Completely free, no subscriptions
3. **Professional Editor** - Monaco Editor with IDE-like experience
4. **Flexible Export** - Multiple formats for sharing
5. **Local-First Data** - Notes live in IndexedDB (offline app-shell support still TODO)
6. **Open Source** - Community-driven development

---

## Contributing

We welcome contributions! Please see [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) for guidelines.

---

## Documentation

- [docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md) - Comprehensive developer documentation
- [docs/TECHNICAL_DOCS.md](./docs/TECHNICAL_DOCS.md) - Technical architecture details
- [docs/QUICK_START.md](./docs/QUICK_START.md) - Rapid setup guide
- [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) - Contribution guidelines

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

Built with modern web technologies for developers who value privacy and performance.
