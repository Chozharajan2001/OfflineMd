'use client';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ResizableLayout } from './components/ResizableLayout';

export default function Home() {
  return (
    <div className="h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <ResizableLayout />
      </div>
    </div>
  );
}

