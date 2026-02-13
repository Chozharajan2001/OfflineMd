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
│   │   ├── Editor.tsx       # Monaco Editor
│   │   ├── Preview.tsx      # Markdown preview
│   │   ├── Header.tsx       # Toolbar
│   │   ├── Sidebar.tsx      # File explorer
│   │   └── ...
│   ├── services/            # Business logic
│   │   ├── Database.ts      # IndexedDB schema
│   │   └── MarkdownParser.ts
│   ├── store.ts             # Zustand state
│   └── ...
├── src/
│   └── export/              # Export system
│       ├── exporters/       # Format exporters
│       └── components/      # Export UI
└── ...
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
