# Developer Quick Start Guide

## Prerequisites
- Node.js 18+ (recommended)
- npm, yarn, pnpm, or bun package manager

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd markdown-converter
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

4. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
├── components/         # UI components
│   ├── Editor.tsx      # Monaco editor
│   ├── Preview.tsx     # Markdown preview
│   ├── Header.tsx      # Top toolbar
│   ├── Sidebar.tsx     # File explorer
│   └── ...
├── services/           # Business logic
│   ├── Database.ts     # Dexie schema
│   ├── MarkdownParser.ts # MD to HTML
│   └── ExportService.ts # Export functions
├── store.ts            # Global state (Zustand)
└── ...
```

## Key Technologies

- **Framework**: Next.js 16.1.4
- **Editor**: Monaco Editor
- **State**: Zustand
- **Storage**: Dexie.js (IndexedDB)
- **Styling**: Tailwind CSS
- **Markdown**: Unified.js (remark/rehype)

## Common Tasks

### Add a new feature
1. Create component in `app/components/`
2. Add business logic to `app/services/`
3. Update store in `app/store.ts` if needed
4. Connect to UI in existing components

### Modify the database
1. Update interfaces in `app/services/Database.ts`
2. Increment database version if schema changed
3. Add migration logic if needed

### Add export format
1. Extend `ExportService.ts` with new method
2. Add button to `Header.tsx`
3. Update UI as needed

### Customize theme
1. Modify `themes` object in `store.ts`
2. Add new theme configuration
3. Update UI components to use new theme properties

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run code quality checks

## Important Notes

- All data is stored client-side in IndexedDB
- The app works completely offline
- Export functionality runs client-side
- Monaco Editor provides advanced editing features
- Mermaid diagrams are supported in previews
