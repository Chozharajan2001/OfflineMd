'use client';

import { Header } from './components/Header';
import { ResizableLayout } from './components/ResizableLayout';

export default function Home() {
  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100 overflow-hidden">
      <Header />
      <ResizableLayout />
    </div>
  );
}

