import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../testDb';
import { createVerbRepository, type VerbRepository } from './verbRepository';
import { createCourseRepository } from './courseRepository';

describe('verbRepository', () => {
  let repo: VerbRepository;

  beforeEach(() => {
    const db = createTestDb();
    repo = createVerbRepository(db);

    // Set up lesson hierarchy for FK tests
    const courseRepo = createCourseRepository(db);
    courseRepo.insertCourse({ id: 'c1', title: 'Test', targetLevel: 'A2' });
    courseRepo.insertModule({ id: 'm1', courseId: 'c1', title: 'Mod', orderIndex: 0 });
    courseRepo.insertLesson({ id: 'l1', moduleId: 'm1', title: 'Lesson', orderIndex: 0 });
  });

  describe('verbs', () => {
    it('should insert and retrieve a verb', () => {
      const verb = repo.insertVerb({
        id: 'v-werken',
        infinitive: 'werken',
        translation: 'to work',
        type: 'regular',
      });

      expect(verb.infinitive).toBe('werken');

      const fetched = repo.getVerbById('v-werken');
      expect(fetched).toBeDefined();
      expect(fetched!.type).toBe('regular');
    });

    it('should find verb by infinitive', () => {
      repo.insertVerb({ id: 'v-zijn', infinitive: 'zijn', translation: 'to be', type: 'irregular' });
      const found = repo.getVerbByInfinitive('zijn');
      expect(found).toBeDefined();
      expect(found!.type).toBe('irregular');
    });

    it('should list all verbs', () => {
      repo.insertVerb({ id: 'v1', infinitive: 'werken', translation: 'to work' });
      repo.insertVerb({ id: 'v2', infinitive: 'wonen', translation: 'to live' });
      expect(repo.getAllVerbs()).toHaveLength(2);
    });
  });

  describe('conjugation sets and forms', () => {
    beforeEach(() => {
      repo.insertVerb({ id: 'v-werken', infinitive: 'werken', translation: 'to work' });
      repo.insertConjugationSet({ id: 'vcs-werken', verbId: 'v-werken', tense: 'present' });
      repo.insertConjugationForm({ id: 'vcf-ik', conjugationSetId: 'vcs-werken', pronoun: 'IK', form: 'werk' });
      repo.insertConjugationForm({ id: 'vcf-hij', conjugationSetId: 'vcs-werken', pronoun: 'HIJ', form: 'werkt' });
      repo.insertConjugationForm({ id: 'vcf-wij', conjugationSetId: 'vcs-werken', pronoun: 'WIJ', form: 'werken' });
    });

    it('should get conjugation set by verb and tense', () => {
      const set = repo.getConjugationSet('v-werken', 'present');
      expect(set).toBeDefined();
      expect(set!.tense).toBe('present');
    });

    it('should get all forms for a set', () => {
      const forms = repo.getConjugationForms('vcs-werken');
      expect(forms).toHaveLength(3);
    });

    it('should get form for specific pronoun', () => {
      const form = repo.getFormForPronoun('vcs-werken', 'HIJ');
      expect(form).toBeDefined();
      expect(form!.form).toBe('werkt');
    });

    it('should get all forms as map', () => {
      const map = repo.getAllFormsMap('v-werken');
      expect(map.IK).toBe('werk');
      expect(map.HIJ).toBe('werkt');
      expect(map.WIJ).toBe('werken');
    });

    it('should return empty map for nonexistent verb', () => {
      const map = repo.getAllFormsMap('v-nonexistent');
      expect(Object.keys(map)).toHaveLength(0);
    });

    it('should cascade delete forms when verb deleted', () => {
      repo.deleteVerb('v-werken');
      const forms = repo.getConjugationForms('vcs-werken');
      expect(forms).toHaveLength(0);
    });
  });

  describe('lesson verbs', () => {
    beforeEach(() => {
      repo.insertVerb({ id: 'v-gaan', infinitive: 'gaan', translation: 'to go', type: 'irregular' });
      repo.insertVerb({ id: 'v-komen', infinitive: 'komen', translation: 'to come', type: 'irregular' });
    });

    it('should link verbs to lessons', () => {
      repo.insertLessonVerb({ lessonId: 'l1', verbId: 'v-gaan', role: 'target', orderIndex: 0 });
      repo.insertLessonVerb({ lessonId: 'l1', verbId: 'v-komen', role: 'supporting', orderIndex: 1 });

      const linked = repo.getVerbsByLesson('l1');
      expect(linked).toHaveLength(2);
      expect(linked[0].role).toBe('target');
      expect(linked[0].verb?.infinitive).toBe('gaan');
      expect(linked[1].role).toBe('supporting');
    });
  });

  describe('conjugation review states', () => {
    beforeEach(() => {
      repo.insertVerb({ id: 'v-zijn', infinitive: 'zijn', translation: 'to be', type: 'irregular' });
    });

    it('should upsert review state', () => {
      const state = repo.upsertConjugationReviewState({
        id: 'crs-1',
        userId: 'default',
        verbId: 'v-zijn',
        pronoun: 'IK',
        tense: 'present',
        stage: 'new',
        dueAt: new Date().toISOString(),
      });

      expect(state!.stage).toBe('new');

      // Update via upsert
      const updated = repo.upsertConjugationReviewState({
        id: 'crs-1',
        userId: 'default',
        verbId: 'v-zijn',
        pronoun: 'IK',
        tense: 'present',
        stage: 'seen',
        successCount: 1,
        dueAt: new Date().toISOString(),
      });

      expect(updated!.stage).toBe('seen');
    });

    it('should get due reviews', () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      const future = new Date(Date.now() + 86400000).toISOString();

      repo.upsertConjugationReviewState({
        id: 'crs-1', userId: 'default', verbId: 'v-zijn', pronoun: 'IK', dueAt: past,
      });
      repo.upsertConjugationReviewState({
        id: 'crs-2', userId: 'default', verbId: 'v-zijn', pronoun: 'HIJ', dueAt: future,
      });

      const due = repo.getDueConjugationReviews('default');
      expect(due).toHaveLength(1);
      expect(due[0].pronoun).toBe('IK');
    });
  });

  describe('conjugation attempts', () => {
    beforeEach(() => {
      repo.insertVerb({ id: 'v-hebben', infinitive: 'hebben', translation: 'to have', type: 'irregular' });
    });

    it('should record and retrieve attempts', () => {
      repo.insertConjugationAttempt({
        id: 'ca-1',
        userId: 'default',
        verbId: 'v-hebben',
        pronoun: 'HIJ',
        tense: 'present',
        expectedForm: 'heeft',
        userAnswer: 'hebt',
        correct: false,
        errorType: 'WRONG_PRONOUN_FORM',
        responseTimeMs: 3000,
      });

      repo.insertConjugationAttempt({
        id: 'ca-2',
        userId: 'default',
        verbId: 'v-hebben',
        pronoun: 'IK',
        tense: 'present',
        expectedForm: 'heb',
        userAnswer: 'heb',
        correct: true,
        errorType: 'CORRECT',
        responseTimeMs: 1500,
      });

      const all = repo.getConjugationAttempts('default');
      expect(all).toHaveLength(2);

      const forVerb = repo.getConjugationAttempts('default', 'v-hebben');
      expect(forVerb).toHaveLength(2);
    });
  });

  describe('getWeakPronounStats', () => {
    it('should return accuracy per pronoun', () => {
      repo.insertVerb({ id: 'v-lopen', infinitive: 'lopen', translation: 'to walk' });

      // IK: 2 correct out of 3
      repo.insertConjugationAttempt({
        id: 'ca-wp1',
        userId: 'default',
        verbId: 'v-lopen',
        pronoun: 'IK',
        tense: 'present',
        expectedForm: 'loop',
        userAnswer: 'loop',
        correct: true,
        errorType: 'CORRECT',
        responseTimeMs: 1000,
      });
      repo.insertConjugationAttempt({
        id: 'ca-wp2',
        userId: 'default',
        verbId: 'v-lopen',
        pronoun: 'IK',
        tense: 'present',
        expectedForm: 'loop',
        userAnswer: 'loopt',
        correct: false,
        errorType: 'WRONG_PRONOUN_FORM',
        responseTimeMs: 1500,
      });
      repo.insertConjugationAttempt({
        id: 'ca-wp3',
        userId: 'default',
        verbId: 'v-lopen',
        pronoun: 'IK',
        tense: 'present',
        expectedForm: 'loop',
        userAnswer: 'loop',
        correct: true,
        errorType: 'CORRECT',
        responseTimeMs: 1200,
      });

      // HIJ: 0 correct out of 1
      repo.insertConjugationAttempt({
        id: 'ca-wp4',
        userId: 'default',
        verbId: 'v-lopen',
        pronoun: 'HIJ',
        tense: 'present',
        expectedForm: 'loopt',
        userAnswer: 'loop',
        correct: false,
        errorType: 'MISSING_T',
        responseTimeMs: 2000,
      });

      const stats = repo.getWeakPronounStats('default');
      expect(stats).toHaveLength(2);

      const ikStat = stats.find((s) => s.pronoun === 'IK');
      expect(ikStat).toBeDefined();
      expect(ikStat!.total).toBe(3);
      expect(ikStat!.correct).toBe(2);
      expect(ikStat!.accuracy).toBeCloseTo(2 / 3);

      const hijStat = stats.find((s) => s.pronoun === 'HIJ');
      expect(hijStat).toBeDefined();
      expect(hijStat!.total).toBe(1);
      expect(hijStat!.correct).toBe(0);
      expect(hijStat!.accuracy).toBe(0);
    });
  });

  describe('getNewVerbPronounCombos', () => {
    it('should return unreviewed verb+pronoun pairs', () => {
      repo.insertVerb({ id: 'v-eten', infinitive: 'eten', translation: 'to eat' });
      repo.insertVerb({ id: 'v-drinken', infinitive: 'drinken', translation: 'to drink' });

      // Link both verbs to lesson l1
      repo.insertLessonVerb({ lessonId: 'l1', verbId: 'v-eten', role: 'target', orderIndex: 0 });
      repo.insertLessonVerb({ lessonId: 'l1', verbId: 'v-drinken', role: 'target', orderIndex: 1 });

      // Mark some combos as reviewed for v-eten
      repo.upsertConjugationReviewState({
        id: 'crs-eten-ik',
        userId: 'default',
        verbId: 'v-eten',
        pronoun: 'IK',
        tense: 'present',
        stage: 'seen',
        dueAt: new Date().toISOString(),
      });
      repo.upsertConjugationReviewState({
        id: 'crs-eten-hij',
        userId: 'default',
        verbId: 'v-eten',
        pronoun: 'HIJ',
        tense: 'present',
        stage: 'recognized',
        dueAt: new Date().toISOString(),
      });

      const combos = repo.getNewVerbPronounCombos('l1', 'default');

      // v-eten has 9 pronouns total, 2 reviewed = 7 new
      // v-drinken has 9 pronouns total, 0 reviewed = 9 new
      // total = 16
      expect(combos).toHaveLength(16);

      // Reviewed combos should NOT be in the list
      const etenIk = combos.find(
        (c) => c.verbId === 'v-eten' && c.pronoun === 'IK',
      );
      expect(etenIk).toBeUndefined();

      const etenHij = combos.find(
        (c) => c.verbId === 'v-eten' && c.pronoun === 'HIJ',
      );
      expect(etenHij).toBeUndefined();

      // Unreviewed combos should be present
      const etenJij = combos.find(
        (c) => c.verbId === 'v-eten' && c.pronoun === 'JIJ',
      );
      expect(etenJij).toBeDefined();

      const drinkenIk = combos.find(
        (c) => c.verbId === 'v-drinken' && c.pronoun === 'IK',
      );
      expect(drinkenIk).toBeDefined();
    });
  });
});
