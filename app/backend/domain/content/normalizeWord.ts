/**
 * Normalize a vocabulary word for uniqueness checking.
 *
 * Rules:
 * - Nouns: strip article, use lemma, lowercase
 * - Verbs: use lemma as infinitive form, lowercase
 * - All others: lowercase lemma
 * - Always: trim whitespace, remove trailing punctuation
 */
export function normalizeWord(
  lemma: string,
  article: string | null,
  partOfSpeech: string,
): string {
  let normalized = lemma.trim();

  // Remove trailing punctuation (., !, ?, ;, :, etc.)
  normalized = normalized.replace(/[.!?;:,]+$/, '');

  // Lowercase
  normalized = normalized.toLowerCase();

  // For nouns: strip any leading article from the lemma itself
  // (articles like "de", "het" may appear inline in the lemma)
  if (partOfSpeech.toLowerCase() === 'noun' && article) {
    const articleLower = article.trim().toLowerCase();
    if (normalized.startsWith(articleLower + ' ')) {
      normalized = normalized.slice(articleLower.length).trim();
    }
  }

  return normalized;
}
