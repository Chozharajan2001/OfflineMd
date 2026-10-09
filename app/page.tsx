'use client';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ResizableLayout } from './components/ResizableLayout';

export default function Home() {
  return (
    <div className="h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] overflow-hidden">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:p-2 focus:bg-[var(--background)] focus:text-[var(--foreground)]">
        Skip to content
      </a>
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main id="main-content" className="flex-1 flex min-w-0" aria-label="Editor workspace">
          <ResizableLayout />
        </main>
      </div>
    </div>
  );
}

