import { z } from 'zod';
import {
  lessonSchema,
  classGroupSchema,
  vocabularyItemSchema,
  sentenceItemSchema,
  dialogSchema,
  dialogTurnSchema,
  grammarPatternSchema,
  writingPromptSchema,
  verbSchema,
  verbConjugationSetSchema,
  verbConjugationFormSchema,
  lessonVerbSchema,
  sentenceVerbSchema,
} from './contentPack';

/**
 * A lesson pack contains a single lesson with all its content.
 * The lesson's moduleId will be overridden on import to place it
 * into the target module.
 */
export const lessonPackSchema = z.object({
  lesson: lessonSchema,
  classGroups: z.array(classGroupSchema).default([]),
  vocabulary: z.array(vocabularyItemSchema).default([]),
  sentences: z.array(sentenceItemSchema).default([]),
  dialogs: z.array(dialogSchema).default([]),
  dialogTurns: z.array(dialogTurnSchema).default([]),
  grammarPatterns: z.array(grammarPatternSchema).default([]),
  writingPrompts: z.array(writingPromptSchema).default([]),
  verbs: z.array(verbSchema).default([]),
  verbConjugationSets: z.array(verbConjugationSetSchema).default([]),
  verbConjugationForms: z.array(verbConjugationFormSchema).default([]),
  lessonVerbs: z.array(lessonVerbSchema).default([]),
  sentenceVerbs: z.array(sentenceVerbSchema).default([]),
});

export type LessonPack = z.infer<typeof lessonPackSchema>;
