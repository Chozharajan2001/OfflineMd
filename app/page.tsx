'use client';

import { useEffect } from 'react';
import { useMarkdownStore } from './store';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ResizableLayout } from './components/ResizableLayout';
import { CommandPalette } from './components/CommandPalette';

/**
 * Handles launch URLs: app shortcuts (?new=file) and shared links.
 * Writes a one-shot intent into the store; Sidebar consumes it once a
 * project is active. Store-driven (not event + timeout), so no race between
 * the default-project bootstrap and the dialog is possible.
 */
function DeepLinkHandler() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('new') !== 'file') return;
    window.history.replaceState(null, '', '/');
    useMarkdownStore.getState().setPendingDeepLink('new-file');
  }, []);
  return null;
}

export default function Home() {
  return (
    <div className="h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] overflow-hidden">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:p-2 focus:bg-[var(--background)] focus:text-[var(--foreground)]">
        Skip to content
      </a>
      <DeepLinkHandler />
      <Header />
      <CommandPalette />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main id="main-content" className="flex-1 flex min-w-0" aria-label="Editor workspace">
          <ResizableLayout />
        </main>
      </div>
    </div>
  );
}

