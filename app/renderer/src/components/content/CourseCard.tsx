import React from 'react';
import { useNavigate } from 'react-router-dom';

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  targetLevel: string;
  languageCode: string;
}

export function CourseCard({
  id,
  title,
  description,
  targetLevel,
  languageCode,
}: CourseCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/courses/${id}`)}
      className="w-full rounded-lg border p-6 text-left transition-shadow hover:shadow-md"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className="rounded px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: 'var(--color-badge-blue)',
            color: 'var(--color-badge-blue-text)',
          }}
        >
          {targetLevel}
        </span>
        <span className="text-xs uppercase" style={{ color: 'var(--color-text-tertiary)' }}>
          {languageCode}
        </span>
      </div>
      <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {description}
        </p>
      )}
    </button>
  );
}
