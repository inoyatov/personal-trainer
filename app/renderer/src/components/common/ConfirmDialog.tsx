import React from 'react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div
        className="mx-4 w-full max-w-md rounded-lg p-6 shadow-xl"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </h3>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {message}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: danger ? 'var(--color-error)' : 'var(--color-accent)',
              color: 'var(--color-text-inverse)',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
