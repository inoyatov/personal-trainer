/**
 * Generate competence-based milestone messages from progress data.
 * These are meaningful signals of real progress, not gamification noise.
 */

export interface ProgressSnapshot {
  totalItemsLearned: number;
  totalSessions: number;
  todayAccuracy: number;
  /** Review states with stage info */
  reviewStates: Array<{
    entityType: string;
    entityId: string;
    currentStage: string;
    recognitionMastery?: number;
    recallMastery?: number;
    transferMastery?: number;
  }>;
  /** Lesson completion data */
  lessonCompletions: Array<{
    lessonId: string;
    lessonTitle: string;
    overallPercent: number;
    isComplete: boolean;
  }>;
}

export interface CompetenceSignal {
  message: string;
  category: 'milestone' | 'improvement' | 'strength';
}

export function generateCompetenceSignals(
  snapshot: ProgressSnapshot,
): CompetenceSignal[] {
  const signals: CompetenceSignal[] = [];

  // --- Milestones ---
  if (snapshot.totalItemsLearned >= 10 && snapshot.totalItemsLearned < 20) {
    signals.push({
      message: `You've started learning ${snapshot.totalItemsLearned} items. Keep going!`,
      category: 'milestone',
    });
  }
  if (snapshot.totalItemsLearned >= 50) {
    signals.push({
      message: `You've learned over 50 items. That's real progress!`,
      category: 'milestone',
    });
  }
  if (snapshot.totalItemsLearned >= 100) {
    signals.push({
      message: `Over 100 items learned. Your Dutch vocabulary is growing fast!`,
      category: 'milestone',
    });
  }

  if (snapshot.totalSessions >= 10) {
    signals.push({
      message: `${snapshot.totalSessions} study sessions completed. Consistency is key!`,
      category: 'milestone',
    });
  }

  // --- Completed lessons ---
  const completedLessons = snapshot.lessonCompletions.filter((l) => l.isComplete);
  for (const lesson of completedLessons) {
    signals.push({
      message: `You've mastered "${lesson.lessonTitle}".`,
      category: 'milestone',
    });
  }

  // --- Strengths ---
  const stableOrAutomated = snapshot.reviewStates.filter(
    (s) => s.currentStage === 'stable' || s.currentStage === 'automated',
  );
  if (stableOrAutomated.length >= 5) {
    signals.push({
      message: `${stableOrAutomated.length} items are stable in your memory.`,
      category: 'strength',
    });
  }

  // Check for strong recall mastery
  const strongRecall = snapshot.reviewStates.filter(
    (s) => (s.recallMastery ?? 0) >= 0.7,
  );
  if (strongRecall.length >= 3) {
    signals.push({
      message: `You can recall ${strongRecall.length} items without hints.`,
      category: 'strength',
    });
  }

  // --- Improvements ---
  if (snapshot.todayAccuracy >= 80 && snapshot.totalSessions >= 3) {
    signals.push({
      message: `${snapshot.todayAccuracy}% accuracy today — excellent work!`,
      category: 'improvement',
    });
  }

  // Near-complete lessons
  const nearComplete = snapshot.lessonCompletions.filter(
    (l) => !l.isComplete && l.overallPercent >= 60,
  );
  for (const lesson of nearComplete) {
    signals.push({
      message: `"${lesson.lessonTitle}" is ${lesson.overallPercent}% complete — almost there!`,
      category: 'improvement',
    });
  }

  return signals;
}
