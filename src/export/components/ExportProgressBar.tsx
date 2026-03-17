import React from 'react';

interface ExportProgressBarProps {
    /** Show/hide the overlay */
    visible: boolean;
    /** Optional text shown below the spinner */
    message?: string;
    /** Optional cancel callback – a Cancel button will appear */
    onCancel?: () => void;
    /** Optional progress percentage (0-100) */
    progress?: number;
}

/**
 * Simple overlay + spinner used while an export is in progress.
 *
 * - When `visible` is `false` nothing is rendered.
 * - The spinner uses Tailwind's `animate-spin` utility.
 * - If `onCancel` is supplied a “Cancel” button appears.
 */
export function ExportProgressBar({
    visible,
    message = 'Exporting…',
    onCancel,
    progress,
}: ExportProgressBarProps) {
    if (!visible) return null;

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-[var(--dialog-bg)] border border-[var(--dialog-border)] rounded p-6 text-center text-[var(--dialog-fg)] shadow-lg w-80">
                {/* Spin animation – a simple circular loader */}
                <div className="animate-spin rounded-full border-4 border-t-4 border-[var(--sidebar-border)] border-t-[var(--accent)] h-12 w-12 mx-auto mb-4" />
                <p className="mb-2">{message}</p>
                
                {/* Progress bar with percentage */}
                {progress !== undefined && (
                    <div className="w-full mt-3 mb-2">
                        <div className="flex justify-between text-xs mb-1">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-[var(--sidebar-input-bg)] rounded-full h-2.5 overflow-hidden">
                            <div 
                                className="bg-[var(--accent)] h-2.5 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}
                
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="mt-4 px-4 py-2 bg-[var(--button-primary-bg)] rounded hover:bg-[var(--button-primary-hover)] text-[var(--button-fg)]"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
}
