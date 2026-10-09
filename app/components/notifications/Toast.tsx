'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { ToastMessage } from './types';
import { getDefaultDuration } from './types';

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
  const [paused, setPaused] = useState(false);
  const remaining = useRef(duration);
  const startedAt = useRef(0);

  // Auto-dismiss after duration, pausable on hover/focus
  useEffect(() => {
    if (paused) return;
    startedAt.current = Date.now();
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, remaining.current);

    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [toast.id, paused, onClose]);

  // Icon and color based on type — surfaces come from the theme, only the
  // semantic bar + icon carry the status color (0.1 elevation scale)
  const getTypeStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bar: 'var(--color-success)',
          icon: (
            <svg className="w-5 h-5" style={{ color: 'var(--color-success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
        };
      case 'error':
        return {
          bar: 'var(--color-danger)',
          icon: (
            <svg className="w-5 h-5" style={{ color: 'var(--color-danger)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
        };
      case 'warn':
        return {
          bar: 'var(--color-warning)',
          icon: (
            <svg className="w-5 h-5" style={{ color: 'var(--color-warning)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
        };
      case 'info':
        return {
          bar: 'var(--color-info)',
          icon: (
            <svg className="w-5 h-5" style={{ color: 'var(--color-info)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      role="status"
      className="relative flex items-start gap-3 p-4 rounded-lg border border-[var(--dialog-border)] bg-[var(--surface-2)] text-[var(--dialog-fg)] shadow-lg border-l-4 animate-slide-in-right"
      style={{ borderLeftColor: styles.bar }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>

      {/* Message */}
      <p className="flex-1 text-sm pr-8">{toast.message}</p>

      {/* Action (e.g. Undo) */}
      {toast.actionLabel && toast.onAction && (
        <button
          onClick={() => {
            toast.onAction?.();
            onClose(toast.id);
          }}
          className="shrink-0 px-2 py-1 text-xs font-semibold rounded transition-colors bg-[var(--button-primary-bg)] text-[var(--button-fg)] hover:bg-[var(--button-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          {toast.actionLabel}
        </button>
      )}

      {/* Close button */}
      <button
        onClick={() => onClose(toast.id)}
        className="absolute top-2 right-2 p-1 hover:bg-[var(--sidebar-hover)] rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-lg" aria-hidden="true">
        <div
          className="h-full animate-shrink"
          style={{
            backgroundColor: styles.bar,
            opacity: 0.5,
            animationDuration: `${duration}ms`,
            animationTimingFunction: 'linear',
            animationPlayState: paused ? 'paused' : 'running',
          }}
        />
      </div>
    </div>
  );
}
