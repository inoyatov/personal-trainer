/** IPC channel name constants following domain:action pattern */
export const Channels = {
  // Content
  CONTENT_GET_COURSES: 'content:getCourses',
  CONTENT_GET_MODULES: 'content:getModules',
  CONTENT_GET_LESSONS: 'content:getLessons',
  CONTENT_GET_LESSON_CONTENT: 'content:getLessonContent',
  CONTENT_GET_VOCABULARY: 'content:getVocabulary',
  CONTENT_GET_SENTENCES: 'content:getSentences',
  CONTENT_GET_DIALOGS: 'content:getDialogs',
  CONTENT_GET_DIALOG_TURNS: 'content:getDialogTurns',
  CONTENT_GET_GRAMMAR_PATTERNS: 'content:getGrammarPatterns',
  CONTENT_DELETE_COURSE: 'content:deleteCourse',
  CONTENT_DELETE_MODULE: 'content:deleteModule',
  CONTENT_DELETE_LESSON: 'content:deleteLesson',

  // Session
  SESSION_CREATE: 'session:create',
  SESSION_GET: 'session:get',
  SESSION_SUBMIT_ANSWER: 'session:submitAnswer',
  SESSION_END: 'session:end',
  SESSION_GET_ANSWERS: 'session:getAnswers',
  SESSION_GET_STATS: 'session:getStats',

  // Exercise
  EXERCISE_CREATE_INSTANCE: 'exercise:createInstance',
  EXERCISE_GET_INSTANCE: 'exercise:getInstance',

  // Review
  REVIEW_GET_DUE_ITEMS: 'review:getDueItems',
  REVIEW_GET_STATE: 'review:getState',
  REVIEW_UPDATE_STATE: 'review:updateState',
  REVIEW_GET_ALL_STATES: 'review:getAllStates',
  REVIEW_GET_EXERCISES: 'review:getExercises',

  // Writing
  WRITING_GET_PROMPTS: 'writing:getPrompts',
  WRITING_GET_PROMPT: 'writing:getPrompt',
  WRITING_SUBMIT: 'writing:submit',
  WRITING_GET_SUBMISSIONS: 'writing:getSubmissions',

  // Progress
  PROGRESS_GET_LESSON: 'progress:getLesson',
  PROGRESS_GET_ALL: 'progress:getAll',
  PROGRESS_UPDATE_LESSON: 'progress:updateLesson',

  // Dashboard
  DASHBOARD_GET_STATS: 'dashboard:getStats',
  DASHBOARD_GET_RECENT_SESSIONS: 'dashboard:getRecentSessions',

  // Import/Export
  IMPORT_CONTENT_PACK: 'import:contentPack',
  IMPORT_LESSON: 'import:lesson',
  EXPORT_CONTENT_PACK: 'export:contentPack',
} as const;

export type Channel = (typeof Channels)[keyof typeof Channels];
