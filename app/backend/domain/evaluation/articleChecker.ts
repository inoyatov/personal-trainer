import { normalizeAnswer } from './answerNormalizer';

const DUTCH_ARTICLES = ['de', 'het', 'een'];

/**
 * Check a typed answer against the correct answer, optionally
 * handling Dutch article (de/het/een) inclusion.
 *
 * When `requireArticle` is true, the answer must include the correct article.
 * When false, the article is stripped from both before comparison.
 *
 * Examples:
 * - correct="dokter", user="de dokter", require=false -> strips article, matches "dokter"
 * - correct="de dokter", user="dokter", require=true -> fails (missing article)
 * - correct="het huis", user="de huis", require=true -> fails (wrong article)
 */
export function checkWithArticle(
  userAnswer: string,
  correctAnswer: string,
  requireArticle: boolean,
): { match: boolean; strippedUser: string; strippedCorrect: string } {
  const normUser = normalizeAnswer(userAnswer);
  const normCorrect = normalizeAnswer(correctAnswer);

  if (requireArticle) {
    // Direct comparison — articles must match
    return {
      match: normUser === normCorrect,
      strippedUser: normUser,
      strippedCorrect: normCorrect,
    };
  }

  // Strip articles from both
  const strippedUser = stripArticle(normUser);
  const strippedCorrect = stripArticle(normCorrect);

  return {
    match: strippedUser === strippedCorrect,
    strippedUser,
    strippedCorrect,
  };
}

/**
 * Strip a leading Dutch article from a word/phrase.
 */
export function stripArticle(text: string): string {
  const lower = text.toLowerCase();
  for (const article of DUTCH_ARTICLES) {
    if (lower.startsWith(article + ' ')) {
      return text.substring(article.length + 1).trim();
    }
  }
  return text;
}

/**
 * Extract the article from a Dutch word/phrase, if present.
 */
export function extractArticle(text: string): string | null {
  const lower = text.toLowerCase().trim();
  for (const article of DUTCH_ARTICLES) {
    if (lower.startsWith(article + ' ')) {
      return article;
    }
  }
  return null;
}
