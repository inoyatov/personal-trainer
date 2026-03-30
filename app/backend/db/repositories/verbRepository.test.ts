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
});
