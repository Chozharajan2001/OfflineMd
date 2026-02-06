# Contributing to Markdown Editor & Viewer

Thank you for your interest in contributing to the Markdown Editor & Viewer project! This document provides guidelines and information to help you get started.

## Table of Contents
- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Structure](#code-structure)
- [Component Overview](#component-overview)
- [State Management](#state-management)
- [Data Storage](#data-storage)
- [Export Functionality](#export-functionality)
- [Theming System](#theming-system)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Style Guide](#style-guide)

## Project Overview

Markdown Editor & Viewer is a fully offline, free markdown-based notes and documentation system built with Next.js. The application features live markdown editing with preview, client-side storage, and multiple export options.

### Key Features
- ✅ 100% client-side storage (IndexedDB/LocalStorage)
- ✅ No server dependency
- ✅ All data stays on user's device
- ✅ Works completely offline
- ✅ Live markdown editor with preview
- ✅ Syntax highlighting
- ✅ Support for tables, code blocks, lists, etc.
- ✅ Toggle between edit/preview/split view
- ✅ Hierarchical organization with projects/folders
- ✅ File/folder management (create, rename, delete, move)
- ✅ Multiple export formats (MD, HTML, PDF, DOCX, TXT)

## Tech Stack

- **Framework**: Next.js 16.1.4 (React 19.2.3)
- **UI Components**: Radix UI Primitives
- **Editor**: Monaco Editor (via @monaco-editor/react)
- **Markdown Processing**: Unified.js ecosystem (remark/rehype)
- **State Management**: Zustand with persistence
- **Client-Side Storage**: Dexie.js (IndexedDB wrapper)
- **Styling**: Tailwind CSS with custom themes
- **Icons**: Lucide React
- **Export Libraries**:
  - PDF: html2pdf.js
  - DOCX: docx.js
  - File saving: file-saver
- **Syntax Highlighting**: highlight.js
- **Diagram Support**: Mermaid
- **Build Tool**: TypeScript 5+

## Architecture

The application follows a component-based architecture with clear separation of concerns:

```
app/
├── components/         # UI components
│   ├── Editor.tsx      # Monaco editor component
│   ├── Preview.tsx     # Markdown preview component
│   ├── Header.tsx      # Application header with export/import
│   ├── Sidebar.tsx     # File explorer and project management
│   ├── ResizableLayout.tsx # Split view layout
│   └── ThemeProvider.tsx # Theme context provider
├── services/           # Business logic and utilities
│   ├── Database.ts     # Dexie DB schema and operations
│   ├── MarkdownParser.ts # Markdown to HTML conversion
│   └── ExportService.ts # Export functionality
├── store.ts            # Global state management (Zustand)
├── layout.tsx          # Root layout
├── page.tsx            # Main application page
├── globals.css         # Global styles
└── favicon.ico
```

## Getting Started

### Prerequisites
- Node.js 18+ (recommended)
- npm, yarn, pnpm, or bun

### Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd markdown-converter
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development Workflow

### Available Scripts

- `npm run dev` - Start development server with webpack integration
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint for code quality checks

### Environment

The application is configured as a Progressive Web App (PWA) with offline capabilities. The PWA functionality is disabled in development mode but enabled in production builds.

## Code Structure

### Components

#### Editor Component (`components/Editor.tsx`)
- Uses Monaco Editor for rich markdown editing
- Supports syntax highlighting for markdown
- Responsive to theme changes
- Integrates with global store for content synchronization

#### Preview Component (`components/Preview.tsx`)
- Renders markdown content as HTML
- Implements debounced parsing for performance
- Supports syntax highlighting for code blocks
- Includes Mermaid diagram rendering
- Responsive to theme changes

#### Header Component (`components/Header.tsx`)
- Contains file operations (save, import, export)
- Provides access to settings and theming
- Integrates with database for file operations
- Offers multiple export formats

#### Sidebar Component (`components/Sidebar.tsx`)
- Manages project and file hierarchy
- Implements CRUD operations for projects and files
- Shows recent files
- Handles file selection and loading

#### ResizableLayout Component (`components/ResizableLayout.tsx`)
- Creates split view between editor and preview
- Allows resizing of panels
- Uses react-resizable-panels for layout management

### Services

#### Database Service (`services/Database.ts`)
- Defines Dexie schema for client-side storage
- Manages projects and file nodes
- Supports hierarchical file structure
- Uses TypeScript interfaces for type safety

#### Markdown Parser (`services/MarkdownParser.ts`)
- Converts markdown to HTML using Unified.js
- Applies sanitization for security
- Adds syntax highlighting
- Handles asynchronous parsing with debouncing

#### Export Service (`services/ExportService.ts`)
- Provides export functionality for multiple formats
- Handles PDF, DOCX, HTML, and markdown exports
- Uses dynamic imports for heavy libraries
- Integrates with file-saver for downloads

### Store (`store.ts`)

Manages global application state using Zustand with persistence:

- **Editor Content**: Current markdown content
- **File System State**: Active project and file IDs
- **Theme Configuration**: UI and editor theming options
- **Persistence**: Automatically saves to localStorage

## Component Overview

### Editor Component
The Editor component wraps the Monaco Editor and provides:
- Real-time markdown editing
- Syntax highlighting
- Theme synchronization
- Automatic layout adjustment
- Integration with global state

### Preview Component
The Preview component renders markdown as HTML and includes:
- Debounced parsing for performance
- Syntax highlighting for code blocks
- Mermaid diagram rendering
- Theme-aware styling
- Safe HTML rendering with sanitization

### Sidebar Component
The Sidebar component manages the file system and provides:
- Project creation and management
- File/folder hierarchy visualization
- CRUD operations for files and folders
- Recent files display
- File loading and selection

### Header Component
The Header component offers:
- File operations (save, import)
- Export functionality for multiple formats
- Settings access
- Theme customization

## State Management

The application uses Zustand for state management with the following key areas:

### Content State
- `markdown`: Current editor content
- `setMarkdown()`: Updates editor content

### File System State
- `activeProjectId`: Currently selected project
- `activeFileId`: Currently selected file
- `setActiveProject()`: Sets active project
- `setActiveFile()`: Sets active file

### Theme State
- `theme`: Current theme configuration
- `setTheme()`: Updates theme
- `applyPreset()`: Applies theme presets
- `resetTheme()`: Resets to default theme

State is persisted to localStorage using Zustand's persistence middleware.

## Data Storage

The application uses Dexie.js (an IndexedDB wrapper) for client-side storage:

### Schema
- **Projects**: Stores project information (name, timestamps)
- **Nodes**: Stores files and folders in a hierarchical structure
- **Legacy Documents**: Maintains compatibility with older versions

### Node Structure
Each node can be either a file or folder with:
- `projectId`: Reference to parent project
- `parentId`: Reference to parent folder (null for root)
- `type`: Either 'file' or 'folder'
- `name`: Display name
- `content`: Markdown content (for files only)
- `timestamps`: Creation and update dates

## Export Functionality

The application supports exporting to multiple formats:

### PDF Export
- Uses html2pdf.js to convert preview HTML to PDF
- Maintains formatting and styling
- Configurable margins and page settings

### DOCX Export
- Uses docx.js to create Word documents
- Currently exports raw markdown text
- Future enhancement: Parse markdown AST for better formatting

### HTML Export
- Exports rendered HTML from preview
- Maintains all styling and formatting

### Markdown Export
- Exports raw markdown content
- Preserves original formatting

## Theming System

The application includes a flexible theming system with:

### Theme Configuration
Each theme defines colors for:
- UI elements (background, foreground, borders, accents)
- Editor (background, foreground, font settings)
- Preview (background, foreground, font settings)

### Predefined Themes
- Dark: Default dark theme
- Light: Default light theme
- Dracula: Popular Dracula theme

### Customization
- Adjustable font sizes
- Theme presets
- Full reset capability

## Testing

Currently, the application doesn't include automated tests. When contributing, please ensure manual testing of:

- Editor functionality
- Preview rendering
- File operations
- Export functionality
- Theme changes
- Responsive behavior

## Submitting Changes

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a pull request

### Before Submitting

- Ensure your code follows the style guide
- Test all functionality thoroughly
- Update documentation if needed
- Add tests for new functionality

## Style Guide

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Maintain consistent naming conventions
- Write meaningful comments for complex logic

### Naming Conventions
- Components: PascalCase (e.g., `Editor.tsx`)
- Functions: camelCase (e.g., `handleSave`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- Variables: camelCase (e.g., `activeProjectId`)

### File Organization
- Group related functionality in directories
- Use descriptive file names
- Separate components, services, and utilities
- Maintain consistent import ordering

### Documentation
- Comment complex logic
- Update README when adding features
- Document new components and services
- Keep examples up to date

## Need Help?

If you have questions about contributing:
1. Check the existing documentation
2. Look at existing code for patterns
3. Open an issue for clarification
4. Join our community discussions

Thank you for contributing to Markdown Editor & Viewer!
