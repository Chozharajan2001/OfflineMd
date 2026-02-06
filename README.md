# Markdown Editor & Viewer

A fully offline, free markdown-based notes and documentation system built with Next.js.

## Core Identity
**A fully offline, free markdown-based notes and documentation system**

## Key Features

### 1. **Storage & Privacy**
- ✅ 100% client-side storage (IndexedDB/LocalStorage)
- ✅ No server dependency
- ✅ All data stays on user's device
- ✅ Works completely offline

### 2. **Pricing Model**
- ✅ Completely free
- ✅ No subscription
- ✅ No premium tiers
- ✅ Open source

### 3. **Markdown Capabilities**
- ✅ Live markdown editor with preview
- ✅ Syntax highlighting
- ✅ Support for tables, code blocks, lists, etc.
- ✅ Toggle between edit/preview/split view

### 4. **Organization System**
- ✅ **Projects/Folders** - hierarchical organization
- ✅ **Files** - markdown documents within folders
- ✅ Nested folder support
- ✅ File/folder management (create, rename, delete, move)

### 5. **Export Options**
- ✅ Markdown (.md)
- ✅ HTML
- ✅ Plain Text (.txt)
- ✅ PDF
- ✅ Word Document (.docx)
- ✅ Bulk export (entire project/folder)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Unique Selling Points
1. **Privacy-first** - Your notes never leave your device
2. **Zero cost** - No hidden fees ever
3. **Portable** - Export to any format
4. **Professional** - Perfect for documentation

## Tech Stack
- **Framework**: React, Vue, or Svelte
- **Storage**: IndexedDB (Dexie.js) or LocalStorage
- **Markdown**: Marked.js or Unified.js
- **Export**:
  - PDF: jsPDF or html2pdf
  - DOCX: docx.js
  - HTML: Built-in conversion
