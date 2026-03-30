import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LessonCardProps {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  orderIndex: number;
}

export function LessonCard({
  id,
  title,
  description,
  estimatedMinutes,
  orderIndex,
}: LessonCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/lessons/${id}`)}
      className="flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-colors"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
      }}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
        style={{
          backgroundColor: 'var(--color-badge-green)',
          color: 'var(--color-badge-green-text)',
        }}
      >
        {orderIndex + 1}
      </span>
      <div className="flex-1">
        <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </h4>
        {description && (
          <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {description}
          </p>
        )}
        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          ~{estimatedMinutes} min
        </p>
      </div>
    </button>
  );
}
