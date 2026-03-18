'use client';

import React from 'react';
import { Toast } from './Toast';
import type { ToastMessage } from './types';

export interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const MAX_VISIBLE_TOASTS = 4;

/**
 * Toast notification container.
 * 
 * Features:
 * - Stacks notifications in top-right corner
 * - Limits visible toasts to prevent overflow
 * - Accessible with aria-live region
 * - Fixed position, high z-index
 */
export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  // Only show most recent toasts
  const visibleToasts = toasts.slice(-MAX_VISIBLE_TOASTS);

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-md pointer-events-auto"
      aria-live="polite"
      aria-label="Notifications"
    >
      {visibleToasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onRemove} />
      ))}
    </div>
  );
}
