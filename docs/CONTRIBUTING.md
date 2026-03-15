# Contributing to Markdown Editor & Converter

Thank you for your interest in contributing! This guide will help you get started with the codebase and contribution process.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Development Setup](#development-setup)
3. [Project Structure](#project-structure)
4. [Architecture Overview](#architecture-overview)
5. [Key Components](#key-components)
6. [State Management](#state-management)
7. [Storage System](#storage-system)
8. [Export System](#export-system)
9. [Theming](#theming)
10. [Development Workflow](#development-workflow)
11. [Code Standards](#code-standards)
12. [Testing Guidelines](#testing-guidelines)
13. [Submitting Changes](#submitting-changes)

---

## Project Overview

The Markdown Editor & Converter is a privacy-first, offline-capable markdown editor built with Next.js. It provides a professional editing experience with Monaco Editor, live preview, and comprehensive export capabilities.

### Core Features

- **Monaco Editor**: VS Code's editor for markdown editing
- **Live Preview**: Real-time rendering with syntax highlighting
- **Project Management**: Hierarchical folders and files
- **17 Themes**: Dark, light, and custom themes
- **Export Formats**: Markdown, HTML, PDF, DOCX, TXT, PPTX
- **Offline Capable**: PWA with IndexedDB storage
- **Privacy First**: No data leaves your device

---

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Git

### Quick Start

```bash
# Clone repository
git clone <repository-url>
cd markdown-converter

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
# http://localhost:3000
```

### Available Scripts

```bash
npm run dev      # Development server with webpack
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint checking
```

---

## Project Structure

```
markdown-converter/
├── app/                          # Next.js App Router
│   ├── components/               # React components
│   │   ├── Editor.tsx           # Monaco Editor wrapper
│   │   ├── Preview.tsx          # Markdown preview
│   │   ├── Header.tsx           # Toolbar with export
│   │   ├── Sidebar.tsx          # File navigation
│   │   ├── ResizableLayout.tsx  # Split-pane layout
│   │   └── ThemeProvider.tsx    # Theme synchronization
│   ├── services/                # Business logic
│   │   ├── Database.ts          # Dexie.js schema
│   │   ├── MarkdownParser.ts    # Unified.js processor
│   │   └── ExportService.ts     # Legacy export (deprecated)
│   ├── store.ts                 # Zustand state management
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Main page
│   └── globals.css              # Global styles
├── src/                          # Additional source
│   └── export/                  # New export system
│       ├── export-service.ts    # Export orchestrator
│       ├── types.ts             # Export types
│       ├── components/          # Export UI
│       ├── exporters/           # Format exporters
│       └── utils/               # Export utilities
├── types/                        # TypeScript declarations
├── public/                       # Static assets
└── Documentation files
```

---

## Architecture Overview

### Three-Layer Architecture

```
┌─────────────────────────────────────────────┐
│              Presentation Layer             │
│  Components → ThemeProvider → User Interface│
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────┴───────────────────────┐
│             Business Logic Layer            │
│  Store (Zustand) → Services → Export System │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────┴───────────────────────┐
│            Infrastructure Layer             │
│  IndexedDB (Dexie) → LocalStorage → Browser │
└─────────────────────────────────────────────┘
```

### Data Flow

```
User Input → Editor → Zustand Store → Preview → Rendered HTML
                ↓
         IndexedDB (Dexie.js)
```

---

## Key Components

### Editor (`app/components/Editor.tsx`)

- Monaco Editor integration
- Markdown language mode
- Theme-responsive font sizing
- SSR-safe client-side rendering

### Preview (`app/components/Preview.tsx`)

- Debounced parsing (150ms)
- Unified.js markdown processing
- Mermaid diagram rendering
- Theme-aware inline CSS

### Sidebar (`app/components/Sidebar.tsx`)

- Project management
- Hierarchical file tree
- CRUD operations
- Recent files list
- Live queries with dexie-react-hooks

### Header (`app/components/Header.tsx`)

- File operations (save, import)
- Export menu (6 formats)
- Theme settings dialog
- Export progress indicator

### ThemeProvider (`app/components/ThemeProvider.tsx`)

- CSS custom property injection
- Monaco theme synchronization
- Hydration-safe mounting

---

## State Management

### Zustand Store (`app/store.ts`)

```typescript
interface MarkdownStore {
  // Content
  markdown: string;
  setMarkdown: (markdown: string) => void;

  // Navigation
  activeProjectId: number | null;
  activeFileId: number | null;
  setActiveProject: (id: number | null) => void;
  setActiveFile: (id: number | null) => void;

  // Theme
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  applyPreset: (presetName: string) => void;
  resetTheme: () => void;
}
```

### Persistence

Uses Zustand's `persist` middleware to save to localStorage:
- Editor content
- Active project/file IDs
- Theme configuration

---

## Storage System

### Database Schema (`app/services/Database.ts`)

**Dexie.js v2** with two main tables:

```typescript
// Projects table
interface Project {
  id?: number;              // Auto-increment
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Files and folders table
interface FileNode {
  id?: number;
  projectId: number;        // Foreign key
  parentId: number | null;  // Null for root level
  type: 'file' | 'folder';
  name: string;
  content?: string;         // Only for files
  createdAt: Date;
  updatedAt: Date;
}
```

### Indexes

- `projects`: `++id, name, updatedAt`
- `nodes`: `++id, projectId, parentId, type, name, updatedAt`

### Operations

```typescript
// Create project
const id = await db.projects.add({
  name: 'My Project',
  createdAt: new Date(),
  updatedAt: new Date()
});

// Create file
await db.nodes.add({
  projectId,
  parentId: null, // Root level
  type: 'file',
  name: 'document.md',
  content: '# Hello',
  createdAt: new Date(),
  updatedAt: new Date()
});

// Query files in folder
const files = await db.nodes
  .where({ projectId, parentId: folderId })
  .toArray();
```

---

## Export System

### Architecture (`src/export/`)

```
src/export/
├── export-service.ts          # Orchestrator
├── types.ts                   # Type definitions
├── components/
│   ├── ExportMenu.tsx        # Format dropdown
│   ├── ExportOptionsDialog.tsx
│   └── ExportProgressBar.tsx
├── exporters/
│   ├── markdown-exporter.ts  # Complete
│   ├── html-exporter.ts      # Complete
│   ├── pdf-exporter.ts       # Complete
│   ├── docx-exporter.ts      # Complete
│   ├── plaintext-exporter.ts # Complete
│   └── pptx-exporter.ts      # Placeholder
└── utils/
    ├── file-saver.ts
    ├── markdown-parser.ts
    ├── sanitizer.ts
    └── theme-to-css.ts
```

### IExporter Interface

```typescript
interface IExporter {
  format: ExportFormat;
  extension: string;
  mimeType: string;
  label: string;
  supportsTheme: boolean;
  supportsEditing: boolean;
  supportsImages: boolean;
  export(content: ExportInput): Promise<ExportResult>;
}
```

### Adding a New Exporter

1. Create file in `src/export/exporters/`
2. Implement `IExporter` interface
3. Add to `ExportOrchestrator.getExporter()`
4. Add to `ExportMenu` component

---

## Theming

### Theme Structure

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

### Available Themes (17)

**Dark**: dark, dracula, github-dark, nord, one-dark-pro, tokyo-night, solarized-dark, monokai-pro, gruvbox-dark, obsidian, forest, ocean

**Light**: light, github-light, solarized-light, notion, sepia

### Adding a Theme

1. Add theme object to `themes` record in `store.ts`
2. Theme automatically available in settings dropdown

---

## Development Workflow

### Making Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow existing code patterns
   - Use TypeScript strictly
   - Maintain component structure

3. **Test your changes**
   ```bash
   npm run lint
   npm run build
   ```

4. **Commit**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Format

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style (formatting)
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance tasks

---

## Code Standards

### TypeScript

- Strict mode enabled
- Explicit return types on functions
- Interface definitions for data structures
- No `any` types without justification

### Components

- Functional components with hooks
- 'use client' directive for client components
- Props interfaces defined
- Destructure props

### Styling

- Tailwind CSS classes
- CSS custom properties for theming
- Responsive design considerations
- Print media queries for exports

### File Organization

```typescript
// Imports order:
1. React imports
2. Third-party libraries
3. Local components
4. Services/stores
5. Types
6. Styles
```

### Naming Conventions

- **Components**: PascalCase (e.g., `Editor.tsx`)
- **Functions**: camelCase (e.g., `handleSave`)
- **Constants**: UPPER_SNAKE_CASE
- **Variables**: camelCase
- **Files**: PascalCase for components, camelCase for utilities

---

## Testing Guidelines

### Manual Testing Checklist

Before submitting changes, verify:

- [ ] Editor loads and accepts input
- [ ] Preview updates with debounce
- [ ] Sidebar shows projects and files
- [ ] File CRUD operations work
- [ ] Theme changes apply correctly
- [ ] All export formats work
- [ ] Responsive layout functions
- [ ] No console errors

### Areas to Test

1. **Editor**: Typing, theme changes, large documents
2. **Preview**: Markdown rendering, Mermaid diagrams, theme switching
3. **Sidebar**: Project creation, file operations, folder nesting
4. **Export**: All 6 formats with various content
5. **Themes**: All 17 themes render correctly

---

## Submitting Changes

### Pull Request Process

1. **Update documentation** if needed
2. **Run linting**: `npm run lint`
3. **Build successfully**: `npm run build`
4. **Test thoroughly** on your local machine
5. **Write clear PR description**:
   - What changed
   - Why it changed
   - How to test it
   - Screenshots if UI changes

### PR Checklist

- [ ] Code follows style guide
- [ ] No TypeScript errors (where possible)
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Commit messages are clear

---

## Areas Needing Contribution

### High Priority

1. **PPTX Export** - Full implementation needed
2. **DOCX Rich Formatting** - Convert markdown AST to formatted DOCX
3. **Mobile UI** - Responsive improvements for tablets/phones

### Medium Priority

1. **Keyboard Shortcuts** - Add common shortcuts (save, export, etc.)
2. **Find/Replace** - Editor search functionality
3. **Word Count** - Character and word statistics
4. **File Import** - Better import with drag-and-drop

### Nice to Have

1. **Vim/Emacs Keybindings** - Alternative editor modes
2. **Split Editor** - Multiple editor panes
3. **Git Integration** - Version control UI
4. **Plugin System** - Extensible architecture

---

## Getting Help

### Resources

- **README.md**: Project overview
- **DEVELOPER_GUIDE.md**: Comprehensive development guide
- **TECHNICAL_DOCS.md**: Deep technical documentation
- **QUICK_START.md**: Rapid setup

### Support

1. Check existing documentation
2. Review closed issues for similar questions
3. Open a new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

---

## Code of Conduct

- Be respectful and constructive
- Welcome newcomers
- Focus on the code, not the person
- Help others learn

---

Thank you for contributing to Markdown Editor & Converter! Your efforts help make this a better tool for everyone.
