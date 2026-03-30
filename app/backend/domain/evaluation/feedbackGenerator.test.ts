import { describe, it, expect } from 'vitest';
import { generateFeedback } from './feedbackGenerator';

describe('generateFeedback', () => {
  describe('correct answers', () => {
    it('should give positive feedback for correct without hint', () => {
      const result = generateFeedback({
        userAnswer: 'dokter',
        correctAnswer: 'dokter',
        isCorrect: true,
        hintUsed: false,
        exerciseType: 'multiple-choice-gap-fill',
      });
      expect(result.tone).toBe('positive');
    });

    it('should give encouraging feedback for correct with hint', () => {
      const result = generateFeedback({
        userAnswer: 'dokter',
        correctAnswer: 'dokter',
        isCorrect: true,
        hintUsed: true,
        exerciseType: 'typed-gap-fill',
      });
      expect(result.tone).toBe('encouraging');
      expect(result.message).toContain('hint');
    });
  });

  describe('incorrect — close spelling', () => {
    it('should detect close spelling (1 edit)', () => {
      const result = generateFeedback({
        userAnswer: 'doktor',
        correctAnswer: 'dokter',
        isCorrect: false,
        hintUsed: false,
        exerciseType: 'typed-gap-fill',
      });
      expect(result.tone).toBe('encouraging');
      expect(result.message).toContain('spelling');
    });

    it('should detect close spelling (2 edits)', () => {
      const result = generateFeedback({
        userAnswer: 'dokters',
        correctAnswer: 'dokter',
        isCorrect: false,
        hintUsed: false,
        exerciseType: 'typed-gap-fill',
      });
      expect(result.message).toContain('spelling');
    });
  });

  describe('incorrect — wrong article', () => {
    it('should detect de/het confusion', () => {
      const result = generateFeedback({
        userAnswer: 'het dokter',
        correctAnswer: 'de dokter',
        isCorrect: false,
        hintUsed: false,
        exerciseType: 'typed-gap-fill',
      });
      expect(result.tone).toBe('encouraging');
      expect(result.message).toContain('"de"');
    });
  });

  describe('incorrect — word order', () => {
    it('should give order-specific feedback', () => {
      const result = generateFeedback({
        userAnswer: 'ga Ik naar school',
        correctAnswer: 'Ik ga naar school.',
        isCorrect: false,
        hintUsed: false,
        exerciseType: 'word-order',
      });
      expect(result.message).toContain('order');
    });
  });

  describe('incorrect — dialog', () => {
    it('should give dialog-specific encouragement', () => {
      const result = generateFeedback({
        userAnswer: 'brood',
        correctAnswer: 'afspraak',
        isCorrect: false,
        hintUsed: false,
        exerciseType: 'dialog-completion',
      });
      expect(result.message).toContain('remember');
    });
  });

  describe('incorrect — completely wrong', () => {
    it('should give corrective feedback', () => {
      const result = generateFeedback({
        userAnswer: 'appel',
        correctAnswer: 'dokter',
        isCorrect: false,
        hintUsed: false,
        exerciseType: 'typed-gap-fill',
      });
      expect(result.tone).toBe('corrective');
      expect(result.message).toContain('dokter');
    });
  });
});
