export type ToastType = 'success' | 'error' | 'warn' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ToastOptions {
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Generate unique ID for toast messages
 */
export function generateToastId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `toast-${crypto.randomUUID()}`;
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Get default duration based on toast type
 */
export function getDefaultDuration(type: ToastType): number {
  switch (type) {
    case 'error':
      return 6000; // Errors need more time to read
    case 'success':
    case 'warn':
    case 'info':
    default:
      return 4000;
  }
}
