'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import type { ToastMessage } from './types';

export interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

/**
 * Individual toast notification component.
 * 
 * Features:
 * - Auto-dismiss with configurable duration
 * - Manual close button
 * - Type-based styling (success/error/warn/info)
 * - Slide-in animation
 * - Progress bar for remaining time
 */
export function Toast({ toast, onClose }: ToastProps) {
  const duration = toast.duration ?? getDefaultDuration(toast.type);

  // Auto-dismiss after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, duration, onClose]);

  // Icon and color based on type
  const getTypeStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-green-900/90',
          border: 'border-green-500',
          icon: (
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
        };
      case 'error':
        return {
          bg: 'bg-red-900/90',
          border: 'border-red-500',
          icon: (
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
        };
      case 'warn':
        return {
          bg: 'bg-yellow-900/90',
          border: 'border-yellow-500',
          icon: (
            <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
        };
      case 'info':
        return {
          bg: 'bg-blue-900/90',
          border: 'border-blue-500',
          icon: (
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${styles.bg} ${styles.border} animate-slide-in-right`}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>

      {/* Message */}
      <p className="flex-1 text-sm text-white pr-8">{toast.message}</p>

      {/* Close button */}
      <button
        onClick={() => onClose(toast.id)}
        className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4 text-white" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-lg">
        <div
          className="h-full bg-white/30 animate-shrink"
          style={{
            animationDuration: `${duration}ms`,
            animationTimingFunction: 'linear',
          }}
        />
      </div>
    </div>
  );
}

// Helper to get default duration
function getDefaultDuration(type: 'success' | 'error' | 'warn' | 'info'): number {
  switch (type) {
    case 'error':
      return 6000;
    default:
      return 4000;
  }
}
