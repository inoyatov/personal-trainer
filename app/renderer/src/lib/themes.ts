export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  preview: {
    sidebar: string;
    bg: string;
    card: string;
    accent: string;
    text: string;
  };
  vars: Record<string, string>;
}

export const themes: ThemeDefinition[] = [
  {
    id: 'default-light',
    name: 'Default Light',
    description: 'Clean light theme',
    preview: {
      sidebar: '#ffffff',
      bg: '#f9fafb',
      card: '#ffffff',
      accent: '#2563eb',
      text: '#111827',
    },
    vars: {
      '--color-bg-primary': '#f9fafb',
      '--color-bg-secondary': '#ffffff',
      '--color-bg-tertiary': '#f3f4f6',
      '--color-bg-hover': '#f3f4f6',
      '--color-bg-active': '#dbeafe',
      '--color-bg-sidebar': '#ffffff',
      '--color-bg-input': '#ffffff',

      '--color-border': '#e5e7eb',
      '--color-border-active': '#2563eb',

      '--color-text-primary': '#111827',
      '--color-text-secondary': '#6b7280',
      '--color-text-tertiary': '#9ca3af',
      '--color-text-inverse': '#ffffff',

      '--color-accent': '#2563eb',
      '--color-accent-hover': '#1d4ed8',
      '--color-accent-light': '#dbeafe',
      '--color-accent-text': '#1e40af',

      '--color-success': '#16a34a',
      '--color-success-light': '#f0fdf4',
      '--color-success-text': '#15803d',
      '--color-error': '#dc2626',
      '--color-error-light': '#fef2f2',
      '--color-error-text': '#b91c1c',
      '--color-warning': '#d97706',
      '--color-warning-light': '#fffbeb',
      '--color-warning-text': '#b45309',

      '--color-badge-blue': '#dbeafe',
      '--color-badge-blue-text': '#1e40af',
      '--color-badge-green': '#dcfce7',
      '--color-badge-green-text': '#166534',
      '--color-badge-purple': '#f3e8ff',
      '--color-badge-purple-text': '#7c3aed',
      '--color-badge-orange': '#fff7ed',
      '--color-badge-orange-text': '#c2410c',
    },
  },
  {
    id: 'default-dark',
    name: 'Default Dark',
    description: 'Clean dark theme',
    preview: {
      sidebar: '#1f2937',
      bg: '#111827',
      card: '#1f2937',
      accent: '#3b82f6',
      text: '#f9fafb',
    },
    vars: {
      '--color-bg-primary': '#111827',
      '--color-bg-secondary': '#1f2937',
      '--color-bg-tertiary': '#374151',
      '--color-bg-hover': '#374151',
      '--color-bg-active': '#1e3a5f',
      '--color-bg-sidebar': '#1f2937',
      '--color-bg-input': '#1f2937',

      '--color-border': '#374151',
      '--color-border-active': '#3b82f6',

      '--color-text-primary': '#f9fafb',
      '--color-text-secondary': '#9ca3af',
      '--color-text-tertiary': '#6b7280',
      '--color-text-inverse': '#111827',

      '--color-accent': '#3b82f6',
      '--color-accent-hover': '#2563eb',
      '--color-accent-light': '#1e3a5f',
      '--color-accent-text': '#93c5fd',

      '--color-success': '#22c55e',
      '--color-success-light': '#052e16',
      '--color-success-text': '#86efac',
      '--color-error': '#ef4444',
      '--color-error-light': '#450a0a',
      '--color-error-text': '#fca5a5',
      '--color-warning': '#f59e0b',
      '--color-warning-light': '#451a03',
      '--color-warning-text': '#fcd34d',

      '--color-badge-blue': '#1e3a5f',
      '--color-badge-blue-text': '#93c5fd',
      '--color-badge-green': '#052e16',
      '--color-badge-green-text': '#86efac',
      '--color-badge-purple': '#2e1065',
      '--color-badge-purple-text': '#c4b5fd',
      '--color-badge-orange': '#431407',
      '--color-badge-orange-text': '#fdba74',
    },
  },
  {
    id: 'gruvbox-dark',
    name: 'Gruvbox Dark',
    description: 'Warm retro dark theme',
    preview: {
      sidebar: '#3c3836',
      bg: '#282828',
      card: '#3c3836',
      accent: '#d79921',
      text: '#ebdbb2',
    },
    vars: {
      '--color-bg-primary': '#282828',
      '--color-bg-secondary': '#3c3836',
      '--color-bg-tertiary': '#504945',
      '--color-bg-hover': '#504945',
      '--color-bg-active': '#4a4537',
      '--color-bg-sidebar': '#3c3836',
      '--color-bg-input': '#3c3836',

      '--color-border': '#504945',
      '--color-border-active': '#d79921',

      '--color-text-primary': '#ebdbb2',
      '--color-text-secondary': '#a89984',
      '--color-text-tertiary': '#928374',
      '--color-text-inverse': '#282828',

      '--color-accent': '#d79921',
      '--color-accent-hover': '#fabd2f',
      '--color-accent-light': '#4a4537',
      '--color-accent-text': '#fabd2f',

      '--color-success': '#98971a',
      '--color-success-light': '#3d3a1e',
      '--color-success-text': '#b8bb26',
      '--color-error': '#cc241d',
      '--color-error-light': '#3c2020',
      '--color-error-text': '#fb4934',
      '--color-warning': '#d65d0e',
      '--color-warning-light': '#3c2c1e',
      '--color-warning-text': '#fe8019',

      '--color-badge-blue': '#2e3b3e',
      '--color-badge-blue-text': '#83a598',
      '--color-badge-green': '#2e3a20',
      '--color-badge-green-text': '#b8bb26',
      '--color-badge-purple': '#3c2e3c',
      '--color-badge-purple-text': '#d3869b',
      '--color-badge-orange': '#3c2c1e',
      '--color-badge-orange-text': '#fe8019',
    },
  },
  {
    id: 'gruvbox-light',
    name: 'Gruvbox Light',
    description: 'Warm retro light theme',
    preview: {
      sidebar: '#ebdbb2',
      bg: '#fbf1c7',
      card: '#ebdbb2',
      accent: '#b57614',
      text: '#3c3836',
    },
    vars: {
      '--color-bg-primary': '#fbf1c7',
      '--color-bg-secondary': '#ebdbb2',
      '--color-bg-tertiary': '#d5c4a1',
      '--color-bg-hover': '#d5c4a1',
      '--color-bg-active': '#d5c4a1',
      '--color-bg-sidebar': '#ebdbb2',
      '--color-bg-input': '#fbf1c7',

      '--color-border': '#bdae93',
      '--color-border-active': '#b57614',

      '--color-text-primary': '#3c3836',
      '--color-text-secondary': '#665c54',
      '--color-text-tertiary': '#7c6f64',
      '--color-text-inverse': '#fbf1c7',

      '--color-accent': '#b57614',
      '--color-accent-hover': '#d79921',
      '--color-accent-light': '#e8d8b0',
      '--color-accent-text': '#b57614',

      '--color-success': '#79740e',
      '--color-success-light': '#e8edc8',
      '--color-success-text': '#79740e',
      '--color-error': '#9d0006',
      '--color-error-light': '#ecd8d8',
      '--color-error-text': '#9d0006',
      '--color-warning': '#af3a03',
      '--color-warning-light': '#ecdcc8',
      '--color-warning-text': '#af3a03',

      '--color-badge-blue': '#c8d8d8',
      '--color-badge-blue-text': '#076678',
      '--color-badge-green': '#d8e8c8',
      '--color-badge-green-text': '#79740e',
      '--color-badge-purple': '#dcc8d8',
      '--color-badge-purple-text': '#8f3f71',
      '--color-badge-orange': '#ecdcc8',
      '--color-badge-orange-text': '#af3a03',
    },
  },
];

export function getThemeById(id: string): ThemeDefinition {
  return themes.find((t) => t.id === id) ?? themes[0];
}

export function applyTheme(theme: ThemeDefinition) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
}
