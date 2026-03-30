import React from 'react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
}

export function PageHeader({ title, subtitle, backTo }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="mb-6">
      {backTo && (
        <button
          onClick={() => navigate(backTo)}
          className="mb-2 text-sm"
          style={{ color: 'var(--color-accent)' }}
        >
          &larr; Back
        </button>
      )}
      <h2
        className="text-2xl font-bold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
