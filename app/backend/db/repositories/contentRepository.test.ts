import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../testDb';
import { createCourseRepository } from './courseRepository';
import { createContentRepository } from './contentRepository';
import type { ContentRepository } from './contentRepository';

describe('contentRepository', () => {
  let repo: ContentRepository;

  beforeEach(() => {
    const db = createTestDb();
    const courseRepo = createCourseRepository(db);
    repo = createContentRepository(db);

    // Set up hierarchy
    courseRepo.insertCourse({
      id: 'c1',
      title: 'Dutch A2',
      targetLevel: 'A2',
    });
    courseRepo.insertModule({
      id: 'm1',
      courseId: 'c1',
      title: 'Daily Life',
      orderIndex: 0,
    });
    courseRepo.insertLesson({
      id: 'l1',
      moduleId: 'm1',
      title: 'Doctor Appointment',
      orderIndex: 0,
    });
    courseRepo.insertClassGroup({
      id: 'cg1',
      lessonId: 'l1',
      type: 'vocabulary',
      title: 'Vocabulary',
      orderIndex: 0,
    });
    courseRepo.insertClassGroup({
      id: 'cg2',
      lessonId: 'l1',
      type: 'dialog',
      title: 'Dialog',
      orderIndex: 1,
    });
  });

  describe('vocabulary', () => {
    it('should insert and retrieve vocabulary', () => {
      repo.insertVocabulary({
        id: 'v1',
        lemma: 'afspraak',
        displayText: 'de afspraak',
        article: 'de',
        partOfSpeech: 'noun',
        translation: 'appointment',
        classGroupId: 'cg1',
      });

      const items = repo.getVocabularyByClassGroup('cg1');
      expect(items).toHaveLength(1);
      expect(items[0].lemma).toBe('afspraak');
      expect(items[0].article).toBe('de');
    });

    it('should get vocabulary by id', () => {
      repo.insertVocabulary({
        id: 'v1',
        lemma: 'dokter',
        displayText: 'de dokter',
        article: 'de',
        partOfSpeech: 'noun',
        translation: 'doctor',
      });

      const item = repo.getVocabularyById('v1');
      expect(item).toBeDefined();
      expect(item!.translation).toBe('doctor');
    });
  });

  describe('sentences', () => {
    it('should insert and retrieve sentences by lesson', () => {
      repo.insertSentence({
        id: 's1',
        text: 'Ik wil graag een afspraak maken.',
        translation: 'I would like to make an appointment.',
        lessonId: 'l1',
        classGroupId: 'cg1',
      });

      const sentences = repo.getSentencesByLesson('l1');
      expect(sentences).toHaveLength(1);
      expect(sentences[0].text).toContain('afspraak');
    });
  });

  describe('dialogs', () => {
    it('should insert dialog with turns', () => {
      repo.insertDialog({
        id: 'd1',
        lessonId: 'l1',
        title: 'At the doctor',
        scenario: 'Making an appointment by phone',
        classGroupId: 'cg2',
      });

      repo.insertDialogTurn({
        id: 'dt1',
        dialogId: 'd1',
        speaker: 'Receptionist',
        text: 'Goedemorgen, waarmee kan ik u helpen?',
        translation: 'Good morning, how can I help you?',
        orderIndex: 0,
      });

      repo.insertDialogTurn({
        id: 'dt2',
        dialogId: 'd1',
        speaker: 'Patient',
        text: 'Ik wil graag een afspraak maken.',
        translation: 'I would like to make an appointment.',
        orderIndex: 1,
      });

      const turns = repo.getTurnsByDialog('d1');
      expect(turns).toHaveLength(2);
      expect(turns[0].speaker).toBe('Receptionist');
      expect(turns[1].speaker).toBe('Patient');
    });
  });

  describe('dialog turns by id', () => {
    it('getDialogTurnById should return the correct turn', () => {
      repo.insertDialog({
        id: 'd1',
        lessonId: 'l1',
        title: 'At the doctor',
        scenario: 'Phone call',
        classGroupId: 'cg2',
      });

      repo.insertDialogTurn({
        id: 'dt-target',
        dialogId: 'd1',
        speaker: 'Doctor',
        text: 'Wat zijn uw klachten?',
        translation: 'What are your complaints?',
        orderIndex: 0,
      });

      repo.insertDialogTurn({
        id: 'dt-other',
        dialogId: 'd1',
        speaker: 'Patient',
        text: 'Ik heb hoofdpijn.',
        translation: 'I have a headache.',
        orderIndex: 1,
      });

      const turn = repo.getDialogTurnById('dt-target');
      expect(turn).toBeDefined();
      expect(turn!.id).toBe('dt-target');
      expect(turn!.speaker).toBe('Doctor');
      expect(turn!.text).toBe('Wat zijn uw klachten?');

      // Non-existent turn
      const missing = repo.getDialogTurnById('dt-nonexistent');
      expect(missing).toBeUndefined();
    });
  });

  describe('grammar patterns', () => {
    it('should insert and retrieve grammar patterns', () => {
      repo.insertGrammarPattern({
        id: 'gp1',
        name: 'Modal verbs',
        description: 'Using willen, kunnen, moeten',
        lessonId: 'l1',
      });

      const patterns = repo.getGrammarPatternsByLesson('l1');
      expect(patterns).toHaveLength(1);
      expect(patterns[0].name).toBe('Modal verbs');
    });
  });
});
