import React, { useEffect, useRef, useCallback } from 'react';

interface ConfidenceWidgetProps {
  onSelect: (confidence: 0 | 1 | 2) => void;
  disabled?: boolean;
}

const options: Array<{ value: 0 | 1 | 2; label: string; key: string; description: string }> = [
  { value: 0, label: 'Guessed', key: '1', description: 'I had no idea' },
  { value: 1, label: 'Somewhat Sure', key: '2', description: 'I think I knew it' },
  { value: 2, label: 'Confident', key: '3', description: 'I was certain' },
];

export function ConfidenceWidget({ onSelect, disabled = false }: ConfidenceWidgetProps) {
  const autoDefaultTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-default to 1 after 3 seconds
  useEffect(() => {
    if (disabled) return;
    autoDefaultTimer.current = setTimeout(() => {
      onSelect(1);
    }, 3000);
    return () => {
      if (autoDefaultTimer.current) clearTimeout(autoDefaultTimer.current);
    };
  }, [disabled, onSelect]);

  const handleSelect = useCallback(
    (value: 0 | 1 | 2) => {
      if (disabled) return;
      if (autoDefaultTimer.current) clearTimeout(autoDefaultTimer.current);
      onSelect(value);
    },
    [disabled, onSelect],
  );

  // Keyboard shortcuts: 1, 2, 3
  useEffect(() => {
    if (disabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === '1') handleSelect(0);
      else if (e.key === '2') handleSelect(1);
      else if (e.key === '3') handleSelect(2);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [disabled, handleSelect]);

  return (
    <div className="rounded-lg border p-4" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
      <p className="mb-3 text-center text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        How confident were you?
      </p>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            disabled={disabled}
            className="flex-1 rounded-lg border px-3 py-2 text-center transition-colors"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-tertiary)' }}
          >
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
              {opt.key}
            </span>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {opt.label}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {opt.description}
            </p>
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
        Press 1, 2, or 3 (auto-selects "Somewhat Sure" in 3s)
      </p>
    </div>
  );
}
