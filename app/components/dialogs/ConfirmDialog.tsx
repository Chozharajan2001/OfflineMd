'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';

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
    await onConfirm();
    onOpenChange(false);
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
              <button
                className="flex-1 px-4 py-2 bg-[var(--sidebar-hover)] hover:bg-[var(--sidebar-border)] 
                         text-[var(--dialog-fg)] rounded transition-colors font-medium
                         focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                {cancelText}
              </button>
            </Dialog.Close>
            
            <Dialog.Close asChild>
              <button
                onClick={handleConfirm}
                className={`flex-1 px-4 py-2 rounded transition-colors font-medium
                          focus:outline-none focus:ring-2 focus:ring-[var(--accent)]
                          ${destructive 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-[var(--button-primary-bg)] hover:bg-[var(--button-primary-hover)] text-[var(--button-fg)]'
                          }`}
              >
                {confirmText}
              </button>
            </Dialog.Close>
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
