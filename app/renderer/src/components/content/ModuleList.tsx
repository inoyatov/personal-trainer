import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ModuleItem {
  id: string;
  title: string;
  orderIndex: number;
}

interface ModuleListProps {
  modules: ModuleItem[];
  courseId: string;
}

export function ModuleList({ modules, courseId }: ModuleListProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      {modules.map((mod, index) => (
        <button
          key={mod.id}
          onClick={() => navigate(`/courses/${courseId}/modules/${mod.id}`)}
          className="flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border)',
          }}
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{
              backgroundColor: 'var(--color-badge-blue)',
              color: 'var(--color-badge-blue-text)',
            }}
          >
            {index + 1}
          </span>
          <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {mod.title}
          </h4>
        </button>
      ))}
    </div>
  );
}
