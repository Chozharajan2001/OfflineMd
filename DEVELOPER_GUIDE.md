# Markdown Editor & Viewer - Complete Developer Documentation

Welcome to the complete developer documentation for the Markdown Editor & Viewer application. This document serves as an index and overview of all the documentation created for developers who want to contribute to this project.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Documentation Files](#documentation-files)
3. [Getting Started](#getting-started)
4. [Technology Stack](#technology-stack)
5. [Application Architecture](#application-architecture)
6. [Key Features](#key-features)
7. [Contributing Guidelines](#contributing-guidelines)

## Project Overview

Markdown Editor & Viewer is a fully offline, free markdown-based notes and documentation system built with Next.js. The application features live markdown editing with preview, client-side storage, and multiple export options.

### Core Principles
- **Privacy First**: All data stays on the user's device
- **Offline Capability**: Works completely without internet
- **Free Forever**: No subscriptions or premium tiers
- **Open Source**: Community-driven development

## Documentation Files

This project includes several documentation files to help developers understand and contribute to the codebase:

### 1. README.md
- Project overview and feature specification
- Getting started instructions
- Tech stack information
- Unique selling points

### 2. CONTRIBUTING.md
- Contribution guidelines
- Development workflow
- Code structure explanation
- Component overview
- Style guide
- Submission process

### 3. TECHNICAL_DOCS.md
- Detailed technical architecture
- Component deep-dive
- Data flow diagrams
- State management details
- Storage system implementation
- Security measures
- Performance considerations

### 4. QUICK_START.md
- Rapid setup guide
- Project structure overview
- Key technologies
- Common tasks
- Available scripts

## Getting Started

To begin developing on this project:

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd markdown-converter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

For detailed setup instructions, refer to the QUICK_START.md file.

## Technology Stack

The application leverages modern web technologies:

- **Framework**: Next.js 16.1.4 with React 19.2.3
- **Editor**: Monaco Editor for rich text editing
- **State Management**: Zustand with persistence
- **Storage**: Dexie.js (IndexedDB wrapper)
- **Markdown Processing**: Unified.js ecosystem (remark/rehype)
- **Styling**: Tailwind CSS with custom themes
- **Export**: html2pdf.js, docx.js, file-saver
- **UI Components**: Radix UI Primitives
- **Icons**: Lucide React
- **Syntax Highlighting**: highlight.js
- **Diagrams**: Mermaid
- **Build Tool**: TypeScript 5+

## Application Architecture

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
```

### Components Layer
- **Editor**: Rich markdown editing with Monaco
- **Preview**: Real-time markdown rendering
- **Header**: File operations and settings
- **Sidebar**: Project and file management
- **Layout**: Responsive UI structure

### Services Layer
- **Database**: Client-side storage with Dexie
- **MarkdownParser**: Secure markdown processing
- **ExportService**: Multi-format export capabilities

### Store Layer
- **Global State**: Centralized application state
- **Persistence**: Automatic local storage
- **Theming**: Dynamic theme management

## Key Features

### 1. Storage & Privacy
- ✅ 100% client-side storage (IndexedDB/LocalStorage)
- ✅ No server dependency
- ✅ All data stays on user's device
- ✅ Works completely offline

### 2. Markdown Capabilities
- ✅ Live markdown editor with preview
- ✅ Syntax highlighting
- ✅ Support for tables, code blocks, lists, etc.
- ✅ Toggle between edit/preview/split view

### 3. Organization System
- ✅ Projects/Folders - hierarchical organization
- ✅ Files - markdown documents within folders
- ✅ Nested folder support
- ✅ File/folder management (create, rename, delete, move)

### 4. Export Options
- ✅ Markdown (.md)
- ✅ HTML
- ✅ Plain Text (.txt)
- ✅ PDF
- ✅ Word Document (.docx)
- ✅ Bulk export (entire project/folder)

### 5. Theming System
- ✅ Multiple theme presets (Dark, Light, Dracula)
- ✅ Customizable fonts and colors
- ✅ Editor and preview theming
- ✅ UI consistency across components

## Contributing Guidelines

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute
- Bug reports and fixes
- Feature enhancements
- Documentation improvements
- Performance optimizations
- Security improvements
- UI/UX enhancements

### Development Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Update documentation if needed
6. Submit a pull request

### Code Standards
- Follow TypeScript best practices
- Maintain consistent naming conventions
- Write meaningful comments for complex logic
- Ensure responsive design
- Follow accessibility guidelines

For detailed contribution guidelines, see CONTRIBUTING.md.

## Support

If you need help with the project:

1. Review the documentation files in this repository
2. Check the existing issues and pull requests
3. Create a new issue for bugs or feature requests
4. Join our community discussions

## License

This project is open source and available under the [MIT License](LICENSE).

---

Thank you for your interest in contributing to Markdown Editor & Viewer! Together, we can build a powerful, privacy-focused tool for the community.
