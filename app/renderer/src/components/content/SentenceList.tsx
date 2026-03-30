import React, { useState } from 'react';

interface SentenceItemProps {
  id: string;
  text: string;
  translation: string;
}

interface SentenceListProps {
  items: SentenceItemProps[];
}

export function SentenceList({ items }: SentenceListProps) {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => toggleReveal(item.id)}
          className="w-full rounded-lg border px-4 py-3 text-left transition-colors"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border)',
          }}
        >
          <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {item.text}
          </p>
          {revealedIds.has(item.id) ? (
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {item.translation}
            </p>
          ) : (
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Click to reveal translation
            </p>
          )}
        </button>
      ))}
    </div>
  );
}
