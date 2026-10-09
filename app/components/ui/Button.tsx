'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--button-primary-bg)] hover:bg-[var(--button-primary-hover)] text-[var(--button-fg)] font-medium',
  secondary: 'bg-[var(--button-secondary-bg)] hover:bg-[var(--button-secondary-hover)] text-[var(--button-fg)] font-medium',
  danger: 'bg-red-600 hover:bg-red-700 text-white font-medium',
  ghost: 'hover:bg-[var(--sidebar-hover)] text-[var(--sidebar-fg)]',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

/** Themed text button with baked-in 40px touch target. */
export function Button({ variant = 'secondary', className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`min-h-[40px] px-3 py-1.5 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  active?: boolean;
}

/** Themed 44px icon button with tooltip + accessible name. */
export function IconButton({ label, title, active, className = '', type = 'button', children, ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      title={title ?? label}
      aria-label={label}
      className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed ${active ? 'bg-[var(--header-hover)]' : 'hover:bg-[var(--header-hover)]'} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
