import { eq, and, lte } from 'drizzle-orm';
import {
  verbs,
  verbConjugationSets,
  verbConjugationForms,
  lessonVerbs,
  sentenceVerbs,
  conjugationReviewStates,
  conjugationAttempts,
} from '../schema';
import type { AppDatabase } from '../index';

export function createVerbRepository(db: AppDatabase) {
  return {
    // --- Verbs ---

    getVerbById(id: string) {
      return db.select().from(verbs).where(eq(verbs.id, id)).get();
    },

    getVerbByInfinitive(infinitive: string) {
      return db.select().from(verbs).where(eq(verbs.infinitive, infinitive)).get();
    },

    getAllVerbs() {
      return db.select().from(verbs).all();
    },

    insertVerb(data: typeof verbs.$inferInsert) {
      return db.insert(verbs).values(data).returning().get();
    },

    deleteVerb(id: string) {
      return db.delete(verbs).where(eq(verbs.id, id)).run();
    },

    // --- Conjugation Sets ---

    getConjugationSet(verbId: string, tense = 'present') {
      return db
        .select()
        .from(verbConjugationSets)
        .where(
          and(
            eq(verbConjugationSets.verbId, verbId),
            eq(verbConjugationSets.tense, tense),
          ),
        )
        .get();
    },

    insertConjugationSet(data: typeof verbConjugationSets.$inferInsert) {
      return db.insert(verbConjugationSets).values(data).returning().get();
    },

    // --- Conjugation Forms ---

    getConjugationForms(conjugationSetId: string) {
      return db
        .select()
        .from(verbConjugationForms)
        .where(eq(verbConjugationForms.conjugationSetId, conjugationSetId))
        .all();
    },

    getFormForPronoun(conjugationSetId: string, pronoun: string) {
      return db
        .select()
        .from(verbConjugationForms)
        .where(
          and(
            eq(verbConjugationForms.conjugationSetId, conjugationSetId),
            eq(verbConjugationForms.pronoun, pronoun as any),
          ),
        )
        .get();
    },

    /** Returns a map of pronoun -> form for a verb's tense */
    getAllFormsMap(verbId: string, tense = 'present'): Record<string, string> {
      const set = db
        .select()
        .from(verbConjugationSets)
        .where(
          and(
            eq(verbConjugationSets.verbId, verbId),
            eq(verbConjugationSets.tense, tense),
          ),
        )
        .get();
      if (!set) return {};

      const forms = db
        .select()
        .from(verbConjugationForms)
        .where(eq(verbConjugationForms.conjugationSetId, set.id))
        .all();

      const map: Record<string, string> = {};
      for (const f of forms) {
        map[f.pronoun] = f.form;
      }
      return map;
    },

    insertConjugationForm(data: typeof verbConjugationForms.$inferInsert) {
      return db.insert(verbConjugationForms).values(data).returning().get();
    },

    // --- Lesson Verbs ---

    getVerbsByLesson(lessonId: string) {
      const links = db
        .select()
        .from(lessonVerbs)
        .where(eq(lessonVerbs.lessonId, lessonId))
        .orderBy(lessonVerbs.orderIndex)
        .all();

      return links.map((link) => {
        const verb = db.select().from(verbs).where(eq(verbs.id, link.verbId)).get();
        return { ...link, verb };
      });
    },

    insertLessonVerb(data: typeof lessonVerbs.$inferInsert) {
      return db.insert(lessonVerbs).values(data).run();
    },

    // --- Sentence Verbs ---

    getSentenceVerbs(sentenceId: string) {
      return db
        .select()
        .from(sentenceVerbs)
        .where(eq(sentenceVerbs.sentenceId, sentenceId))
        .all();
    },

    getVerbSentences(verbId: string) {
      return db
        .select()
        .from(sentenceVerbs)
        .where(eq(sentenceVerbs.verbId, verbId))
        .all();
    },

    insertSentenceVerb(data: typeof sentenceVerbs.$inferInsert) {
      return db.insert(sentenceVerbs).values(data).run();
    },

    // --- Conjugation Review States ---

    getConjugationReviewState(userId: string, verbId: string, pronoun: string, tense = 'present') {
      return db
        .select()
        .from(conjugationReviewStates)
        .where(
          and(
            eq(conjugationReviewStates.userId, userId),
            eq(conjugationReviewStates.verbId, verbId),
            eq(conjugationReviewStates.pronoun, pronoun),
            eq(conjugationReviewStates.tense, tense),
          ),
        )
        .get();
    },

    getDueConjugationReviews(userId: string, dueBeforeIso?: string) {
      const dueBefore = dueBeforeIso ?? new Date().toISOString();
      return db
        .select()
        .from(conjugationReviewStates)
        .where(
          and(
            eq(conjugationReviewStates.userId, userId),
            lte(conjugationReviewStates.dueAt, dueBefore),
          ),
        )
        .all();
    },

    upsertConjugationReviewState(data: typeof conjugationReviewStates.$inferInsert) {
      const existing = db
        .select()
        .from(conjugationReviewStates)
        .where(
          and(
            eq(conjugationReviewStates.userId, data.userId ?? 'default'),
            eq(conjugationReviewStates.verbId, data.verbId),
            eq(conjugationReviewStates.pronoun, data.pronoun),
            eq(conjugationReviewStates.tense, data.tense ?? 'present'),
          ),
        )
        .get();

      if (existing) {
        return db
          .update(conjugationReviewStates)
          .set(data)
          .where(eq(conjugationReviewStates.id, existing.id))
          .returning()
          .get();
      }

      return db.insert(conjugationReviewStates).values(data).returning().get();
    },

    // --- Conjugation Attempts ---

    insertConjugationAttempt(data: typeof conjugationAttempts.$inferInsert) {
      return db.insert(conjugationAttempts).values(data).returning().get();
    },

    getConjugationAttempts(userId: string, verbId?: string) {
      if (verbId) {
        return db
          .select()
          .from(conjugationAttempts)
          .where(
            and(
              eq(conjugationAttempts.userId, userId),
              eq(conjugationAttempts.verbId, verbId),
            ),
          )
          .all();
      }
      return db
        .select()
        .from(conjugationAttempts)
        .where(eq(conjugationAttempts.userId, userId))
        .all();
    },

    /** Group conjugation_attempts by pronoun, compute accuracy per pronoun */
    getWeakPronounStats(userId: string): Array<{ pronoun: string; total: number; correct: number; accuracy: number }> {
      const attempts = db
        .select()
        .from(conjugationAttempts)
        .where(eq(conjugationAttempts.userId, userId))
        .all();

      const stats: Record<string, { correct: number; total: number }> = {};
      for (const a of attempts) {
        if (!stats[a.pronoun]) stats[a.pronoun] = { correct: 0, total: 0 };
        stats[a.pronoun].total++;
        if (a.correct) stats[a.pronoun].correct++;
      }

      return Object.entries(stats).map(([pronoun, s]) => ({
        pronoun,
        total: s.total,
        correct: s.correct,
        accuracy: s.total > 0 ? s.correct / s.total : 0,
      }));
    },

    /** Find verb+pronoun combos from lesson verbs that have no conjugation_review_states entry */
    getNewVerbPronounCombos(lessonId: string, userId: string): Array<{ verbId: string; pronoun: string }> {
      const ALL_PRONOUNS = ['IK', 'JIJ', 'U', 'HIJ', 'ZIJ_SG', 'HET', 'WIJ', 'JULLIE', 'ZIJ_PL'];

      const links = db
        .select()
        .from(lessonVerbs)
        .where(eq(lessonVerbs.lessonId, lessonId))
        .all();

      const verbIds = links.map((l) => l.verbId);

      const existingStates = db
        .select()
        .from(conjugationReviewStates)
        .where(eq(conjugationReviewStates.userId, userId))
        .all();

      const existingKeys = new Set(
        existingStates.map((s) => `${s.verbId}::${s.pronoun}`),
      );

      const newCombos: Array<{ verbId: string; pronoun: string }> = [];
      for (const verbId of verbIds) {
        for (const pronoun of ALL_PRONOUNS) {
          if (!existingKeys.has(`${verbId}::${pronoun}`)) {
            newCombos.push({ verbId, pronoun });
          }
        }
      }

      return newCombos;
    },
  };
}

export type VerbRepository = ReturnType<typeof createVerbRepository>;
