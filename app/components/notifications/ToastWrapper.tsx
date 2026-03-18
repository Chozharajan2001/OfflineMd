'use client';

import { useToast } from './useToast';
import { ToastContainer } from './ToastContainer';

/**
 * Wrapper component that provides toast context and renders container.
 * Use this in your root layout to enable toast notifications globally.
 */
export function ToastContainerWrapper() {
    const { toasts, removeToast } = useToast();
    return <ToastContainer toasts={toasts} onRemove={removeToast} />;
}
