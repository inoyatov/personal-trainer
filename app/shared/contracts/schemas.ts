import { z } from 'zod';

// --- Request Schemas ---

export const getModulesRequest = z.object({
  courseId: z.string().min(1),
});

export const getLessonsRequest = z.object({
  moduleId: z.string().min(1),
});

export const getLessonContentRequest = z.object({
  lessonId: z.string().min(1),
});

export const getVocabularyRequest = z.object({
  classGroupId: z.string().min(1),
});

export const getSentencesRequest = z.object({
  lessonId: z.string().min(1),
});

export const getDialogsRequest = z.object({
  lessonId: z.string().min(1),
});

export const getDialogTurnsRequest = z.object({
  dialogId: z.string().min(1),
});

export const getGrammarPatternsRequest = z.object({
  lessonId: z.string().min(1),
});

export const createSessionRequest = z.object({
  mode: z.enum([
    'learn',
    'practice',
    'review',
    'exam-simulation',
    'writing-lab',
    'unified-learning',
    'conjugation-practice',
  ]),
  sourceScope: z.string().optional(),
});

export const getSessionRequest = z.object({
  sessionId: z.string().min(1),
});

export const submitAnswerRequest = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  exerciseInstanceId: z.string().min(1),
  exerciseType: z.string().optional(),
  sourceEntityType: z.string().optional(),
  sourceEntityId: z.string().optional(),
  userAnswer: z.string(),
  isCorrect: z.boolean(),
  responseTimeMs: z.number().int().min(0),
  hintUsed: z.boolean().optional().default(false),
});

export const endSessionRequest = z.object({
  sessionId: z.string().min(1),
});

export const getSessionAnswersRequest = z.object({
  sessionId: z.string().min(1),
});

export const createExerciseInstanceRequest = z.object({
  id: z.string().min(1),
  sourceEntityType: z.string().min(1),
  sourceEntityId: z.string().min(1),
  exerciseType: z.string().min(1),
  renderedPrompt: z.string().min(1),
  correctAnswer: z.string().min(1),
  distractors: z.string().optional().default('[]'),
  metadata: z.string().optional().default('{}'),
});

export const getExerciseInstanceRequest = z.object({
  instanceId: z.string().min(1),
});

export const abandonSessionRequest = z.object({
  sessionId: z.string().min(1),
});

export const buildUnifiedSessionRequest = z.object({
  userId: z.string().optional().default('default'),
  courseId: z.string().min(1),
  mode: z.enum(['unified-learning', 'conjugation-practice']),
  maxItems: z.number().int().min(1).max(50).optional().default(20),
});

export const getDueItemsRequest = z.object({
  userId: z.string().optional().default('default'),
});

export const getReviewStateRequest = z.object({
  userId: z.string().optional().default('default'),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
});

export const updateReviewStateRequest = z.object({
  id: z.string().min(1),
  userId: z.string().optional().default('default'),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  stabilityScore: z.number().optional(),
  easeScore: z.number().optional(),
  dueAt: z.string().optional(),
  lastSeenAt: z.string().nullable().optional(),
  successCount: z.number().int().optional(),
  failCount: z.number().int().optional(),
  averageLatencyMs: z.number().optional(),
  currentStage: z
    .enum(['new', 'seen', 'recognized', 'recalled', 'stable', 'automated'])
    .optional(),
});

export const getAllReviewStatesRequest = z.object({
  userId: z.string().optional().default('default'),
});

export const getWritingPromptsRequest = z.object({
  lessonId: z.string().min(1),
});

export const getWritingPromptRequest = z.object({
  promptId: z.string().min(1),
});

export const submitWritingRequest = z.object({
  id: z.string().min(1),
  promptId: z.string().min(1),
  userId: z.string().optional().default('default'),
  text: z.string().min(1),
  score: z.number().nullable().optional(),
  feedbackJson: z.string().optional().default('{}'),
});

export const getWritingSubmissionsRequest = z.object({
  userId: z.string().optional().default('default'),
});

export const getLessonProgressRequest = z.object({
  userId: z.string().optional().default('default'),
  lessonId: z.string().min(1),
});

export const getAllProgressRequest = z.object({
  userId: z.string().optional().default('default'),
});

export const getVocabCoverageRequest = z.object({
  userId: z.string().optional().default('default'),
  courseId: z.string().min(1),
});

export const getLessonUnlockStatusRequest = z.object({
  userId: z.string().optional().default('default'),
  courseId: z.string().min(1),
});

export const updateLessonProgressRequest = z.object({
  id: z.string().min(1),
  userId: z.string().optional().default('default'),
  lessonId: z.string().min(1),
  completedAt: z.string().nullable().optional(),
  vocabularyMastered: z.number().int().optional(),
  vocabularyTotal: z.number().int().optional(),
  writingAttempted: z.boolean().optional(),
  grammarScore: z.number().nullable().optional(),
});
