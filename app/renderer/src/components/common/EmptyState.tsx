import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <p className="text-lg font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {title}
      </p>
      {description && (
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          {description}
        </p>
      )}
    </div>
  );
}
