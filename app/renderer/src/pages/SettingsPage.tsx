import React from 'react';
import { useAppStore } from '../lib/store';
import { themes, type ThemeDefinition } from '../lib/themes';
import { PageHeader } from '../components/common/PageHeader';

export function SettingsPage() {
  const { themeId, setTheme } = useAppStore();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" subtitle="Customize your experience" backTo="/" />

      {/* Theme section */}
      <section className="mb-8">
        <h3 className="mb-4 text-lg font-semibold themed-text">
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
