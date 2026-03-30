/**
 * Unified Session Builder — PRD v4.3, v4.3.1.
 *
 * Composes scoring engine, item pool, cold start, adaptation, and exercise
 * generators into a single session-building pipeline.
 */

import { randomUUID } from 'node:crypto';
import type { ScoredItem } from '../scheduler/scoringEngine';
import { buildItemPool, type PoolBuilderDeps } from './itemPoolBuilder';
import { getColdStartDistribution } from './coldStartPolicy';
import { computeAdaptation, type AnswerSignal } from './adaptationPolicy';
import { createLessonFrontierService } from './lessonFrontier';
import type { CourseRepository } from '../../db/repositories/courseRepository';
import type { ContentRepository } from '../../db/repositories/contentRepository';
import type { ReviewRepository } from '../../db/repositories/reviewRepository';
import type { SessionRepository } from '../../db/repositories/sessionRepository';
import type { VerbRepository } from '../../db/repositories/verbRepository';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UnifiedSessionConfig {
  userId: string;
  courseId: string;
  mode: 'unified-learning' | 'conjugation-practice';
  maxItems?: number;
  /** Recent answers from the current session (for mid-session adaptation) */
  recentAnswers?: AnswerSignal[];
}

export interface UnifiedExercise {
  id: string;
  exerciseType: string;
  sourceEntityType: string;
  sourceEntityId: string;
  renderedPrompt: string;
  correctAnswer: string;
  sentenceTranslation?: string;
  targetWord?: string;
  options?: string[];
  correctIndex?: number;
  /** Extra data depending on exercise type */
  metadata: Record<string, unknown>;
}

export interface UnifiedSessionPlan {
  exercises: UnifiedExercise[];
  sessionMeta: {
    mode: string;
    courseId: string;
    distribution: Record<string, number>;
    coldStartPhase: 'early' | 'mid' | 'full';
    frontierLessonId: string | null;
    adaptationApplied: boolean;
  };
}

export interface UnifiedSessionBuilderDeps {
  courseRepo: CourseRepository;
  contentRepo: ContentRepository;
  reviewRepo: ReviewRepository;
  sessionRepo: SessionRepository;
  verbRepo: VerbRepository;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function shuffleOptions(correct: string, distractors: string[]): { options: string[]; correctIndex: number } {
  const all = shuffle([correct, ...distractors]);
  return { options: all, correctIndex: all.indexOf(correct) };
}

// ---------------------------------------------------------------------------
// Exercise generators (lightweight, inline)
// ---------------------------------------------------------------------------

function makeVocabMCExercise(
  item: ScoredItem,
  vocabItem: { lemma: string; translation: string; displayText: string },
  distractors: string[],
): UnifiedExercise {
  const { options, correctIndex } = shuffleOptions(vocabItem.translation, distractors);
  return {
    id: randomUUID(),
    exerciseType: 'translation-choice',
    sourceEntityType: 'vocabulary',
    sourceEntityId: item.entityId,
    renderedPrompt: vocabItem.displayText,
    correctAnswer: vocabItem.translation,
    options,
    correctIndex,
    metadata: { lemma: vocabItem.lemma },
  };
}

function makeVocabTypedExercise(
  item: ScoredItem,
  vocabItem: { lemma: string; translation: string; displayText: string },
): UnifiedExercise {
  return {
    id: randomUUID(),
    exerciseType: 'typed-gap-fill',
    sourceEntityType: 'vocabulary',
    sourceEntityId: item.entityId,
    renderedPrompt: `Translate: "${vocabItem.translation}"`,
    correctAnswer: vocabItem.lemma,
    metadata: { displayText: vocabItem.displayText },
  };
}

function makeSentenceGapFillExercise(
  item: ScoredItem,
  sentence: { text: string; translation: string },
): UnifiedExercise {
  // Simple word-removal gap fill
  const words = sentence.text.split(/\s+/);
  if (words.length < 3) {
    return {
      id: randomUUID(),
      exerciseType: 'word-order',
      sourceEntityType: 'sentence',
      sourceEntityId: item.entityId,
      renderedPrompt: sentence.translation,
      correctAnswer: sentence.text,
      sentenceTranslation: sentence.translation,
      metadata: { tokens: shuffle(words) },
    };
  }

  // Pick a content word to blank (skip first/last for better context)
  const targetIdx = 1 + Math.floor(Math.random() * (words.length - 2));
  const targetWord = words[targetIdx];
  const blanked = words.map((w, i) => (i === targetIdx ? '___' : w)).join(' ');

  return {
    id: randomUUID(),
    exerciseType: 'typed-gap-fill',
    sourceEntityType: 'sentence',
    sourceEntityId: item.entityId,
    renderedPrompt: blanked,
    correctAnswer: targetWord,
    sentenceTranslation: sentence.translation,
    targetWord,
    metadata: { fullText: sentence.text },
  };
}

function makeConjugationExercise(
  item: ScoredItem,
  verb: { infinitive: string; translation: string },
  pronoun: string,
  correctForm: string,
  allForms: Record<string, string>,
): UnifiedExercise {
  const PRONOUN_LABELS: Record<string, string> = {
    IK: 'ik', JIJ: 'jij', U: 'u', HIJ: 'hij', ZIJ_SG: 'zij',
    HET: 'het', WIJ: 'wij', JULLIE: 'jullie', ZIJ_PL: 'zij (pl)',
  };
  const label = PRONOUN_LABELS[pronoun] ?? pronoun.toLowerCase();
  return {
    id: randomUUID(),
    exerciseType: 'conjugation-typed',
    sourceEntityType: 'conjugation',
    sourceEntityId: item.entityId,
    renderedPrompt: `Conjugate "${verb.infinitive}" for "${label}"`,
    correctAnswer: correctForm,
    metadata: {
      verbInfinitive: verb.infinitive,
      verbTranslation: verb.translation,
      pronoun,
      allForms,
    },
  };
}

function makeDialogExercise(
  item: ScoredItem,
  turn: { text: string; translation: string; speaker: string },
): UnifiedExercise {
  return {
    id: randomUUID(),
    exerciseType: 'dialog-completion',
    sourceEntityType: 'dialog',
    sourceEntityId: item.entityId,
    renderedPrompt: `Complete the dialog (${turn.speaker}):`,
    correctAnswer: turn.text,
    sentenceTranslation: turn.translation,
    metadata: { speaker: turn.speaker },
  };
}

// ---------------------------------------------------------------------------
// Mastery-based exercise type selection
// ---------------------------------------------------------------------------

const RECOGNITION_STAGES = new Set(['new', 'seen']);

function shouldUseMC(item: ScoredItem, mcBoost: number): boolean {
  if (RECOGNITION_STAGES.has(item.isNew ? 'new' : '')) return true;
  // Base MC probability + adaptation boost
  const baseMCProb = item.isNew ? 1.0 : 0.3;
  return Math.random() < Math.min(1, baseMCProb + mcBoost);
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function createUnifiedSessionBuilder(deps: UnifiedSessionBuilderDeps) {
  const frontier = createLessonFrontierService(
    deps.courseRepo,
    deps.contentRepo,
    deps.reviewRepo,
  );

  const poolDeps: PoolBuilderDeps = {
    reviewRepo: deps.reviewRepo,
    sessionRepo: deps.sessionRepo,
  };

  return {
    buildSession(config: UnifiedSessionConfig): UnifiedSessionPlan {
      const maxItems = config.maxItems ?? 20;
      const now = new Date();

      // 1. Cold start distribution
      const sessionCount = deps.sessionRepo.getCompletedSessionCount(
        config.userId,
        config.courseId,
      );
      const distribution = getColdStartDistribution(sessionCount);
      const coldStartPhase =
        sessionCount < 3 ? 'early' : sessionCount < 10 ? 'mid' : 'full';

      // 2. Lesson frontier
      const frontierLessonId = frontier.getCurrentFrontierLesson(
        config.userId,
        config.courseId,
      );

      // 3. Build item pool
      const pool = buildItemPool(
        {
          userId: config.userId,
          courseId: config.courseId,
          lessonId: frontierLessonId ?? undefined,
          maxItems,
          targetDistribution: distribution,
          now,
        },
        poolDeps,
      );

      // 4. Adaptation
      const adaptation = computeAdaptation(config.recentAnswers ?? []);
      const adaptationApplied = adaptation.mcBoost !== 0 || adaptation.typingBoost !== 0;

      // 5. Generate exercises from pool items
      const exercises: UnifiedExercise[] = [];

      for (const item of pool) {
        const exercise = this.generateExerciseForItem(item, adaptation.mcBoost);
        if (exercise) exercises.push(exercise);
      }

      // 6. Shuffle exercise order
      const shuffled = shuffle(exercises);

      return {
        exercises: shuffled,
        sessionMeta: {
          mode: config.mode,
          courseId: config.courseId,
          distribution,
          coldStartPhase,
          frontierLessonId,
          adaptationApplied,
        },
      };
    },

    generateExerciseForItem(
      item: ScoredItem,
      mcBoost: number,
    ): UnifiedExercise | null {
      switch (item.entityType) {
        case 'vocabulary':
          return this.generateVocabExercise(item, mcBoost);
        case 'conjugation':
          return this.generateConjugationExercise(item);
        case 'sentence':
          return this.generateSentenceExercise(item);
        case 'dialog':
          return this.generateDialogExercise(item);
        default:
          return null;
      }
    },

    generateVocabExercise(item: ScoredItem, mcBoost: number): UnifiedExercise | null {
      const vocab = deps.contentRepo.getVocabularyById(item.entityId);
      if (!vocab) return null;

      if (item.isNew || shouldUseMC(item, mcBoost)) {
        // Get distractors from same lesson's vocab pool
        const classGroups = vocab.classGroupId
          ? deps.contentRepo.getVocabularyByClassGroup(vocab.classGroupId)
          : [];
        const distractors = classGroups
          .filter((v) => v.id !== item.entityId)
          .slice(0, 3)
          .map((v) => v.translation);

        if (distractors.length >= 2) {
          return makeVocabMCExercise(item, vocab, distractors);
        }
      }

      return makeVocabTypedExercise(item, vocab);
    },

    generateConjugationExercise(item: ScoredItem): UnifiedExercise | null {
      // entityId for conjugation items is formatted as "verbId:pronoun"
      const [verbId, pronoun] = item.entityId.split(':');
      if (!verbId || !pronoun) return null;

      const verb = deps.verbRepo.getVerbById(verbId);
      if (!verb) return null;

      const formsMap = deps.verbRepo.getAllFormsMap(verbId);
      const correctForm = formsMap[pronoun];
      if (!correctForm) return null;

      return makeConjugationExercise(item, verb, pronoun, correctForm, formsMap);
    },

    generateSentenceExercise(item: ScoredItem): UnifiedExercise | null {
      const sentence = deps.contentRepo.getSentenceById(item.entityId);
      if (!sentence) return null;
      return makeSentenceGapFillExercise(item, sentence);
    },

    generateDialogExercise(item: ScoredItem): UnifiedExercise | null {
      // entityId refers to a dialog ID — get its turns
      const dialog = deps.contentRepo.getDialogById(item.entityId);
      if (!dialog) return null;

      const turns = deps.contentRepo.getTurnsByDialog(item.entityId);
      if (turns.length === 0) return null;

      // Pick a random non-first turn as the target
      const targetIdx = turns.length > 1
        ? 1 + Math.floor(Math.random() * (turns.length - 1))
        : 0;
      const target = turns[targetIdx];

      return makeDialogExercise(item, target);
    },
  };
}

export type UnifiedSessionBuilder = ReturnType<typeof createUnifiedSessionBuilder>;
