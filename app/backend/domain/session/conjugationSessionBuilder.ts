/**
 * Conjugation Session Builder — Milestone 10.
 *
 * Builds a conjugation practice session with:
 * - 70% due conjugation reviews (most overdue first)
 * - 20% weak pronoun drills (<50% accuracy)
 * - 10% new verb exposure (unreviewed combos)
 *
 * Exercise type split: 70% conjugation-typed, 30% conjugation-in-sentence.
 *
 * MISSING_T adaptation: if >20% of recent attempts are MISSING_T,
 * boost jij/hij pronoun exercises by duplicating them in the due bucket.
 */

import type { VerbRepository } from '../../db/repositories/verbRepository';
import type { ContentRepository } from '../../db/repositories/contentRepository';
import {
  generateConjugationTyped,
  type ConjugationTypedExercise,
  type VerbInput,
} from '../exercise-generation/conjugationTypedGenerator';
import {
  generateConjugationInSentence,
  type ConjugationInSentenceExercise,
  type SentenceVerbInput,
} from '../exercise-generation/conjugationInSentenceGenerator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConjugationSessionConfig {
  userId: string;
  lessonId: string;
  maxExercises?: number; // default 20
}

export interface ConjugationSessionDeps {
  verbRepo: VerbRepository;
  contentRepo: ContentRepository;
}

export type ConjugationExercise = ConjugationTypedExercise | ConjugationInSentenceExercise;

interface CandidateItem {
  verbId: string;
  pronoun: string;
  bucket: 'due' | 'weak' | 'new';
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildConjugationSession(
  config: ConjugationSessionConfig,
  deps: ConjugationSessionDeps,
): ConjugationExercise[] {
  const { userId, lessonId, maxExercises = 20 } = config;
  const { verbRepo, contentRepo } = deps;

  // Get lesson verbs (only target and focus_irregular get drilled)
  const lessonVerbs = verbRepo.getVerbsByLesson(lessonId);
  const drillVerbs = lessonVerbs.filter(
    (lv) => lv.verb && (lv.role === 'target' || lv.role === 'focus_irregular'),
  );

  if (drillVerbs.length === 0) return [];

  const lessonVerbIds = new Set(drillVerbs.map((lv) => lv.verb!.id));

  // Build verb inputs and forms maps
  const verbInputs: VerbInput[] = drillVerbs.map((lv) => ({
    id: lv.verb!.id,
    infinitive: lv.verb!.infinitive,
    translation: lv.verb!.translation,
  }));

  const verbInputMap = new Map<string, VerbInput>();
  for (const v of verbInputs) {
    verbInputMap.set(v.id, v);
  }

  const formsMaps: Record<string, Record<string, string>> = {};
  for (const v of verbInputs) {
    formsMaps[v.id] = verbRepo.getAllFormsMap(v.id);
  }

  // Compute bucket sizes
  const dueCount = Math.round(maxExercises * 0.7);
  const weakCount = Math.round(maxExercises * 0.2);
  const newCount = maxExercises - dueCount - weakCount;

  // --- Bucket 1: Due conjugation reviews (70%) ---
  const allDue = verbRepo.getDueConjugationReviews(userId);
  const lessonDue = allDue.filter((r) => lessonVerbIds.has(r.verbId));
  // Sort most overdue first (earliest dueAt)
  lessonDue.sort((a, b) => a.dueAt.localeCompare(b.dueAt));

  let dueItems: CandidateItem[] = lessonDue.slice(0, dueCount).map((r) => ({
    verbId: r.verbId,
    pronoun: r.pronoun,
    bucket: 'due' as const,
  }));

  // --- MISSING_T adaptation ---
  dueItems = applyMissingTAdaptation(dueItems, userId, verbRepo, lessonVerbIds, formsMaps);

  // --- Bucket 2: Weak pronoun drills (20%) ---
  const pronounStats = verbRepo.getWeakPronounStats(userId);
  const weakPronouns = pronounStats
    .filter((s) => s.total >= 3 && s.accuracy < 0.5)
    .map((s) => s.pronoun);

  const weakItems: CandidateItem[] = [];
  if (weakPronouns.length > 0) {
    for (const v of verbInputs) {
      for (const pronoun of weakPronouns) {
        if (weakItems.length >= weakCount) break;
        // Only add if form exists
        if (formsMaps[v.id]?.[pronoun]) {
          weakItems.push({ verbId: v.id, pronoun, bucket: 'weak' });
        }
      }
      if (weakItems.length >= weakCount) break;
    }
  }

  // --- Bucket 3: New verb exposure (10%) ---
  const newCombos = verbRepo.getNewVerbPronounCombos(lessonId, userId);
  // Filter to drill verbs only and combos that have forms
  const filteredNew = newCombos.filter(
    (c) => lessonVerbIds.has(c.verbId) && formsMaps[c.verbId]?.[c.pronoun],
  );
  // Shuffle for randomness
  shuffleArray(filteredNew);
  const newItems: CandidateItem[] = filteredNew.slice(0, newCount).map((c) => ({
    verbId: c.verbId,
    pronoun: c.pronoun,
    bucket: 'new' as const,
  }));

  // --- Backfill: redistribute unfilled slots to other buckets ---
  const totalFilled = dueItems.length + weakItems.length + newItems.length;
  if (totalFilled < maxExercises) {
    const remaining = maxExercises - totalFilled;

    // Try to fill from new combos first (most useful for cold start)
    const usedKeys = new Set(
      [...dueItems, ...weakItems, ...newItems].map((i) => `${i.verbId}::${i.pronoun}`),
    );
    const extraNew = filteredNew
      .filter((c) => !usedKeys.has(`${c.verbId}::${c.pronoun}`))
      .slice(0, remaining)
      .map((c) => ({ verbId: c.verbId, pronoun: c.pronoun, bucket: 'new' as const }));
    newItems.push(...extraNew);

    // If still short, generate all verb+pronoun combos from lesson verbs
    if (dueItems.length + weakItems.length + newItems.length < maxExercises) {
      const stillNeeded = maxExercises - dueItems.length - weakItems.length - newItems.length;
      const allCombos: CandidateItem[] = [];
      const usedKeys2 = new Set(
        [...dueItems, ...weakItems, ...newItems].map((i) => `${i.verbId}::${i.pronoun}`),
      );
      const pronouns = ['IK', 'JIJ', 'U', 'HIJ', 'ZIJ_SG', 'HET', 'WIJ', 'JULLIE', 'ZIJ_PL'];
      for (const v of verbInputs) {
        for (const p of pronouns) {
          const key = `${v.id}::${p}`;
          if (!usedKeys2.has(key) && formsMaps[v.id]?.[p]) {
            allCombos.push({ verbId: v.id, pronoun: p, bucket: 'new' });
          }
        }
      }
      shuffleArray(allCombos);
      newItems.push(...allCombos.slice(0, stillNeeded));
    }
  }

  // --- Combine and deduplicate ---
  const allItems = deduplicateItems([...dueItems, ...weakItems, ...newItems]);

  // --- Exercise type split: 70% typed, 30% in-sentence ---
  const typedTarget = Math.round(allItems.length * 0.7);

  // Build sentence inputs lookup for in-sentence exercises
  const sentenceInputCache = buildSentenceInputCache(verbInputs, verbRepo, contentRepo, formsMaps);

  const exercises: ConjugationExercise[] = [];

  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    const verb = verbInputMap.get(item.verbId);
    if (!verb) continue;
    const formsMap = formsMaps[item.verbId];
    if (!formsMap) continue;

    if (i >= typedTarget) {
      // Try in-sentence first
      const sentenceEx = tryGenerateInSentence(item, sentenceInputCache, formsMap);
      if (sentenceEx) {
        exercises.push(sentenceEx);
        continue;
      }
    }

    // Fall back to typed
    const typedEx = generateConjugationTyped(verb, formsMap, item.pronoun);
    if (typedEx) {
      exercises.push(typedEx);
    }
  }

  shuffleArray(exercises);
  return exercises;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function applyMissingTAdaptation(
  dueItems: CandidateItem[],
  userId: string,
  verbRepo: VerbRepository,
  lessonVerbIds: Set<string>,
  formsMaps: Record<string, Record<string, string>>,
): CandidateItem[] {
  const allAttempts = verbRepo.getConjugationAttempts(userId);

  // Check recent 20 attempts
  const recent = allAttempts.slice(-20);
  if (recent.length === 0) return dueItems;

  const missingTCount = recent.filter((a) => a.errorType === 'MISSING_T').length;
  const missingTRatio = missingTCount / recent.length;

  if (missingTRatio <= 0.2) return dueItems;

  // Boost jij/hij exercises by duplicating them
  const jijHijItems = dueItems.filter(
    (item) => (item.pronoun === 'JIJ' || item.pronoun === 'HIJ'),
  );

  if (jijHijItems.length > 0) {
    return [...dueItems, ...jijHijItems];
  }

  // If no jij/hij in due items, add them from lesson verbs
  const boosted: CandidateItem[] = [];
  for (const verbId of lessonVerbIds) {
    for (const pronoun of ['JIJ', 'HIJ']) {
      if (formsMaps[verbId]?.[pronoun]) {
        boosted.push({ verbId, pronoun, bucket: 'due' });
      }
    }
  }

  return [...dueItems, ...boosted.slice(0, 4)];
}

function deduplicateItems(items: CandidateItem[]): CandidateItem[] {
  const seen = new Set<string>();
  const result: CandidateItem[] = [];
  for (const item of items) {
    const key = `${item.verbId}::${item.pronoun}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

function buildSentenceInputCache(
  verbInputs: VerbInput[],
  verbRepo: VerbRepository,
  contentRepo: ContentRepository,
  formsMaps: Record<string, Record<string, string>>,
): Map<string, SentenceVerbInput[]> {
  // key: verbId -> SentenceVerbInput[]
  const cache = new Map<string, SentenceVerbInput[]>();
  for (const v of verbInputs) {
    const sentenceVerbs = verbRepo.getVerbSentences(v.id);
    const inputs: SentenceVerbInput[] = [];
    for (const sv of sentenceVerbs) {
      const sentence = contentRepo.getSentenceById(sv.sentenceId);
      if (!sentence) continue;

      // Determine pronoun from forms map by matching surface form
      let matchedPronoun = 'IK';
      const forms = formsMaps[v.id];
      for (const [pronoun, form] of Object.entries(forms)) {
        if (form.toLowerCase() === sv.surfaceForm.toLowerCase()) {
          matchedPronoun = pronoun;
          break;
        }
      }

      inputs.push({
        sentenceId: sentence.id,
        sentenceText: sentence.text,
        sentenceTranslation: sentence.translation,
        verbId: v.id,
        verbInfinitive: v.infinitive,
        surfaceForm: sv.surfaceForm,
        pronoun: matchedPronoun,
      });
    }
    cache.set(v.id, inputs);
  }
  return cache;
}

function tryGenerateInSentence(
  item: CandidateItem,
  sentenceCache: Map<string, SentenceVerbInput[]>,
  formsMap: Record<string, string>,
): ConjugationInSentenceExercise | null {
  const inputs = sentenceCache.get(item.verbId) ?? [];
  // Prefer sentences matching the target pronoun
  const matching = inputs.filter((si) => si.pronoun === item.pronoun);
  const candidates = matching.length > 0 ? matching : inputs;

  for (const input of candidates) {
    const exercise = generateConjugationInSentence(input, formsMap);
    if (exercise) return exercise;
  }
  return null;
}

function shuffleArray<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
