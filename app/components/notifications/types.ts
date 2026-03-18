export type ToastType = 'success' | 'error' | 'warn' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ToastOptions {
  duration?: number;
}

/**
 * Generate unique ID for toast messages
 */
export function generateToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
