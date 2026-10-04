'use client';

import { useCallback } from 'react';
import { create } from 'zustand';
import type { ToastMessage, ToastType } from './types';
import { generateToastId } from './types';

interface ToastStore {
  toasts: ToastMessage[];
  addToast: (message: string, type: ToastType, options?: { duration?: number }) => string;
  removeToast: (id: string) => void;
}

// Module-level store: the container is mounted once in the root layout, so toasts raised by
// any component must live in shared state rather than a per-component useState.
const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type, options) => {
    const id = generateToastId();
    set((prev) => ({ toasts: [...prev.toasts, { id, type, message, duration: options?.duration }] }));
    return id;
  },
  removeToast: (id) => set((prev) => ({ toasts: prev.toasts.filter((t) => t.id !== id) })),
}));

export function useToast() {
  const toasts = useToastStore((state) => state.toasts);
  const addToast = useToastStore((state) => state.addToast);
  const removeToast = useToastStore((state) => state.removeToast);

  // Convenience methods
  const success = useCallback(
    (message: string, options?: { duration?: number }) => {
      return addToast(message, 'success', options);
    },
    [addToast]
  );

  const error = useCallback(
    (message: string, options?: { duration?: number }) => {
      return addToast(message, 'error', options);
    },
    [addToast]
  );

  const warn = useCallback(
    (message: string, options?: { duration?: number }) => {
      return addToast(message, 'warn', options);
    },
    [addToast]
  );

  const info = useCallback(
    (message: string, options?: { duration?: number }) => {
      return addToast(message, 'info', options);
    },
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warn,
    info,
  };
}
