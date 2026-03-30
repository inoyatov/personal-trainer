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
export {
  classifyConjugationError,
  isConjugationAccepted,
  conjugationFeedbackMessage,
} from './conjugationChecker';
export type { ConjugationErrorType, ConjugationCheckResult } from './conjugationChecker';
