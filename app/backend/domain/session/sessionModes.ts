export type SessionModeId = 'low-energy' | 'normal' | 'deep';

export interface SessionModeConfig {
  id: SessionModeId;
  name: string;
  description: string;
  estimatedMinutes: string;
  maxExercises: number;
  newItemRatio: number; // 0-1, fraction of exercises that can be new items
  exerciseTypes: string[];
  hintsDefault: boolean;
}

export const SESSION_MODES: Record<SessionModeId, SessionModeConfig> = {
  'low-energy': {
    id: 'low-energy',
    name: 'Low Energy',
    description: 'Short and easy — mostly recognition, no new words',
    estimatedMinutes: '5-10',
    maxExercises: 8,
    newItemRatio: 0,
    exerciseTypes: ['multiple-choice-gap-fill'],
    hintsDefault: true,
  },
  normal: {
    id: 'normal',
    name: 'Normal',
    description: 'Balanced mix of recognition, recall, and dialog',
    estimatedMinutes: '15-20',
    maxExercises: 15,
    newItemRatio: 0.3,
    exerciseTypes: ['multiple-choice-gap-fill', 'typed-gap-fill', 'dialog-completion'],
    hintsDefault: false,
  },
  deep: {
    id: 'deep',
    name: 'Deep',
    description: 'Full practice including writing — for focused study',
    estimatedMinutes: '30+',
    maxExercises: 25,
    newItemRatio: 0.3,
    exerciseTypes: [
      'multiple-choice-gap-fill',
      'typed-gap-fill',
      'dialog-completion',
      'word-order',
      'guided-writing',
    ],
    hintsDefault: false,
  },
};

export function getSessionMode(id: SessionModeId): SessionModeConfig {
  return SESSION_MODES[id] ?? SESSION_MODES.normal;
}
