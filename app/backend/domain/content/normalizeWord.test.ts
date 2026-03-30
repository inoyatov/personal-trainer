import { describe, it, expect } from 'vitest';
import { normalizeWord } from './normalizeWord';

describe('normalizeWord', () => {
  describe('nouns', () => {
    it('should lowercase a simple noun lemma', () => {
      expect(normalizeWord('Huis', null, 'noun')).toBe('huis');
    });

    it('should strip article from lemma when article is provided', () => {
      expect(normalizeWord('het huis', 'het', 'noun')).toBe('huis');
    });

    it('should strip "de" article from lemma', () => {
      expect(normalizeWord('de kat', 'de', 'noun')).toBe('kat');
    });

    it('should handle noun without article in lemma', () => {
      expect(normalizeWord('boek', 'het', 'noun')).toBe('boek');
    });

    it('should handle noun with null article', () => {
      expect(normalizeWord('Water', null, 'noun')).toBe('water');
    });
  });

  describe('verbs', () => {
    it('should lowercase verb infinitive', () => {
      expect(normalizeWord('Lopen', null, 'verb')).toBe('lopen');
    });

    it('should trim and lowercase verb', () => {
      expect(normalizeWord('  Werken  ', null, 'verb')).toBe('werken');
    });
  });

  describe('other parts of speech', () => {
    it('should lowercase adjectives', () => {
      expect(normalizeWord('Groot', null, 'adjective')).toBe('groot');
    });

    it('should lowercase adverbs', () => {
      expect(normalizeWord('Snel', null, 'adverb')).toBe('snel');
    });

    it('should lowercase prepositions', () => {
      expect(normalizeWord('Naar', null, 'preposition')).toBe('naar');
    });
  });

  describe('edge cases', () => {
    it('should trim whitespace', () => {
      expect(normalizeWord('  huis  ', null, 'noun')).toBe('huis');
    });

    it('should remove trailing punctuation', () => {
      expect(normalizeWord('huis.', null, 'noun')).toBe('huis');
    });

    it('should remove multiple trailing punctuation marks', () => {
      expect(normalizeWord('huis...', null, 'noun')).toBe('huis');
    });

    it('should remove trailing question mark', () => {
      expect(normalizeWord('wat?', null, 'pronoun')).toBe('wat');
    });

    it('should remove trailing exclamation mark', () => {
      expect(normalizeWord('hallo!', null, 'interjection')).toBe('hallo');
    });

    it('should handle empty string', () => {
      expect(normalizeWord('', null, 'noun')).toBe('');
    });

    it('should handle whitespace-only string', () => {
      expect(normalizeWord('   ', null, 'noun')).toBe('');
    });

    it('should handle combined trim + punctuation + lowercase', () => {
      expect(normalizeWord('  Huis!  ', null, 'noun')).toBe('huis');
    });
  });
});
