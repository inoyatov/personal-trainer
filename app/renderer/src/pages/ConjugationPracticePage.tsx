import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { ConjugationTypedExercise } from '../features/conjugation/components/ConjugationTypedExercise';
import { ConjugationInSentenceExercise } from '../features/conjugation/components/ConjugationInSentenceExercise';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

interface ConjugationExercise {
  exerciseType: 'conjugation-typed' | 'conjugation-in-sentence';
  sourceEntityId: string;
  renderedPrompt: string;
  correctAnswer: string;
  verbInfinitive: string;
  verbTranslation?: string;
  pronoun: string;
  verbId: string;
  allForms: Record<string, string>;
  sentenceTranslation?: string;
}

interface AnswerRecord {
  exerciseIndex: number;
  userAnswer: string;
  correctAnswer: string;
  accepted: boolean;
  errorType: string;
}

export function ConjugationPracticePage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const { data: exercises, isLoading } = useQuery({
    queryKey: ['conjugationExercises', lessonId],
    queryFn: () => api.conjugation.generateExercises(lessonId!, 10),
    enabled: !!lessonId,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [feedback, setFeedback] = useState<{
    accepted: boolean;
    errorType: string;
    message: string;
  } | null>(null);
  const answerStartTime = useRef(Date.now());

  const exerciseList = (exercises ?? []) as ConjugationExercise[];
  const currentExercise = currentIndex < exerciseList.length ? exerciseList[currentIndex] : null;
  const isComplete = exerciseList.length > 0 && currentIndex >= exerciseList.length;
  const totalCorrect = answers.filter((a) => a.accepted).length;

  // Reset timer on new exercise
  useEffect(() => {
    answerStartTime.current = Date.now();
    setFeedback(null);
  }, [currentIndex]);

  // Enter to advance after feedback
  useEffect(() => {
    if (!feedback) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        setCurrentIndex((i) => i + 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [feedback]);

  const handleAnswer = useCallback(
    async (userAnswer: string) => {
      if (!currentExercise || feedback) return;
      const responseTimeMs = Date.now() - answerStartTime.current;

      const result = await api.conjugation.submitAnswer({
        verbId: currentExercise.verbId,
        pronoun: currentExercise.pronoun,
        userAnswer,
        expectedForm: currentExercise.correctAnswer,
        responseTimeMs,
      });

      setFeedback({
        accepted: result.accepted,
        errorType: result.errorType,
        message: result.feedbackMessage,
      });

      setAnswers((prev) => [
        ...prev,
        {
          exerciseIndex: currentIndex,
          userAnswer,
          correctAnswer: currentExercise.correctAnswer,
          accepted: result.accepted,
          errorType: result.errorType,
        },
      ]);
    },
    [currentExercise, currentIndex, feedback],
  );

  // --- Render ---

  if (!lessonId) {
    return (
      <div className="mx-auto max-w-2xl pt-12">
        <EmptyState title="No lesson selected" />
      </div>
    );
  }

  if (isLoading) return <LoadingSpinner />;

  if (exerciseList.length === 0) {
    return (
      <div className="mx-auto max-w-2xl pt-12">
        <EmptyState
          title="No conjugation exercises"
          description="This lesson doesn't have target verbs to practice."
        />
        <div className="mt-4 text-center">
          <button onClick={() => navigate(`/lessons/${lessonId}`)} className="text-sm" style={{ color: 'var(--color-accent)' }}>
            Back to Lesson
          </button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const accuracy = answers.length > 0 ? Math.round((totalCorrect / answers.length) * 100) : 0;
    return (
      <div className="mx-auto max-w-lg pt-12">
        <div
          className="rounded-lg border p-8 text-center"
          style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        >
          <h2 className="mb-2 text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Conjugation Practice Complete
          </h2>
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>{accuracy}%</p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Accuracy</p>
            </div>
            <div>
              <p className="text-3xl font-bold" style={{ color: 'var(--color-success)' }}>{totalCorrect}/{answers.length}</p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Correct</p>
            </div>
          </div>

          {/* Answer breakdown */}
          <div className="mb-6 space-y-1 text-left">
            {answers.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded px-3 py-1.5 text-sm"
                style={{
                  backgroundColor: a.accepted ? 'var(--color-success-light)' : 'var(--color-error-light)',
                  color: a.accepted ? 'var(--color-success-text)' : 'var(--color-error-text)',
                }}
              >
                <span>Q{i + 1}: {a.userAnswer}</span>
                <span className="text-xs">
                  {a.accepted ? 'Correct' : `${a.errorType} — ${a.correctAnswer}`}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(`/lessons/${lessonId}`)}
              className="rounded-lg border px-6 py-2.5 text-sm font-medium"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              Back to Lesson
            </button>
            <button
              onClick={() => { setCurrentIndex(0); setAnswers([]); setFeedback(null); }}
              className="rounded-lg px-6 py-2.5 text-sm font-medium"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text-inverse)' }}
            >
              Practice Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const exercise = currentExercise!;

  return (
    <div className="mx-auto max-w-2xl pt-4">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="mb-1 flex items-center justify-between text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <span>Question {currentIndex + 1} of {exerciseList.length}</span>
          <span
            className="rounded px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: 'var(--color-badge-orange)', color: 'var(--color-badge-orange-text)' }}
          >
            Conjugation
          </span>
        </div>
        <div className="h-2 w-full rounded-full" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              backgroundColor: 'var(--color-accent)',
              width: `${((currentIndex + 1) / exerciseList.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Exercise */}
      {exercise.exerciseType === 'conjugation-typed' && (
        <ConjugationTypedExercise
          verbInfinitive={exercise.verbInfinitive}
          verbTranslation={exercise.verbTranslation ?? ''}
          pronoun={exercise.pronoun}
          correctAnswer={exercise.correctAnswer}
          onAnswer={handleAnswer}
          feedback={feedback}
          disabled={!!feedback}
        />
      )}

      {exercise.exerciseType === 'conjugation-in-sentence' && (
        <ConjugationInSentenceExercise
          renderedPrompt={exercise.renderedPrompt}
          sentenceTranslation={exercise.sentenceTranslation ?? ''}
          verbInfinitive={exercise.verbInfinitive}
          correctAnswer={exercise.correctAnswer}
          onAnswer={handleAnswer}
          feedback={feedback}
          disabled={!!feedback}
        />
      )}

      {/* Next button */}
      {feedback && (
        <>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setCurrentIndex((i) => i + 1)}
              className="rounded-lg px-6 py-2.5 text-sm font-medium"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text-inverse)' }}
            >
              Next
            </button>
          </div>
          <p className="mt-2 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Press Enter for next
          </p>
        </>
      )}
    </div>
  );
}
