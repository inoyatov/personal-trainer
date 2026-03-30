import React from 'react';

export type SessionModeId = 'low-energy' | 'normal' | 'deep';

interface ModeOption {
  id: SessionModeId;
  name: string;
  description: string;
  time: string;
  icon: string;
}

const modes: ModeOption[] = [
  {
    id: 'low-energy',
    name: 'Low Energy',
    description: 'Short and easy — mostly recognition, no new words',
    time: '5-10 min',
    icon: '🌙',
  },
  {
    id: 'normal',
    name: 'Normal',
    description: 'Balanced mix of recognition, recall, and dialog',
    time: '15-20 min',
    icon: '📚',
  },
  {
    id: 'deep',
    name: 'Deep',
    description: 'Full practice including writing — for focused study',
    time: '30+ min',
    icon: '🔥',
  },
];

interface SessionModeSelectorProps {
  onSelect: (mode: SessionModeId) => void;
}

export function SessionModeSelector({ onSelect }: SessionModeSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        Choose your study mode
      </p>
      <div className="grid grid-cols-3 gap-3">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onSelect(mode.id)}
            className="rounded-lg border p-4 text-left transition-shadow hover:shadow-md"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="mb-2 text-2xl">{mode.icon}</div>
            <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {mode.name}
            </h4>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {mode.description}
            </p>
            <p className="mt-2 text-xs font-medium" style={{ color: 'var(--color-accent-text)' }}>
              {mode.time}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
