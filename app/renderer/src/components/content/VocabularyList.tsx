import React from 'react';

interface VocabularyItemProps {
  id: string;
  displayText: string;
  translation: string;
  partOfSpeech: string;
  article: string | null;
}

interface VocabularyListProps {
  items: VocabularyItemProps[];
}

export function VocabularyList({ items }: VocabularyListProps) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-lg border px-4 py-3"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div>
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {item.displayText}
            </span>
            <span className="ml-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {item.partOfSpeech}
            </span>
          </div>
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {item.translation}
          </span>
        </div>
      ))}
    </div>
  );
}
