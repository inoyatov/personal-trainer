/**
 * Frustration detection based on a sliding window of recent answers.
 *
 * Inputs (last N answers in current session):
 * - recentErrorRate >= 0.4 (4+ errors in last 10)
 * - averageResponseTime >= 8000ms
 * - recentHintRate >= 0.7
 *
 * When frustrated:
 * - Stop introducing new items
 * - Switch remaining exercises to MC (recognition only)
 * - Enable hints by default
 */

export interface AnswerSignal {
  isCorrect: boolean;
  responseTimeMs: number;
  hintUsed: boolean;
}

export interface FrustrationState {
  isFrustrated: boolean;
  errorRate: number;
  avgResponseTime: number;
  hintRate: number;
  triggerReason: string | null;
}

const WINDOW_SIZE = 10;
const ERROR_RATE_THRESHOLD = 0.4;
const AVG_RESPONSE_TIME_THRESHOLD = 8000;
const HINT_RATE_THRESHOLD = 0.7;

/**
 * Analyze a sliding window of recent answers to detect frustration.
 */
export function detectFrustration(recentAnswers: AnswerSignal[]): FrustrationState {
  const window = recentAnswers.slice(-WINDOW_SIZE);

  if (window.length < 3) {
    return { isFrustrated: false, errorRate: 0, avgResponseTime: 0, hintRate: 0, triggerReason: null };
  }

  const errorCount = window.filter((a) => !a.isCorrect).length;
  const errorRate = errorCount / window.length;

  const totalTime = window.reduce((sum, a) => sum + a.responseTimeMs, 0);
  const avgResponseTime = totalTime / window.length;

  const hintCount = window.filter((a) => a.hintUsed).length;
  const hintRate = hintCount / window.length;

  let triggerReason: string | null = null;

  if (errorRate >= ERROR_RATE_THRESHOLD) {
    triggerReason = 'high error rate';
  } else if (avgResponseTime >= AVG_RESPONSE_TIME_THRESHOLD) {
    triggerReason = 'slow responses';
  } else if (hintRate >= HINT_RATE_THRESHOLD) {
    triggerReason = 'frequent hint usage';
  }

  return {
    isFrustrated: triggerReason !== null,
    errorRate: Math.round(errorRate * 100) / 100,
    avgResponseTime: Math.round(avgResponseTime),
    hintRate: Math.round(hintRate * 100) / 100,
    triggerReason,
  };
}

/**
 * Message shown to the learner when frustration is detected.
 */
export function frustrationMessage(state: FrustrationState): string {
  switch (state.triggerReason) {
    case 'high error rate':
      return "Let's take it easy and review what you already know.";
    case 'slow responses':
      return "No rush — let's practice some familiar words.";
    case 'frequent hint usage':
      return "Hints are helpful! Let's focus on recognition for a bit.";
    default:
      return '';
  }
}
