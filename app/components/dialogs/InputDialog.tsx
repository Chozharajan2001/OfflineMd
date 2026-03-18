'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useMemo, useRef, useState } from 'react';

interface InputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  onSubmit: (value: string) => void | Promise<void>;
  validate?: (value: string) => string | null;
  inputType?: 'text' | 'password' | 'email';
  submitText?: string;
  cancelText?: string;
}

/**
 * Accessible input dialog using Radix primitives.
 * 
 * Features:
 * - Auto-focus input field on open
 * - Enter key to submit
 * - Escape to cancel
 * - Inline validation error display
 * - Required field validation by default
 */
export function InputDialog({
  open,
  onOpenChange,
  title,
  description,
  defaultValue = '',
  placeholder = '',
  onSubmit,
  validate,
  inputType = 'text',
  submitText = 'Save',
  cancelText = 'Cancel',
}: InputDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset value and focus input when dialog opens
  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      setError(null);
      // Focus input after dialog animation completes
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, defaultValue]);

  // Generate unique ID for description for ARIA linkage
  const descriptionId = useMemo(
    () => `input-dialog-desc-${title.replace(/\s+/g, '-').toLowerCase()}`,
    [title]
  );

  // Run validation and update error state
  const runValidation = (next: string) => {
    const msg = validate ? validate(next) : (!next.trim() ? 'This field is required.' : null);
    setError(msg);
    return !msg;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!runValidation(value)) return;
    try {
      setSubmitting(true);
      await onSubmit(value.trim());
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content
          aria-describedby={description ? descriptionId : undefined}
          className="fixed top-1/2 left-1/2 w-[360px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded border border-[var(--dialog-border)] bg-[var(--dialog-bg)] p-4 text-[var(--dialog-fg)] shadow-xl z-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          <Dialog.Title className="text-base font-semibold">
            {title}
          </Dialog.Title>
          
          {description ? (
            <Dialog.Description id={descriptionId} className="mt-1 text-sm text-[var(--sidebar-muted)]">
              {description}
            </Dialog.Description>
          ) : null}

          <div className="mt-4">
            <input
              ref={inputRef}
              type={inputType}
              value={value}
              placeholder={placeholder}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) runValidation(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSubmit();
              }}
              className="w-full rounded border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--input-fg)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button 
                className="rounded bg-[var(--button-secondary-bg)] px-3 py-1.5 text-[var(--button-fg)] hover:bg-[var(--button-secondary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                {cancelText}
              </button>
            </Dialog.Close>
            <button
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="rounded bg-[var(--button-primary-bg)] px-3 py-1.5 text-[var(--button-fg)] hover:bg-[var(--button-primary-hover)] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              {submitting ? 'Saving...' : submitText}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
