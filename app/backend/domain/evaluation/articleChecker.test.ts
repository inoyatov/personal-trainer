import { describe, it, expect } from 'vitest';
import {
  checkWithArticle,
  stripArticle,
  extractArticle,
} from './articleChecker';

describe('stripArticle', () => {
  it('should strip "de"', () => {
    expect(stripArticle('de dokter')).toBe('dokter');
  });

  it('should strip "het"', () => {
    expect(stripArticle('het huis')).toBe('huis');
  });

  it('should strip "een"', () => {
    expect(stripArticle('een appel')).toBe('appel');
  });

  it('should not strip if no article', () => {
    expect(stripArticle('dokter')).toBe('dokter');
  });

  it('should not strip article-like substrings', () => {
    expect(stripArticle('december')).toBe('december');
    expect(stripArticle('hetkomen')).toBe('hetkomen');
  });

  it('should handle case insensitively', () => {
    expect(stripArticle('De dokter')).toBe('dokter');
  });
});

describe('extractArticle', () => {
  it('should extract "de"', () => {
    expect(extractArticle('de school')).toBe('de');
  });

  it('should extract "het"', () => {
    expect(extractArticle('het huis')).toBe('het');
  });

  it('should return null when no article', () => {
    expect(extractArticle('school')).toBeNull();
  });
});

describe('checkWithArticle', () => {
  describe('requireArticle = false', () => {
    it('should match when user omits article', () => {
      const result = checkWithArticle('dokter', 'de dokter', false);
      expect(result.match).toBe(true);
    });

    it('should match when user includes article', () => {
      const result = checkWithArticle('de dokter', 'de dokter', false);
      expect(result.match).toBe(true);
    });

    it('should match when user uses wrong article (articles stripped)', () => {
      const result = checkWithArticle('het dokter', 'de dokter', false);
      expect(result.match).toBe(true);
    });

    it('should not match wrong word', () => {
      const result = checkWithArticle('de school', 'de dokter', false);
      expect(result.match).toBe(false);
    });

    it('should match bare words without articles on either side', () => {
      const result = checkWithArticle('dokter', 'dokter', false);
      expect(result.match).toBe(true);
    });
  });

  describe('requireArticle = true', () => {
    it('should match with correct article', () => {
      const result = checkWithArticle('de dokter', 'de dokter', true);
      expect(result.match).toBe(true);
    });

    it('should reject missing article', () => {
      const result = checkWithArticle('dokter', 'de dokter', true);
      expect(result.match).toBe(false);
    });

    it('should reject wrong article', () => {
      const result = checkWithArticle('het dokter', 'de dokter', true);
      expect(result.match).toBe(false);
    });
  });
});
