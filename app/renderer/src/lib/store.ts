import { create } from 'zustand';
import { getThemeById, applyTheme } from './themes';

const THEME_STORAGE_KEY = 'personal-trainer-theme';
const GAP_MODE_KEY = 'personal-trainer-gap-mode';

function loadSavedThemeId(): string {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) ?? 'default-light';
  } catch {
    return 'default-light';
  }
}

function loadSavedGapMode(): 'MASKED' | 'LENGTH_HINT' {
  try {
    const saved = localStorage.getItem(GAP_MODE_KEY);
    return saved === 'LENGTH_HINT' ? 'LENGTH_HINT' : 'MASKED';
  } catch {
    return 'MASKED';
  }
}

interface AppState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  activeCourseId: string | null;
  setActiveCourseId: (id: string | null) => void;

  activeModuleId: string | null;
  setActiveModuleId: (id: string | null) => void;

  activeLessonId: string | null;
  setActiveLessonId: (id: string | null) => void;

  activeClassGroupId: string | null;
  setActiveClassGroupId: (id: string | null) => void;

  themeId: string;
  setTheme: (id: string) => void;

  gapMode: 'MASKED' | 'LENGTH_HINT';
  setGapMode: (mode: 'MASKED' | 'LENGTH_HINT') => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  activeCourseId: null,
  setActiveCourseId: (id) => set({ activeCourseId: id }),

  activeModuleId: null,
  setActiveModuleId: (id) => set({ activeModuleId: id }),

  activeLessonId: null,
  setActiveLessonId: (id) => set({ activeLessonId: id }),

  activeClassGroupId: null,
  setActiveClassGroupId: (id) => set({ activeClassGroupId: id }),

  themeId: loadSavedThemeId(),
  setTheme: (id) => {
    const theme = getThemeById(id);
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {}
    set({ themeId: id });
  },

  gapMode: loadSavedGapMode(),
  setGapMode: (mode) => {
    try {
      localStorage.setItem(GAP_MODE_KEY, mode);
    } catch {}
    set({ gapMode: mode });
  },
}));
