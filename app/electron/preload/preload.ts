import { contextBridge, ipcRenderer } from 'electron';

const api = {
  content: {
    getCourses: () => ipcRenderer.invoke('content:getCourses'),
    getModules: (courseId: string) =>
      ipcRenderer.invoke('content:getModules', { courseId }),
    getLessons: (moduleId: string) =>
      ipcRenderer.invoke('content:getLessons', { moduleId }),
    getLessonContent: (lessonId: string) =>
      ipcRenderer.invoke('content:getLessonContent', { lessonId }),
    getVocabulary: (classGroupId: string) =>
      ipcRenderer.invoke('content:getVocabulary', { classGroupId }),
    getSentences: (lessonId: string) =>
      ipcRenderer.invoke('content:getSentences', { lessonId }),
    getDialogs: (lessonId: string) =>
      ipcRenderer.invoke('content:getDialogs', { lessonId }),
    getDialogTurns: (dialogId: string) =>
      ipcRenderer.invoke('content:getDialogTurns', { dialogId }),
    getGrammarPatterns: (lessonId: string) =>
      ipcRenderer.invoke('content:getGrammarPatterns', { lessonId }),
  },

  session: {
    create: (data: { mode: string; sourceScope?: string }) =>
      ipcRenderer.invoke('session:create', data),
    get: (sessionId: string) =>
      ipcRenderer.invoke('session:get', { sessionId }),
    submitAnswer: (data: {
      id: string;
      sessionId: string;
      exerciseInstanceId: string;
      userAnswer: string;
      isCorrect: boolean;
      responseTimeMs: number;
      hintUsed?: boolean;
    }) => ipcRenderer.invoke('session:submitAnswer', data),
    end: (sessionId: string) =>
      ipcRenderer.invoke('session:end', { sessionId }),
    getAnswers: (sessionId: string) =>
      ipcRenderer.invoke('session:getAnswers', { sessionId }),
    getStats: (sessionId: string) =>
      ipcRenderer.invoke('session:getStats', { sessionId }),
  },

  exercise: {
    createInstance: (data: {
      id: string;
      sourceEntityType: string;
      sourceEntityId: string;
      exerciseType: string;
      renderedPrompt: string;
      correctAnswer: string;
      distractors?: string;
      metadata?: string;
    }) => ipcRenderer.invoke('exercise:createInstance', data),
    getInstance: (instanceId: string) =>
      ipcRenderer.invoke('exercise:getInstance', { instanceId }),
  },

  review: {
    getDueItems: (userId?: string) =>
      ipcRenderer.invoke('review:getDueItems', { userId }),
    getState: (entityType: string, entityId: string, userId?: string) =>
      ipcRenderer.invoke('review:getState', { entityType, entityId, userId }),
    updateState: (data: {
      id: string;
      entityType: string;
      entityId: string;
      userId?: string;
      stabilityScore?: number;
      easeScore?: number;
      dueAt?: string;
      lastSeenAt?: string | null;
      successCount?: number;
      failCount?: number;
      averageLatencyMs?: number;
      currentStage?: string;
    }) => ipcRenderer.invoke('review:updateState', data),
    getAllStates: (userId?: string) =>
      ipcRenderer.invoke('review:getAllStates', { userId }),
    getExercises: (userId?: string) =>
      ipcRenderer.invoke('review:getExercises', { userId }),
  },

  writing: {
    getPrompts: (lessonId: string) =>
      ipcRenderer.invoke('writing:getPrompts', { lessonId }),
    getPrompt: (promptId: string) =>
      ipcRenderer.invoke('writing:getPrompt', { promptId }),
    submit: (data: {
      id: string;
      promptId: string;
      userId?: string;
      text: string;
      score?: number | null;
      feedbackJson?: string;
    }) => ipcRenderer.invoke('writing:submit', data),
    getSubmissions: (userId?: string) =>
      ipcRenderer.invoke('writing:getSubmissions', { userId }),
  },

  progress: {
    getLesson: (lessonId: string, userId?: string) =>
      ipcRenderer.invoke('progress:getLesson', { lessonId, userId }),
    getAll: (userId?: string) =>
      ipcRenderer.invoke('progress:getAll', { userId }),
    updateLesson: (data: {
      id: string;
      lessonId: string;
      userId?: string;
      completedAt?: string | null;
      vocabularyMastered?: number;
      vocabularyTotal?: number;
      writingAttempted?: boolean;
      grammarScore?: number | null;
    }) => ipcRenderer.invoke('progress:updateLesson', data),
  },
  dashboard: {
    getStats: () => ipcRenderer.invoke('dashboard:getStats'),
    getRecentSessions: () =>
      ipcRenderer.invoke('dashboard:getRecentSessions'),
  },
  importExport: {
    importPack: () => ipcRenderer.invoke('import:contentPack'),
    importLesson: (moduleId: string) =>
      ipcRenderer.invoke('import:lesson', { moduleId }),
    exportPack: (type: 'course' | 'lesson', id: string) =>
      ipcRenderer.invoke('export:contentPack', { type, id }),
  },
} as const;

contextBridge.exposeInMainWorld('api', api);

export type ElectronAPI = typeof api;
