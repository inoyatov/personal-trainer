import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { ExerciseShell } from '../features/study/components/ExerciseShell';
import { MultipleChoiceExercise } from '../features/study/components/MultipleChoiceExercise';
import { TypedGapFillExercise } from '../features/study/components/TypedGapFillExercise';
import { SessionSummary } from '../features/study/components/SessionSummary';
import { ConfidenceWidget } from '../features/study/components/ConfidenceWidget';
import { FrustrationBanner } from '../features/study/components/FrustrationBanner';
import {
  useStudySession,
  type StudyExercise,
} from '../features/study/hooks/useStudySession';
import { useSessionPersistence } from '../features/study/hooks/useSessionPersistence';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useAppStore } from '../lib/store';
import { generateBlank } from '../../../backend/domain/exercise-generation/gapModes';
import { generateFeedback } from '../../../backend/domain/evaluation/feedbackGenerator';
import { detectFrustration, frustrationMessage, type AnswerSignal } from '../../../backend/domain/session/frustrationDetector';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate exercises from review sentences.
 * Mix of MC (first half) and typed (second half).
 */
function generateReviewExercises(
  sentences: any[],
  gapMode: 'MASKED' | 'LENGTH_HINT' = 'MASKED',
): StudyExercise[] {
  const exercises: StudyExercise[] = [];

  // Extract words from sentences as potential targets and distractors
  const allWords: string[] = [];
  for (const s of sentences) {
    const words = s.text.match(/[a-zA-ZÀ-ÿ]{3,}/g) ?? [];
    for (const w of words) {
      if (!allWords.includes(w.toLowerCase())) allWords.push(w.toLowerCase());
    }
  }

  const midpoint = Math.ceil(sentences.length / 2);

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    // Pick a content word (>= 3 chars, not a function word) from the sentence
    const skipWords = new Set(['het', 'een', 'van', 'voor', 'naar', 'met', 'aan', 'ook', 'nog', 'maar', 'dan', 'wel', 'niet']);
    const words = (sentence.text.match(/[a-zA-ZÀ-ÿ]+/g) ?? []).filter(
      (w: string) => w.length >= 3 && !skipWords.has(w.toLowerCase()),
    );
    if (words.length === 0) continue;

    // Pick the longest word as target
    const target = words.sort((a: string, b: string) => b.length - a.length)[0];
    const regex = new RegExp(`\\b${escapeRegex(target)}\\b`, 'i');
    const match = regex.exec(sentence.text);
    if (!match) continue;

    const blank = generateBlank(match[0], gapMode);
    const prompt =
      sentence.text.substring(0, match.index) +
      blank +
      sentence.text.substring(match.index + match[0].length);

    const correctAnswer = match[0].toLowerCase();
    const isMC = i < midpoint;

    if (isMC) {
      const distractors = allWords
        .filter((w) => w !== correctAnswer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const allOptions = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);

      exercises.push({
        exerciseType: 'multiple-choice-gap-fill',
        sourceEntityType: 'sentence',
        sourceEntityId: sentence.id,
        renderedPrompt: prompt,
        sentenceTranslation: sentence.translation,
        targetWord: target,
        correctAnswer,
        options: allOptions,
        correctIndex: allOptions.indexOf(correctAnswer),
      });
    } else {
      exercises.push({
        exerciseType: 'typed-gap-fill',
        sourceEntityType: 'sentence',
        sourceEntityId: sentence.id,
        renderedPrompt: prompt,
        sentenceTranslation: sentence.translation,
        targetWord: target,
        correctAnswer,
      });
    }
  }

  return exercises;
}

export function ReviewStudyPage() {
  const navigate = useNavigate();
  const gapMode = useAppStore((s) => s.gapMode);

  const { data: reviewData, isLoading } = useQuery({
    queryKey: ['reviewExercises'],
    queryFn: () => api.review.getExercises(),
  });

  const session = useStudySession();
  const persistence = useSessionPersistence();
  const initialized = useRef(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [awaitingConfidence, setAwaitingConfidence] = useState(false);
  const [sessionStats, setSessionStats] = useState<any>(null);
  const answerStartTime = useRef(Date.now());
  const answerSignals = useRef<AnswerSignal[]>([]);
  const [frustrationMsg, setFrustrationMsg] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    if (initialized.current || !reviewData?.sentences?.length) return;

    const exercises = generateReviewExercises(reviewData.sentences, gapMode);
    if (exercises.length > 0) {
      session.startSession(exercises.slice(0, 15));
      persistence.startPersistedSession('review');
      initialized.current = true;
    }
  }, [reviewData]);

  useEffect(() => {
    answerStartTime.current = Date.now();
    setFeedback(null);
    setAwaitingConfidence(false);
  }, [session.currentIndex]);

  useEffect(() => {
    if (session.isComplete && !sessionStats) {
      persistence.endPersistedSession().then((stats) => {
        if (stats) setSessionStats(stats);
      });
    }
  }, [session.isComplete, sessionStats]);

  const trackFrustration = useCallback(
    (isCorrect: boolean, responseTimeMs: number, hintUsed: boolean) => {
      answerSignals.current.push({ isCorrect, responseTimeMs, hintUsed });
      const state = detectFrustration(answerSignals.current);
      if (state.isFrustrated && !frustrationMsg) {
        setFrustrationMsg(frustrationMessage(state));
      }
    },
    [frustrationMsg],
  );

  const makeFeedback = useCallback(
    (userAnswer: string, correct: boolean, exerciseType: string) => {
      const exercise = session.currentExercise!;
      const fb = generateFeedback({
        userAnswer,
        correctAnswer: exercise.correctAnswer,
        isCorrect: correct,
        hintUsed: false,
        exerciseType,
      });
      setFeedback({ correct, message: fb.message });
      setAwaitingConfidence(true);
    },
    [session],
  );

  const handleMCAnswer = useCallback(
    (selectedIndex: number, correct: boolean) => {
      const responseTimeMs = Date.now() - answerStartTime.current;
      const exercise = session.currentExercise!;
      const userAnswer = exercise.options![selectedIndex];
      session.submitAnswer(userAnswer, correct, responseTimeMs);
      persistence.persistAnswer(exercise.sourceEntityId, userAnswer, correct, responseTimeMs, false);
      trackFrustration(correct, responseTimeMs, false);
      makeFeedback(userAnswer, correct, exercise.exerciseType);
    },
    [session, persistence, trackFrustration, makeFeedback],
  );

  const handleTypedAnswer = useCallback(
    (userAnswer: string, isCorrect: boolean, _isTypo: boolean) => {
      const responseTimeMs = Date.now() - answerStartTime.current;
      const exercise = session.currentExercise!;
      session.submitAnswer(userAnswer, isCorrect, responseTimeMs);
      persistence.persistAnswer(exercise.sourceEntityId, userAnswer, isCorrect, responseTimeMs, false);
      trackFrustration(isCorrect, responseTimeMs, false);
      makeFeedback(userAnswer, isCorrect, exercise.exerciseType);
    },
    [session, persistence, trackFrustration, makeFeedback],
  );

  const handleConfidenceSelect = useCallback(
    (_confidence: 0 | 1 | 2) => {
      setAwaitingConfidence(false);
      session.nextExercise();
    },
    [session],
  );

  // Render

  if (isLoading) return <LoadingSpinner />;

  if (reviewData && reviewData.sentences.length === 0) {
    return (
      <div className="mx-auto max-w-2xl pt-12">
        <EmptyState title="No items to review" description="All caught up! Come back later." />
        <div className="mt-4 text-center">
          <button onClick={() => navigate('/')} className="text-sm" style={{ color: 'var(--color-accent)' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (session.exercises.length === 0) return <LoadingSpinner />;

  if (session.isComplete) {
    return (
      <div className="pt-12">
        <SessionSummary
          answers={session.answers}
          totalCorrect={session.totalCorrect}
          totalQuestions={session.exercises.length}
          sessionStats={sessionStats}
        />
      </div>
    );
  }

  const exercise = session.currentExercise!;

  return (
    <div className="pt-4">
      {frustrationMsg && <FrustrationBanner message={frustrationMsg} />}
      <ExerciseShell
        current={session.currentIndex + 1}
        total={session.exercises.length}
        prompt={exercise.renderedPrompt}
        translation={exercise.sentenceTranslation}
        feedback={exercise.exerciseType === 'typed-gap-fill' ? null : feedback}
        showNext={false}
        onNext={session.nextExercise}
      >
        {exercise.exerciseType === 'multiple-choice-gap-fill' && (
          <MultipleChoiceExercise
            options={exercise.options!}
            correctIndex={exercise.correctIndex!}
            onAnswer={handleMCAnswer}
            disabled={!!feedback}
          />
        )}
        {exercise.exerciseType === 'typed-gap-fill' && (
          <TypedGapFillExercise
            correctAnswer={exercise.correctAnswer}
            onAnswer={handleTypedAnswer}
            disabled={!!feedback}
          />
        )}
      </ExerciseShell>

      {feedback && awaitingConfidence && (
        <div className="mx-auto mt-4 max-w-2xl">
          <ConfidenceWidget onSelect={handleConfidenceSelect} />
        </div>
      )}
    </div>
  );
}
