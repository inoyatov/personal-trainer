import React from 'react';

interface VerbCardProps {
  infinitive: string;
  translation: string;
  type: string;
  formsMap: Record<string, string>;
}

const PRONOUN_ORDER = ['IK', 'JIJ', 'U', 'HIJ', 'ZIJ_SG', 'HET', 'WIJ', 'JULLIE', 'ZIJ_PL'];
const PRONOUN_LABELS: Record<string, string> = {
  IK: 'ik', JIJ: 'jij', U: 'u', HIJ: 'hij', ZIJ_SG: 'zij',
  HET: 'het', WIJ: 'wij', JULLIE: 'jullie', ZIJ_PL: 'zij (pl)',
};

export function VerbCard({ infinitive, translation, type, formsMap }: VerbCardProps) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {infinitive}
          </span>
          <span className="ml-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {translation}
          </span>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: type === 'irregular' ? 'var(--color-badge-orange)' : 'var(--color-badge-blue)',
            color: type === 'irregular' ? 'var(--color-badge-orange-text)' : 'var(--color-badge-blue-text)',
          }}
        >
          {type}
        </span>
      </div>

      {/* Conjugation grid */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-sm">
        {PRONOUN_ORDER.map((key) => {
          const form = formsMap[key];
          if (!form) return null;
          return (
            <div key={key} className="flex justify-between">
              <span style={{ color: 'var(--color-text-tertiary)' }}>{PRONOUN_LABELS[key]}</span>
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{form}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
