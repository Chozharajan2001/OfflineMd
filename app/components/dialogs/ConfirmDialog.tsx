'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '../ui';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  destructive?: boolean;
}

/**
 * Accessible confirmation dialog using Radix primitives.
 * 
 * Features:
 * - Focus trap within dialog
 * - ESC key to close
 * - Automatic focus return on close
 * - Keyboard navigation
 * - Destructive action styling option
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  destructive = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Keep dialog open on failure so the error toast stays contextual
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                     bg-[var(--background)] border border-[var(--header-border)] 
                     text-[var(--dialog-fg)] p-6 rounded-lg shadow-xl max-w-md w-full z-50
                     focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          aria-describedby="confirm-dialog-description"
        >
          <Dialog.Title className="text-lg font-semibold mb-2">
            {title}
          </Dialog.Title>
          
          <Dialog.Description
            id="confirm-dialog-description"
            className="text-[var(--sidebar-muted)] mb-6"
          >
            {description}
          </Dialog.Description>
          
          <div className="flex gap-3 justify-end">
            <Dialog.Close asChild>
              <Button variant="secondary" className="flex-1">
                {cancelText}
              </Button>
            </Dialog.Close>

            <Button
              variant={destructive ? 'danger' : 'primary'}
              onClick={handleConfirm}
              className="flex-1"
            >
              {confirmText}
            </Button>
          </div>
          
          {/* Close button (X icon) */}
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 p-1 hover:bg-[var(--sidebar-hover)] rounded 
                       text-[var(--sidebar-fg)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              aria-label="Close dialog"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 8.707l4.95-4.95.707.707L8.707 9.414l4.95 4.95-.707.707L8 10.121l-4.95 4.95-.707-.707 4.95-4.95-4.95-4.95.707-.707L8 8.707z"/>
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
