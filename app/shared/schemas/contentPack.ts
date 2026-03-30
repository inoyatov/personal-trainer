import { z } from 'zod';

// --- Entity schemas ---

export const courseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  targetLevel: z.string().min(1),
  languageCode: z.string().default('nl'),
  version: z.string().default('1.0'),
});

export const moduleSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1),
  title: z.string().min(1),
  orderIndex: z.number().int().min(0),
});

export const lessonSchema = z.object({
  id: z.string().min(1),
  moduleId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  orderIndex: z.number().int().min(0),
  estimatedMinutes: z.number().int().min(1).default(15),
});

export const classGroupSchema = z.object({
  id: z.string().min(1),
  lessonId: z.string().min(1),
  type: z.enum(['vocabulary', 'grammar', 'dialog', 'writing']),
  title: z.string().min(1),
  orderIndex: z.number().int().min(0),
});

export const vocabularyItemSchema = z.object({
  id: z.string().min(1),
  lemma: z.string().min(1),
  displayText: z.string().min(1),
  article: z.string().nullable().default(null),
  partOfSpeech: z.string().default('noun'),
  translation: z.string().min(1),
  transliteration: z.string().nullable().default(null),
  tags: z.string().default('[]'),
  difficulty: z.number().default(1.0),
  classGroupId: z.string().nullable().default(null),
});

export const sentenceItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  translation: z.string().min(1),
  lessonId: z.string().min(1),
  classGroupId: z.string().nullable().default(null),
  targetVocabularyIds: z.string().default('[]'),
  targetGrammarPatternIds: z.string().default('[]'),
  audioPath: z.string().nullable().default(null),
});

export const dialogSchema = z.object({
  id: z.string().min(1),
  lessonId: z.string().min(1),
  title: z.string().min(1),
  scenario: z.string().default(''),
  classGroupId: z.string().nullable().default(null),
});

export const dialogTurnSchema = z.object({
  id: z.string().min(1),
  dialogId: z.string().min(1),
  speaker: z.string().min(1),
  text: z.string().min(1),
  translation: z.string().default(''),
  orderIndex: z.number().int().min(0),
});

export const grammarPatternSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(''),
  explanationMarkdown: z.string().default(''),
  examples: z.string().default('[]'),
  lessonId: z.string().nullable().default(null),
});

export const writingPromptSchema = z.object({
  id: z.string().min(1),
  lessonId: z.string().min(1),
  promptText: z.string().min(1),
  targetPatterns: z.string().default('[]'),
  expectedKeywords: z.string().default('[]'),
  difficulty: z.number().default(1.0),
});

// --- Content pack schema ---

export const contentPackSchema = z.object({
  manifest: z.object({
    name: z.string().min(1),
    version: z.string().default('1.0'),
    description: z.string().default(''),
    author: z.string().default(''),
    createdAt: z.string().default(''),
  }),
  courses: z.array(courseSchema).default([]),
  modules: z.array(moduleSchema).default([]),
  lessons: z.array(lessonSchema).default([]),
  classGroups: z.array(classGroupSchema).default([]),
  vocabulary: z.array(vocabularyItemSchema).default([]),
  sentences: z.array(sentenceItemSchema).default([]),
  dialogs: z.array(dialogSchema).default([]),
  dialogTurns: z.array(dialogTurnSchema).default([]),
  grammarPatterns: z.array(grammarPatternSchema).default([]),
  writingPrompts: z.array(writingPromptSchema).default([]),
});

export type ContentPack = z.infer<typeof contentPackSchema>;
