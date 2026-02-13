# Markdown Editor & Converter

A powerful, fully offline markdown editor with live preview, project management, and multi-format export capabilities. Built with Next.js and React.

## Core Identity

**A privacy-first, offline-capable markdown editor with professional export features.**

---

## Key Features

### Privacy & Offline
- 100% client-side storage using IndexedDB (via Dexie.js)
- Zero server dependencies - all data stays on your device
- Works completely offline as a Progressive Web App (PWA)
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
- **File management** - Create, rename, delete, and move files and folders
- **Recent files** - Quick access to recently edited documents

### Theming System
- **17 Built-in Themes**: Dark, Light, Dracula, GitHub Light/Dark, Nord, One Dark Pro, Tokyo Night, Solarized Light/Dark, Monokai Pro, Gruvbox Dark, Notion, Obsidian, Sepia, Forest, Ocean
- Customizable editor fonts and sizes
- Theme-aware preview rendering
- CSS variable-based theming

### Export Options
| Format | Status | Notes |
|--------|--------|-------|
| **Markdown (.md)** | Ready | Raw markdown export |
| **HTML (.html)** | Ready | Self-contained with theme CSS |
| **Plain Text (.txt)** | Ready | Stripped markdown formatting |
| **PDF (.pdf)** | Ready | Multi-page with WinAnsi encoding support |
| **Word (.docx)** | Ready | Basic formatting (raw text) |
| **PowerPoint (.pptx)** | Ready | Placeholder implementation |

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
  - docx.js (Word documents)
  - file-saver (Downloads)
- **UI Components**: Radix UI primitives (Dialog, Dropdown Menu, Tabs, Tooltip)
- **Icons**: Lucide React
- **PWA**: next-pwa for offline capabilities

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
5. **Works Offline** - PWA support for any environment
6. **Open Source** - Community-driven development

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## Documentation

- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - Comprehensive developer documentation
- [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md) - Technical architecture details
- [QUICK_START.md](./QUICK_START.md) - Rapid setup guide
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

Built with modern web technologies for developers who value privacy and performance.
