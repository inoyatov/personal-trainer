import React from 'react';
import { useAppStore } from '../lib/store';
import { themes, type ThemeDefinition } from '../lib/themes';
import { PageHeader } from '../components/common/PageHeader';

export function SettingsPage() {
  const { themeId, setTheme, gapMode, setGapMode } = useAppStore();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" subtitle="Customize your experience" backTo="/" />

      {/* Theme section */}
      <section className="mb-8">
        <h3 className="mb-4 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Color Theme
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {themes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isActive={theme.id === themeId}
              onSelect={() => setTheme(theme.id)}
            />
          ))}
        </div>
      </section>

      {/* Gap-fill mode */}
      <section className="mb-8">
        <h3 className="mb-4 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Gap-Fill Display
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setGapMode('MASKED')}
            className={`rounded-lg border-2 p-4 text-left transition-all ${
              gapMode === 'MASKED' ? 'shadow-md' : ''
            }`}
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: gapMode === 'MASKED' ? 'var(--color-accent)' : 'var(--color-border)',
            }}
          >
            <p className="mb-1 text-lg font-mono" style={{ color: 'var(--color-text-primary)' }}>
              Ik ga naar de ____.
            </p>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Masked (default)
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Fixed blank — doesn't reveal word length
            </p>
          </button>
          <button
            onClick={() => setGapMode('LENGTH_HINT')}
            className={`rounded-lg border-2 p-4 text-left transition-all ${
              gapMode === 'LENGTH_HINT' ? 'shadow-md' : ''
            }`}
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: gapMode === 'LENGTH_HINT' ? 'var(--color-accent)' : 'var(--color-border)',
            }}
          >
            <p className="mb-1 text-lg font-mono" style={{ color: 'var(--color-text-primary)' }}>
              Ik ga naar de _ _ _ _ _ _.
            </p>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Length Hint
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Blank matches word length — easier difficulty
            </p>
          </button>
        </div>
      </section>
    </div>
  );
}

function ThemeCard({
  theme,
  isActive,
  onSelect,
}: {
  theme: ThemeDefinition;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`rounded-lg border-2 p-3 text-left transition-all ${
        isActive
          ? 'border-[var(--color-accent)] shadow-md'
          : 'themed-border hover:shadow-sm'
      }`}
      style={{ borderColor: isActive ? theme.vars['--color-accent'] : undefined }}
    >
      {/* Theme preview */}
      <div
        className="mb-3 flex h-24 overflow-hidden rounded-md"
        style={{ backgroundColor: theme.preview.bg }}
      >
        {/* Sidebar preview */}
        <div
          className="w-1/4 p-2"
          style={{ backgroundColor: theme.preview.sidebar }}
        >
          <div
            className="mb-1.5 h-2 w-full rounded"
            style={{ backgroundColor: theme.preview.accent, opacity: 0.7 }}
          />
          <div
            className="mb-1 h-1.5 w-3/4 rounded"
            style={{ backgroundColor: theme.preview.text, opacity: 0.2 }}
          />
          <div
            className="mb-1 h-1.5 w-2/3 rounded"
            style={{ backgroundColor: theme.preview.text, opacity: 0.2 }}
          />
          <div
            className="mb-1 h-1.5 w-4/5 rounded"
            style={{ backgroundColor: theme.preview.text, opacity: 0.2 }}
          />
        </div>
        {/* Content preview */}
        <div className="flex-1 p-2">
          <div
            className="mb-2 h-2.5 w-1/3 rounded"
            style={{ backgroundColor: theme.preview.text, opacity: 0.6 }}
          />
          <div className="flex gap-1.5">
            <div
              className="h-10 flex-1 rounded"
              style={{ backgroundColor: theme.preview.card }}
            />
            <div
              className="h-10 flex-1 rounded"
              style={{ backgroundColor: theme.preview.card }}
            />
            <div
              className="h-10 flex-1 rounded"
              style={{ backgroundColor: theme.preview.card }}
            />
          </div>
          <div
            className="mt-2 h-5 w-16 rounded"
            style={{ backgroundColor: theme.preview.accent }}
          />
        </div>
      </div>

      {/* Theme info */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium themed-text">{theme.name}</p>
          <p className="text-xs themed-text-secondary">{theme.description}</p>
        </div>
        {isActive && (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: theme.vars['--color-accent'],
              color: theme.vars['--color-text-inverse'],
            }}
          >
            Active
          </span>
        )}
      </div>

      {/* Color palette dots */}
      <div className="mt-2 flex gap-1.5">
        {[
          theme.vars['--color-accent'],
          theme.vars['--color-success'],
          theme.vars['--color-error'],
          theme.vars['--color-warning'],
          theme.vars['--color-badge-purple-text'] ?? theme.vars['--color-accent'],
        ].map((color, i) => (
          <div
            key={i}
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </button>
  );
}
