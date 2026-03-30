import React from 'react';

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        backgroundColor: 'var(--color-error-light)',
        borderColor: 'var(--color-error)',
      }}
    >
      <p className="text-sm" style={{ color: 'var(--color-error-text)' }}>
        {message}
      </p>
    </div>
  );
}
