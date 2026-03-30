import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUnifiedSession } from '../features/study/hooks/useUnifiedSession';
import { ExerciseShell } from '../features/study/components/ExerciseShell';
import { MultipleChoiceExercise } from '../features/study/components/MultipleChoiceExercise';
import { TypedGapFillExercise } from '../features/study/components/TypedGapFillExercise';
import { SessionSummary } from '../features/study/components/SessionSummary';
import { ConfidenceWidget } from '../features/study/components/ConfidenceWidget';
import { FrustrationBanner } from '../features/study/components/FrustrationBanner';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import {
  detectFrustration,
  frustrationMessage,
  type AnswerSignal,
} from '../../../backend/domain/session/frustrationDetector';

export function UnifiedStudyPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const session = useUnifiedSession(courseId);

  const [feedback, setFeedback] = useState<{
    correct: boolean;
    message: string;
  } | null>(null);
  const [awaitingConfidence, setAwaitingConfidence] = useState(false);
  const answerStartTime = useRef(Date.now());
  const answerSignals = useRef<AnswerSignal[]>([]);
  const [frustrationMsg, setFrustrationMsg] = useState<string | null>(null);

  // Reset timer on new exercise
  useEffect(() => {
    answerStartTime.current = Date.now();
    setFeedback(null);
    setAwaitingConfidence(false);
  }, [session.currentIndex]);

  const trackFrustration = useCallback(
    (isCorrect: boolean, responseTimeMs: number) => {
      answerSignals.current.push({ isCorrect, responseTimeMs, hintUsed: false });
      const state = detectFrustration(answerSignals.current);
      if (state.isFrustrated && !frustrationMsg) {
        setFrustrationMsg(frustrationMessage(state));
      }
    },
    [frustrationMsg],
  );

  const handleAnswer = useCallback(
    (userAnswer: string, isCorrect: boolean) => {
      const responseTimeMs = Date.now() - answerStartTime.current;
      session.submitAnswer(userAnswer, isCorrect, responseTimeMs);
      trackFrustration(isCorrect, responseTimeMs);

      const exercise = session.currentExercise!;
      const message = isCorrect
        ? 'Correct!'
        : `Incorrect. The answer is: ${exercise.correctAnswer}`;
      setFeedback({ correct: isCorrect, message });
      setAwaitingConfidence(true);
    },
    [session, trackFrustration],
  );

  const handleMCAnswer = useCallback(
    (selectedIndex: number, correct: boolean) => {
      const exercise = session.currentExercise!;
      const userAnswer = exercise.options![selectedIndex];
      handleAnswer(userAnswer, correct);
    },
    [session, handleAnswer],
  );

  const handleTypedAnswer = useCallback(
    (userAnswer: string, isCorrect: boolean) => {
      handleAnswer(userAnswer, isCorrect);
    },
    [handleAnswer],
  );

  const handleConfidenceSelect = useCallback(
    (_confidence: 0 | 1 | 2) => {
      setAwaitingConfidence(false);
      session.nextExercise();
    },
    [session],
  );

  // --- Render ---

  if (!courseId) {
    return (
      <div className="mx-auto max-w-2xl pt-12">
        <EmptyState
          title="No course selected"
          description="Go to Courses to start learning."
        />
      </div>
    );
  }

  if (session.isLoading) return <LoadingSpinner />;

  if (session.error) {
    return (
      <div className="mx-auto max-w-2xl pt-12">
        <EmptyState title="Cannot start session" description={session.error} />
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/courses')}
            className="text-sm"
            style={{ color: 'var(--color-accent)' }}
          >
            Go to Courses
          </button>
        </div>
      </div>
    );
  }

  if (session.isComplete) {
    return (
      <div className="pt-12">
        <SessionSummary
          answers={session.answers.map((a) => ({
            exerciseIndex: a.exerciseIndex,
            userAnswer: a.userAnswer,
            correctAnswer: a.correctAnswer,
            isCorrect: a.isCorrect,
            responseTimeMs: a.responseTimeMs,
            hintUsed: a.hintUsed,
          }))}
          totalCorrect={session.totalCorrect}
          totalQuestions={session.exercises.length}
          sessionStats={session.sessionStats}
        />
      </div>
    );
  }

  const exercise = session.currentExercise!;
  const isTyped =
    exercise.exerciseType === 'typed-gap-fill' ||
    exercise.exerciseType === 'conjugation-typed';
  const isMC =
    exercise.exerciseType === 'translation-choice' ||
    exercise.exerciseType === 'multiple-choice-gap-fill';

  const phaseLabel = session.sessionMeta?.coldStartPhase === 'early'
    ? { text: 'Getting Started', description: 'Focus on vocabulary basics', color: 'var(--color-badge-blue)' }
    : session.sessionMeta?.coldStartPhase === 'mid'
      ? { text: 'Building Foundations', description: 'Adding sentences and conjugation', color: 'var(--color-badge-orange)' }
      : { text: 'Full Practice', description: 'All exercise types active', color: 'var(--color-success)' };

  const exerciseLabel =
    {
      'translation-choice': 'Vocabulary',
      'multiple-choice-gap-fill': 'Gap Fill',
      'typed-gap-fill': 'Type Answer',
      'conjugation-typed': 'Conjugation',
      'dialog-completion': 'Dialog',
      'word-order': 'Word Order',
    }[exercise.exerciseType] ?? exercise.exerciseType;

  return (
    <div className="pt-4">
      {frustrationMsg && <FrustrationBanner message={frustrationMsg} />}

      {/* Cold start phase indicator — show only on first exercise */}
      {session.currentIndex === 0 && session.sessionMeta && (
        <div className="mx-auto mb-4 max-w-2xl">
          <div
            className="flex items-center gap-2 rounded-lg px-4 py-2"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: phaseLabel.color }}
            />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {phaseLabel.text}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {phaseLabel.description}
            </span>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="mx-auto mb-6 max-w-2xl">
        <div
          className="mb-1 flex items-center justify-between text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <span>
            Question {session.currentIndex + 1} of {session.exercises.length}
          </span>
          <span
            className="rounded px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: 'var(--color-accent-light)',
              color: 'var(--color-accent)',
            }}
          >
            {exerciseLabel}
          </span>
        </div>
        <div
          className="h-2 w-full rounded-full"
          style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
        >
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              backgroundColor: 'var(--color-accent)',
              width: `${((session.currentIndex + 1) / session.exercises.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Exercise content */}
      <div className="mx-auto max-w-2xl">
        {/* Prompt */}
        <div
          className="mb-6 rounded-lg p-4 text-center text-lg font-medium"
          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        >
          {exercise.renderedPrompt}
          {exercise.sentenceTranslation && (
            <p
              className="mt-2 text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {exercise.sentenceTranslation}
            </p>
          )}
        </div>

        {/* MC exercises */}
        {isMC && exercise.options && exercise.correctIndex !== undefined && (
          <MultipleChoiceExercise
            options={exercise.options}
            correctIndex={exercise.correctIndex}
            onAnswer={handleMCAnswer}
            disabled={!!feedback}
          />
        )}

        {/* Typed exercises */}
        {isTyped && (
          <TypedGapFillExercise
            correctAnswer={exercise.correctAnswer}
            onAnswer={handleTypedAnswer}
            disabled={!!feedback}
          />
        )}

        {/* Dialog completion (typed for now) */}
        {exercise.exerciseType === 'dialog-completion' && (
          <TypedGapFillExercise
            correctAnswer={exercise.correctAnswer}
            onAnswer={handleTypedAnswer}
            disabled={!!feedback}
          />
        )}

        {/* Confidence widget */}
        {feedback && awaitingConfidence && (
          <div className="mt-4">
            <ConfidenceWidget onSelect={handleConfidenceSelect} />
          </div>
        )}
      </div>
    </div>
  );
}
