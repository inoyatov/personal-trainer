export { normalizeAnswer, answersMatch } from './answerNormalizer';
export {
  levenshteinDistance,
  checkWithTypoTolerance,
  maxAllowedDistance,
} from './typoTolerance';
export type { ToleranceLevel } from './typoTolerance';
export {
  checkWithArticle,
  stripArticle,
  extractArticle,
} from './articleChecker';
