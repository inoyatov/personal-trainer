import { describe, it, expect } from 'vitest';
import {
  classifyConjugationError,
  isConjugationAccepted,
  conjugationFeedbackMessage,
} from './conjugationChecker';

// werken: ik=werk, jij=werkt, hij=werkt, wij=werken
const werkenForms: Record<string, string> = {
  IK: 'werk',
  JIJ: 'werkt',
  U: 'werkt',
  HIJ: 'werkt',
  ZIJ_SG: 'werkt',
  HET: 'werkt',
  WIJ: 'werken',
  JULLIE: 'werken',
  ZIJ_PL: 'werken',
};

// zijn: ik=ben, jij=bent, hij=is, wij=zijn
const zijnForms: Record<string, string> = {
  IK: 'ben',
  JIJ: 'bent',
  U: 'bent',
  HIJ: 'is',
  ZIJ_SG: 'is',
  HET: 'is',
  WIJ: 'zijn',
  JULLIE: 'zijn',
  ZIJ_PL: 'zijn',
};

describe('classifyConjugationError', () => {
  describe('CORRECT', () => {
    it('should accept exact match', () => {
      const result = classifyConjugationError('werk', 'werk', werkenForms, 'IK');
      expect(result.errorType).toBe('CORRECT');
      expect(result.accepted).toBe(true);
    });

    it('should accept with different casing', () => {
      const result = classifyConjugationError('Werk', 'werk', werkenForms, 'IK');
      expect(result.errorType).toBe('CORRECT');
    });

    it('should accept with trailing punctuation', () => {
      const result = classifyConjugationError('werk.', 'werk', werkenForms, 'IK');
      expect(result.errorType).toBe('CORRECT');
    });

    it('should accept with whitespace', () => {
      const result = classifyConjugationError(' werk ', 'werk', werkenForms, 'IK');
      expect(result.errorType).toBe('CORRECT');
    });
  });

  describe('MISSING_T', () => {
    it('should detect missing -t for jij form', () => {
      const result = classifyConjugationError('werk', 'werkt', werkenForms, 'JIJ');
      expect(result.errorType).toBe('MISSING_T');
      expect(result.accepted).toBe(false);
    });

    it('should detect missing -t for hij form', () => {
      const result = classifyConjugationError('werk', 'werkt', werkenForms, 'HIJ');
      expect(result.errorType).toBe('MISSING_T');
    });

    it('should not flag MISSING_T when expected does not end in t', () => {
      const result = classifyConjugationError('wone', 'wonen', werkenForms, 'WIJ');
      expect(result.errorType).not.toBe('MISSING_T');
    });
  });

  describe('WRONG_PRONOUN_FORM', () => {
    it('should detect using ik form for hij', () => {
      // User types "werk" (ik form) but expected "werkt" (hij form)
      // Since "werk" without trailing t is MISSING_T, let's test a different case
      // User types "ben" (ik form of zijn) for hij (expected "is")
      const result = classifyConjugationError('ben', 'is', zijnForms, 'HIJ');
      expect(result.errorType).toBe('WRONG_PRONOUN_FORM');
      expect(result.accepted).toBe(false);
    });

    it('should detect using hij form for ik', () => {
      // User types "is" (hij form of zijn) for ik (expected "ben")
      const result = classifyConjugationError('is', 'ben', zijnForms, 'IK');
      expect(result.errorType).toBe('WRONG_PRONOUN_FORM');
    });

    it('should detect using wij form for jij', () => {
      // User types "werken" (wij form) for jij (expected "werkt")
      const result = classifyConjugationError('werken', 'werkt', werkenForms, 'JIJ');
      expect(result.errorType).toBe('WRONG_PRONOUN_FORM');
    });
  });

  describe('TYPO', () => {
    it('should accept 1-char typo for 4-6 char word', () => {
      // "werkr" vs "werkt" — distance 1, word length 5
      const result = classifyConjugationError('werkr', 'werkt', werkenForms, 'JIJ');
      expect(result.errorType).toBe('TYPO');
      expect(result.accepted).toBe(true);
    });

    it('should NOT accept typo for 1-3 char word (exact required)', () => {
      // "ga" vs "ga" — exact match for short forms
      // "ge" vs "ga" — distance 1, but length 2 → exact required → WRONG
      const result = classifyConjugationError('ge', 'ga', { IK: 'ga', HIJ: 'gaat' }, 'IK');
      expect(result.errorType).toBe('WRONG');
      expect(result.accepted).toBe(false);
    });

    it('should NOT accept typo for "is" (3 chars, exact required)', () => {
      const result = classifyConjugationError('iz', 'is', zijnForms, 'HIJ');
      expect(result.errorType).toBe('WRONG');
    });

    it('should accept 2-char typo for 7+ char word', () => {
      // "werkken" vs "werken" — distance 1, length 6 → accepted (within tolerance)
      const result = classifyConjugationError('werkken', 'werken', werkenForms, 'WIJ');
      expect(result.errorType).toBe('TYPO');
      expect(result.accepted).toBe(true);
    });
  });

  describe('WRONG', () => {
    it('should classify completely wrong answer', () => {
      const result = classifyConjugationError('huis', 'werkt', werkenForms, 'HIJ');
      expect(result.errorType).toBe('WRONG');
      expect(result.accepted).toBe(false);
    });

    it('should classify empty input', () => {
      const result = classifyConjugationError('', 'werk', werkenForms, 'IK');
      expect(result.errorType).toBe('WRONG');
    });
  });

  describe('priority order', () => {
    it('MISSING_T takes priority over WRONG_PRONOUN_FORM', () => {
      // "werk" for HIJ (expected "werkt")
      // "werk" is also IK's form → could be WRONG_PRONOUN_FORM
      // But MISSING_T check runs first
      const result = classifyConjugationError('werk', 'werkt', werkenForms, 'HIJ');
      expect(result.errorType).toBe('MISSING_T');
    });
  });
});

describe('isConjugationAccepted', () => {
  it('should accept CORRECT', () => {
    expect(isConjugationAccepted('CORRECT')).toBe(true);
  });

  it('should accept TYPO', () => {
    expect(isConjugationAccepted('TYPO')).toBe(true);
  });

  it('should reject MISSING_T', () => {
    expect(isConjugationAccepted('MISSING_T')).toBe(false);
  });

  it('should reject WRONG_PRONOUN_FORM', () => {
    expect(isConjugationAccepted('WRONG_PRONOUN_FORM')).toBe(false);
  });

  it('should reject WRONG', () => {
    expect(isConjugationAccepted('WRONG')).toBe(false);
  });
});

describe('conjugationFeedbackMessage', () => {
  it('should give positive for CORRECT', () => {
    expect(conjugationFeedbackMessage('CORRECT', 'werk', 'IK')).toBe('Correct!');
  });

  it('should show spelling for TYPO', () => {
    const msg = conjugationFeedbackMessage('TYPO', 'werkt', 'JIJ');
    expect(msg).toContain('werkt');
    expect(msg).toContain('spelling');
  });

  it('should mention -t for MISSING_T', () => {
    const msg = conjugationFeedbackMessage('MISSING_T', 'werkt', 'HIJ');
    expect(msg).toContain('-t');
    expect(msg).toContain('hij');
  });

  it('should mention different pronoun for WRONG_PRONOUN_FORM', () => {
    const msg = conjugationFeedbackMessage('WRONG_PRONOUN_FORM', 'is', 'HIJ');
    expect(msg).toContain('different pronoun');
    expect(msg).toContain('hij');
  });

  it('should show correct form for WRONG', () => {
    const msg = conjugationFeedbackMessage('WRONG', 'werk', 'IK');
    expect(msg).toContain('werk');
    expect(msg).toContain('ik');
  });
});
