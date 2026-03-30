import React from 'react';

interface FrustrationBannerProps {
  message: string;
}

export function FrustrationBanner({ message }: FrustrationBannerProps) {
  return (
    <div
      className="mx-auto mb-4 max-w-2xl rounded-lg border p-3 text-center text-sm"
      style={{
        backgroundColor: 'var(--color-warning-light)',
        borderColor: 'var(--color-warning)',
        color: 'var(--color-warning-text)',
      }}
    >
      {message}
    </div>
  );
}
