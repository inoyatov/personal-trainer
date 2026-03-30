import { describe, it, expect } from 'vitest';
import { generateBlank } from './gapModes';

describe('generateBlank', () => {
  it('should return fixed blank for MASKED mode', () => {
    expect(generateBlank('dokter', 'MASKED')).toBe('____');
    expect(generateBlank('a', 'MASKED')).toBe('____');
  });

  it('should return length-matching blank for LENGTH_HINT mode', () => {
    expect(generateBlank('dokter', 'LENGTH_HINT')).toBe('_ _ _ _ _ _');
    expect(generateBlank('huis', 'LENGTH_HINT')).toBe('_ _ _ _');
    expect(generateBlank('a', 'LENGTH_HINT')).toBe('_');
  });

  it('should match word length exactly', () => {
    const blank = generateBlank('afspraak', 'LENGTH_HINT');
    // "afspraak" = 8 chars → "_ _ _ _ _ _ _ _" = 8 underscores + 7 spaces
    expect(blank.split(' ').length).toBe(8);
  });
});
