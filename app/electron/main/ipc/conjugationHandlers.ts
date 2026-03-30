import { ipcMain } from 'electron';
import { randomUUID } from 'node:crypto';
import { Channels } from '../../../shared/contracts/channels';
import type { VerbRepository } from '../../../backend/db/repositories/verbRepository';
import type { ContentRepository } from '../../../backend/db/repositories/contentRepository';
import { generateConjugationTypedBatch } from '../../../backend/domain/exercise-generation/conjugationTypedGenerator';
import { generateConjugationInSentenceBatch } from '../../../backend/domain/exercise-generation/conjugationInSentenceGenerator';
import {
  classifyConjugationError,
  isConjugationAccepted,
  conjugationFeedbackMessage,
} from '../../../backend/domain/evaluation/conjugationChecker';

export function registerConjugationHandlers(
  verbRepo: VerbRepository,
  contentRepo: ContentRepository,
) {
  // Get verbs linked to a lesson with their conjugation forms
  ipcMain.handle(Channels.CONJUGATION_GET_LESSON_VERBS, (_event, data: any) => {
    const { lessonId } = data;
    const lessonVerbs = verbRepo.getVerbsByLesson(lessonId);

    return lessonVerbs.map((lv) => {
      const formsMap = lv.verb ? verbRepo.getAllFormsMap(lv.verb.id) : {};
      return {
        ...lv,
        formsMap,
      };
    });
  });

  // Get all conjugation forms for a verb
  ipcMain.handle(Channels.CONJUGATION_GET_FORMS, (_event, data: any) => {
    const { verbId } = data;
    return verbRepo.getAllFormsMap(verbId);
  });

  // Generate conjugation exercises for a lesson
  ipcMain.handle(Channels.CONJUGATION_GENERATE_EXERCISES, (_event, data: any) => {
    const { lessonId, maxExercises = 10 } = data;
    const lessonVerbs = verbRepo.getVerbsByLesson(lessonId);

    // Only target and focus_irregular verbs get drilled
    const drillVerbs = lessonVerbs.filter(
      (lv) => lv.role === 'target' || lv.role === 'focus_irregular',
    );

    const verbInputs = drillVerbs
      .filter((lv) => lv.verb)
      .map((lv) => ({
        id: lv.verb!.id,
        infinitive: lv.verb!.infinitive,
        translation: lv.verb!.translation,
      }));

    const formsMaps: Record<string, Record<string, string>> = {};
    for (const v of verbInputs) {
      formsMaps[v.id] = verbRepo.getAllFormsMap(v.id);
    }

    // Generate typed exercises (first half)
    const typedCount = Math.ceil(maxExercises / 2);
    const typedExercises = generateConjugationTypedBatch(
      verbInputs,
      formsMaps,
      typedCount,
    );

    // Generate sentence-based exercises (second half)
    const sentenceInputs: any[] = [];
    for (const v of verbInputs) {
      const sentenceVerbs = verbRepo.getVerbSentences(v.id);
      for (const sv of sentenceVerbs) {
        const sentence = contentRepo.getSentenceById(sv.sentenceId);
        if (sentence) {
          // Determine pronoun from forms map by matching surface form
          let matchedPronoun = 'IK';
          const forms = formsMaps[v.id];
          for (const [pronoun, form] of Object.entries(forms)) {
            if (form.toLowerCase() === sv.surfaceForm.toLowerCase()) {
              matchedPronoun = pronoun;
              break;
            }
          }

          sentenceInputs.push({
            sentenceId: sentence.id,
            sentenceText: sentence.text,
            sentenceTranslation: sentence.translation,
            verbId: v.id,
            verbInfinitive: v.infinitive,
            surfaceForm: sv.surfaceForm,
            pronoun: matchedPronoun,
          });
        }
      }
    }

    const sentenceCount = maxExercises - typedExercises.length;
    const sentenceExercises = generateConjugationInSentenceBatch(
      sentenceInputs,
      formsMaps,
      sentenceCount,
    );

    return [...typedExercises, ...sentenceExercises];
  });

  // Submit a conjugation answer — classify error, record attempt, update review
  ipcMain.handle(Channels.CONJUGATION_SUBMIT_ANSWER, (_event, data: any) => {
    const {
      userId = 'default',
      verbId,
      pronoun,
      tense = 'present',
      userAnswer,
      expectedForm,
      responseTimeMs,
      hintUsed = false,
    } = data;

    // Get all forms for error classification
    const allForms = verbRepo.getAllFormsMap(verbId, tense);

    // Classify
    const result = classifyConjugationError(userAnswer, expectedForm, allForms, pronoun);
    const accepted = isConjugationAccepted(result.errorType);
    const feedbackMsg = conjugationFeedbackMessage(result.errorType, expectedForm, pronoun);

    // Record attempt
    verbRepo.insertConjugationAttempt({
      id: randomUUID(),
      userId,
      verbId,
      pronoun,
      tense,
      expectedForm,
      userAnswer,
      correct: accepted,
      errorType: result.errorType,
      responseTimeMs,
      hintUsed,
    });

    // Update review state
    const reviewState = verbRepo.getConjugationReviewState(userId, verbId, pronoun, tense);
    const successCount = (reviewState?.successCount ?? 0) + (accepted ? 1 : 0);
    const failCount = (reviewState?.failCount ?? 0) + (accepted ? 0 : 1);

    // Simple interval: correct = longer, wrong = shorter
    const baseMinutes = accepted ? 60 : 5;
    const dueAt = new Date(Date.now() + baseMinutes * 60 * 1000).toISOString();

    verbRepo.upsertConjugationReviewState({
      id: reviewState?.id ?? randomUUID(),
      userId,
      verbId,
      pronoun,
      tense,
      stage: accepted && successCount >= 3 ? 'recognized' : accepted ? 'seen' : 'new',
      successCount,
      failCount,
      dueAt,
      lastSeenAt: new Date().toISOString(),
    });

    return {
      errorType: result.errorType,
      accepted,
      feedbackMessage: feedbackMsg,
      correctAnswer: expectedForm,
    };
  });

  // Get due conjugation review items
  ipcMain.handle(Channels.CONJUGATION_GET_DUE_REVIEWS, (_event, data: any) => {
    const { userId = 'default' } = data ?? {};
    return verbRepo.getDueConjugationReviews(userId);
  });

  // Get conjugation practice stats
  ipcMain.handle(Channels.CONJUGATION_GET_STATS, (_event, data: any) => {
    const { userId = 'default' } = data ?? {};
    const attempts = verbRepo.getConjugationAttempts(userId);

    const verbsPracticed = new Set(attempts.map((a) => a.verbId)).size;
    const totalAttempts = attempts.length;
    const correctCount = attempts.filter((a) => a.correct).length;
    const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

    // Find weak pronouns (< 50% accuracy)
    const pronounStats: Record<string, { correct: number; total: number }> = {};
    for (const a of attempts) {
      if (!pronounStats[a.pronoun]) pronounStats[a.pronoun] = { correct: 0, total: 0 };
      pronounStats[a.pronoun].total++;
      if (a.correct) pronounStats[a.pronoun].correct++;
    }

    const weakPronouns = Object.entries(pronounStats)
      .filter(([_, s]) => s.total >= 3 && s.correct / s.total < 0.5)
      .map(([pronoun]) => pronoun);

    // Find common error types
    const errorCounts: Record<string, number> = {};
    for (const a of attempts) {
      if (a.errorType !== 'CORRECT') {
        errorCounts[a.errorType] = (errorCounts[a.errorType] ?? 0) + 1;
      }
    }

    return {
      verbsPracticed,
      totalAttempts,
      accuracy,
      weakPronouns,
      errorCounts,
    };
  });
}
