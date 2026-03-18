'use client';

import { useCallback, useState } from 'react';
import type { ToastMessage, ToastType } from './types';
import { generateToastId } from './types';

/**
 * Hook for managing toast notifications.
 * 
 * Usage:
 * ```tsx
 * const { toasts, addToast, removeToast, success, error, warn, info } = useToast();
 * 
 * // Show success toast
 * success('File saved successfully!');
 * 
 * // Show error with custom duration
 * error('Failed to save file', { duration: 8000 });
 * ```
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType, options?: { duration?: number }) => {
    const id = generateToastId();
    const toast: ToastMessage = {
      id,
      type,
      message,
      duration: options?.duration,
    };

    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

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
