# Quick Start Guide

Get up and running with the Markdown Editor & Converter in minutes.

---

## Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- npm (comes with Node.js), or yarn/pnpm/bun

---

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd markdown-converter

# Install dependencies
npm install

# Start development server
npm run dev
```

**Open [http://localhost:3000](http://localhost:3000)** in your browser.

---

## Project Structure

```
markdown-converter/
├── app/
│   ├── components/           # UI components
│   │   ├── Editor.tsx        # Monaco Editor (+ autosave, status bar)
│   │   ├── Preview.tsx       # Markdown preview (Mermaid, KaTeX, sanitize)
│   │   ├── Header.tsx        # Toolbar
│   │   ├── Sidebar.tsx       # Projects, tree, search, trash
│   │   ├── CommandPalette.tsx# Ctrl+K palette
│   │   ├── HistoryDialog.tsx # Version history + diff
│   │   ├── TableOfContents.tsx
│   │   ├── PwaInstall.tsx    # Install button + offline badge
│   │   ├── SwRegister.tsx    # Service worker registration
│   │   ├── ResizableLayout.tsx, ThemeProvider.tsx
│   │   ├── ui/               # Shared Button / IconButton
│   │   ├── dialogs/, notifications/
│   ├── services/             # Business logic
│   │   ├── Database.ts       # IndexedDB schema (v5)
│   │   └── MarkdownParser.ts # Unified.js pipeline
│   ├── utils/                # backup, history, zip-project
│   ├── store.ts              # Zustand state
│   ├── sw.ts                 # Serwist worker source
│   └── layout.tsx, page.tsx, globals.css, robots.ts, sitemap.ts
├── src/export/               # Export system
│   ├── exporters/            # md, txt, html, pdf, docx, pptx, png, epub
│   └── components/           # ExportMenu, options dialog, progress bar
├── e2e/                      # Playwright smoke test
└── docs/                     # Documentation
```

## Quality Commands

```bash
npx tsc --noEmit   # type check (must be clean)
npx eslint .       # lint (0 errors / 0 warnings)
npm test           # unit tests
npm run test:e2e   # browser smoke test
```

---

## Key Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js** | Framework | 16.1.4 |
| **React** | UI Library | 19.2.3 |
| **TypeScript** | Language | 5.x |
| **Tailwind CSS** | Styling | 4.x |
| **Monaco Editor** | Code Editor | Latest |
| **Zustand** | State Management | 5.x |
| **Dexie.js** | IndexedDB Wrapper | 4.x |
| **Unified.js** | Markdown Processing | Latest |

---

## Common Tasks

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Run Linter

```bash
npm run lint
```

### Run Tests

```bash
npm test         # unit tests (Vitest)
npm run test:e2e # browser smoke test (needs a running server)
```

---

## Working with the PWA

The service worker is **production-only**, so "installed app works offline" must be verified
against a production build or a deployed URL — never against `npm run dev` (where no worker
exists and the installed icon is just a shortcut to `localhost:3000`).

```bash
npm run build && npm run start
# open http://localhost:3000, install, then DevTools → Network: Offline → reload
```

Known gap: **Monaco Editor loads from CDN**, so the editor pane still needs network.

---

## Development Workflows

### Adding a Component

1. Create file in `app/components/`
2. Use 'use client' directive
3. Import from store/services as needed
4. Add to parent component

Example:
```typescript
'use client';

import { useMarkdownStore } from '../store';

export function MyComponent() {
  const { markdown } = useMarkdownStore();
  return <div>{markdown}</div>;
}
```

### Adding a Service

1. Create file in `app/services/`
2. Export functions or class
3. Import in components

Example:
```typescript
export class MyService {
  static async doSomething() {
    // Implementation
  }
}
```

### Modifying the Database

1. Update interfaces in `app/services/Database.ts`
2. Increment version number
3. Add migration logic if needed

```typescript
this.version(3).stores({
  // Updated schema
}).upgrade(tx => {
  // Migration logic
});
```

### Adding an Export Format

1. Create exporter in `src/export/exporters/`
2. Implement `IExporter` interface
3. Register in `ExportOrchestrator`
4. Add to `ExportMenu`

See existing exporters for examples.

### Adding a Theme

1. Open `app/store.ts`
2. Add theme to `themes` object:

```typescript
'my-theme': {
  name: 'My Theme',
  ui: { background: '#...', foreground: '#...', border: '#...', accent: '#...' },
  editor: { background: '#...', foreground: '#...', fontSize: 14, fontFamily: "'Fira Code', monospace" },
  preview: { background: '#...', foreground: '#...', fontFamily: "Inter, sans-serif", fontSize: 16 }
}
```

---

## Important Notes

### Client-Side Only

- All data stored in browser's IndexedDB
- No server-side API calls
- Components need 'use client' for browser APIs

### Monaco Editor

- Loaded dynamically to avoid SSR issues
- May take a moment to initialize
- Theme syncs with application theme

### Export System

- PDF: Uses pdf-lib (client-side generation)
- DOCX: Uses docx.js
- Dynamic imports for performance

### Storage

- Projects and files in IndexedDB
- Store state in localStorage
- Clear browser data = lose all content

---

## Debugging Tips

### Editor Not Loading
- Check console for Monaco errors
- Verify client-side hydration

### Preview Not Updating
- Check markdown parser errors
- Verify debounced parse is firing

### Export Failing
- Check console for import errors
- Verify file-saver is working

### Database Issues
- Clear IndexedDB in DevTools → Application → IndexedDB
- Check schema version compatibility

---

## Next Steps

1. Read [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines
2. Check [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for architecture
3. Review [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md) for implementation details

---

Happy coding!
