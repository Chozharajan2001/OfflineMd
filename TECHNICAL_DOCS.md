# Technical Documentation: Markdown Editor & Viewer

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [State Management](#state-management)
- [Storage System](#storage-system)
- [Markdown Processing](#markdown-processing)
- [Export Functionality](#export-functionality)
- [Theming System](#theming-system)
- [Performance Considerations](#performance-considerations)
- [Security Measures](#security-measures)
- [PWA Implementation](#pwa-implementation)

## Overview

The Markdown Editor & Viewer is a client-side application built with Next.js that provides a complete markdown editing and viewing solution with offline capabilities. The application stores all data locally using IndexedDB and provides multiple export formats.

### Key Features
- Real-time markdown editing with Monaco Editor
- Live preview with syntax highlighting
- Hierarchical project and file management
- Client-side storage with Dexie.js
- Multiple export formats (PDF, DOCX, HTML, MD)
- Customizable theming system
- Progressive Web App capabilities

## Architecture

The application follows a component-based architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Components    │    │    Services     │    │     Store       │
│                 │    │                 │    │                 │
│ • Editor        │◄──►│ • Database      │◄──►│ • Zustand       │
│ • Preview       │    │ • MarkdownParser│    │ • Persistence   │
│ • Header        │    │ • ExportService │    │                 │
│ • Sidebar       │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Browser Environment                         │
│                                                                 │
│ • IndexedDB (Dexie.js)                                          │
│ • Monaco Editor                                               │
│ • Unified.js (remark/rehype)                                  │
│ • html2pdf.js, docx.js, file-saver                           │
│ • Tailwind CSS, Radix UI                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

1. **Components Layer**: UI rendering and user interaction
2. **Services Layer**: Business logic and external integrations
3. **Store Layer**: Global state management and persistence
4. **Browser Environment**: Native APIs and third-party libraries

## Core Components

### Editor Component (`components/Editor.tsx`)

The Editor component provides a rich markdown editing experience using Monaco Editor.

#### Key Features:
- Syntax highlighting for markdown
- Responsive to theme changes
- Automatic layout adjustment
- Integration with global store

#### Props:
- None (uses store for state)

#### State Dependencies:
- `markdown` (from store): Current content
- `theme` (from store): Editor styling

#### Methods:
- `onChange`: Updates store when content changes

#### Integration Points:
- Connects to `useMarkdownStore` for content synchronization
- Responds to theme changes from store

### Preview Component (`components/Preview.tsx`)

The Preview component renders markdown as HTML with syntax highlighting and diagram support.

#### Key Features:
- Debounced parsing for performance
- Syntax highlighting for code blocks
- Mermaid diagram rendering
- Theme-aware styling
- Safe HTML rendering with sanitization

#### Props:
- None (uses store for state)

#### State Dependencies:
- `markdown` (from store): Content to render
- `theme` (from store): Styling configuration

#### Methods:
- `debouncedParse`: Parses markdown with delay to prevent performance issues
- `mermaid.run`: Renders Mermaid diagrams after HTML updates

#### Integration Points:
- Uses `markdownParser` service for content transformation
- Integrates with Mermaid for diagram rendering
- Connects to `useMarkdownStore` for content updates

### Sidebar Component (`components/Sidebar.tsx`)

The Sidebar component manages the file system hierarchy and provides navigation.

#### Key Features:
- Project creation and management
- File/folder hierarchy visualization
- CRUD operations for files and folders
- Recent files display
- File loading and selection

#### Props:
- None (uses store for state)

#### State Dependencies:
- `activeProjectId` (from store): Current project
- `activeFileId` (from store): Current file
- `setMarkdown` (from store): Updates editor content

#### Methods:
- `createProject`: Creates new project
- `createNode`: Creates new file or folder
- `deleteNode`: Removes file or folder
- `loadFile`: Loads file content into editor

#### Integration Points:
- Connects to `db` for database operations
- Uses `useLiveQuery` for reactive data updates
- Connects to `useMarkdownStore` for state management

### Header Component (`components/Header.tsx`)

The Header component provides file operations and settings access.

#### Key Features:
- File operations (save, import, export)
- Settings access
- Theme customization
- Export functionality

#### Props:
- None (uses store for state)

#### State Dependencies:
- `markdown` (from store): Content to save/export
- `theme` (from store): Current theme
- `activeFileId` (from store): Current file ID
- `activeProjectId` (from store): Current project ID

#### Methods:
- `handleSave`: Saves current content
- `handleImport`: Imports file content
- Various export methods via `ExportService`

#### Integration Points:
- Connects to `db` for save operations
- Uses `ExportService` for export functionality
- Connects to `useMarkdownStore` for state management

## Data Flow

### Content Flow
```
User Types → Editor Component → Store → Preview Component → HTML Output
```

### File Operations Flow
```
User Action → Sidebar Component → Database Service → Store Update → UI Refresh
```

### Export Flow
```
User Clicks Export → Header Component → Export Service → File Download
```

### Detailed Flow Diagrams

#### Content Update Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Editor    │───▶│   Store     │───▶│   Preview   │───▶│   Browser   │
│             │    │             │    │             │    │             │
│ Monaco Edit │    │ Markdown    │    │ Markdown    │    │ HTML Render │
│ onChange    │    │ State       │    │ Parse &     │    │ with        │
└─────────────┘    │ Update      │    │ Display     │    │ Highlighting│
                   └─────────────┘    └─────────────┘    └─────────────┘
```

#### File Operation Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Sidebar    │───▶│   Store     │───▶│ Database    │───▶│ IndexedDB   │
│             │    │             │    │             │    │             │
│ User Action │    │ State       │    │ Dexie Ops   │    │ Persistence │
│ (CRUD)      │    │ Updates     │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## State Management

The application uses Zustand for global state management with persistence.

### Store Structure (`store.ts`)

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

### State Persistence

The store uses Zustand's persistence middleware to save state to localStorage:

```typescript
persist(
  (set) => ({ ... }),
  {
    name: 'markdown-converter-storage',
    // Configuration for persistence
  }
)
```

### State Updates

State updates follow a unidirectional flow:
1. User interaction triggers action
2. Action updates store state
3. Components react to state changes
4. UI updates automatically

## Storage System

The application uses Dexie.js (IndexedDB wrapper) for client-side storage.

### Database Schema (`services/Database.ts`)

```typescript
export interface Project {
  id?: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileNode {
  id?: number;
  projectId: number;
  parentId: number | null; // null for root level
  type: 'file' | 'folder';
  name: string;
  content?: string; // Only for files
  createdAt: Date;
  updatedAt: Date;
  isOpen?: boolean; // For folder expansion state (optional storage)
}
```

### Database Versioning

The database is versioned to support schema evolution:

```typescript
this.version(2).stores({
  projects: '++id, name, updatedAt',
  nodes: '++id, projectId, parentId, type, name, updatedAt',
  documents: '++id, name, updatedAt' // Legacy support
});
```

### CRUD Operations

The database provides standard CRUD operations:
- Create: `db.projects.add()` and `db.nodes.add()`
- Read: `db.projects.get()` and `db.nodes.get()`
- Update: `db.projects.update()` and `db.nodes.update()`
- Delete: `db.projects.delete()` and `db.nodes.delete()`

### Reactive Queries

The application uses `useLiveQuery` from `dexie-react-hooks` to create reactive data bindings:

```typescript
const projects = useLiveQuery(() => db.projects.toArray());
const nodes = useLiveQuery(
  () => activeProjectId
    ? db.nodes.where({ projectId: activeProjectId, parentId }).toArray()
    : []
  , [activeProjectId, parentId]
);
```

## Markdown Processing

The application uses the Unified.js ecosystem for markdown processing.

### Processing Pipeline (`services/MarkdownParser.ts`)

```typescript
private processor = unified()
  .use(remarkParse)           // Parse markdown to AST
  .use(remarkRehype)          // Convert AST to HTML AST
  .use(rehypeSanitize)        // Sanitize HTML for security
  .use(rehypeHighlight)       // Add syntax highlighting
  .use(rehypeStringify);      // Convert to HTML string
```

### Security Measures

The processing pipeline includes sanitization to prevent XSS attacks:

```typescript
.use(rehypeSanitize, {
  attributes: {
    '*': ['className', 'class'],
    'code': ['className', 'class'],
    'span': ['className', 'class'],
  }
})
```

### Performance Optimization

The Preview component implements debounced parsing to improve performance:

```typescript
const debouncedParse = useRef(
  debounce(async (md: string) => {
    const html = await markdownParser.parse(md);
    setRenderedHtml(html);
  }, 150)
);
```

## Export Functionality

The application provides export functionality for multiple formats through the `ExportService`.

### Supported Formats

1. **PDF**: Uses html2pdf.js to convert preview HTML
2. **DOCX**: Uses docx.js to create Word documents
3. **HTML**: Exports rendered HTML with styling
4. **Markdown**: Exports raw markdown content

### Export Service (`services/ExportService.ts`)

The service uses dynamic imports to load heavy libraries only when needed:

```typescript
static async exportToPDF(elementId: string, filename: string = 'document') {
  const { default: html2pdf } = await import('html2pdf.js');
  // Export logic
}
```

### File Saving

All export methods use file-saver for client-side file downloads:

```typescript
const { saveAs } = await import('file-saver');
const blob = new Blob([content], { type: 'mime-type' });
saveAs(blob, `${filename}.extension`);
```

## Theming System

The application includes a flexible theming system with predefined themes and customization options.

### Theme Configuration (`store.ts`)

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

### Predefined Themes

The application ships with three predefined themes:

1. **Dark**: Default dark theme
2. **Light**: Default light theme
3. **Dracula**: Popular Dracula theme

### Theme Application

Themes are applied through CSS-in-JS styling in components:

```typescript
<div
  className="preview-content"
  style={{
    backgroundColor: theme.preview.background,
    color: theme.preview.foreground,
    fontFamily: theme.preview.fontFamily,
    fontSize: `${theme.preview.fontSize}px`,
  }}
>
```

## Performance Considerations

### Debounced Parsing

Markdown parsing is debounced to 150ms to prevent performance issues during rapid typing:

```typescript
const debouncedParse = useRef(debounce(async (md: string) => {
  const html = await markdownParser.parse(md);
  setRenderedHtml(html);
}, 150));
```

### Efficient Rendering

The application uses React's reconciliation algorithm and proper component structuring to minimize re-renders.

### Lazy Loading

Heavy libraries are loaded dynamically only when needed:

```typescript
const { default: html2pdf } = await import('html2pdf.js');
```

### Memory Management

The application properly cleans up event listeners and timeouts:

```typescript
useEffect(() => {
  // Setup
  return () => {
    // Cleanup
    clearTimeout(timer);
  };
}, [dependencies]);
```

## Security Measures

### HTML Sanitization

All rendered HTML is sanitized using rehype-sanitize to prevent XSS attacks:

```typescript
.use(rehypeSanitize, {
  attributes: {
    '*': ['className', 'class'],
    'code': ['className', 'class'],
    'span': ['className', 'class'],
  }
})
```

### Client-Side Only

All data processing occurs on the client side, ensuring user data never leaves the device.

### Secure Export

Export functionality operates entirely client-side with no server communication.

## PWA Implementation

The application is configured as a Progressive Web App with offline capabilities.

### Configuration (`next.config.ts`)

```typescript
export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  ...nextConfig,
});
```

### Manifest Configuration

The application includes PWA manifest configuration in `layout.tsx`:

```typescript
export const metadata: Metadata = {
  title: "Markdown Converter",
  description: "A powerful markdown editor and converter with PWA support",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MD Editor",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  },
  icons: {
    icon: "/favicon.ico",
  }
};
```

### Offline Capabilities

The PWA configuration enables offline usage and installation as a standalone application.

## Deployment Considerations

### Production Build

The application can be built for production using:

```bash
npm run build
```

### Static Export

For static hosting, the application can be exported as static files (though this would lose PWA capabilities).

### Server Requirements

The application is client-side only and requires no server-side processing, making it suitable for static hosting platforms.

## Troubleshooting

### Common Issues

1. **Editor not updating**: Check store connection and ensure proper state updates
2. **Preview not rendering**: Verify markdown parser and ensure content is valid
3. **Export not working**: Confirm dynamic imports are functioning and libraries are loaded
4. **Database errors**: Check IndexedDB support and permissions

### Debugging Tips

1. Use browser dev tools to inspect store state
2. Check console for errors during export operations
3. Verify database operations in IndexedDB section of dev tools
4. Monitor network tab for dynamic import requests

## Future Enhancements

### Planned Features

1. Advanced export formatting (better DOCX conversion)
2. Collaboration features (with proper security)
3. Enhanced theming options
4. Plugin system for extended functionality
5. Mobile responsiveness improvements

### Performance Improvements

1. Virtualized file lists for large projects
2. Optimized parsing for large documents
3. Better caching strategies
4. Improved memory management

This documentation provides a comprehensive overview of the Markdown Editor & Viewer application architecture and implementation details.
