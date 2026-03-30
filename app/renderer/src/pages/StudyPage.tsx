import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLessonContent, useVocabulary } from '../hooks/useContentQueries';
import { api } from '../lib/api';
import { ExerciseShell } from '../features/study/components/ExerciseShell';
import { MultipleChoiceExercise } from '../features/study/components/MultipleChoiceExercise';
import { TypedGapFillExercise } from '../features/study/components/TypedGapFillExercise';
import { DialogCompletionExercise } from '../features/study/components/DialogCompletionExercise';
import { SessionSummary } from '../features/study/components/SessionSummary';
import {
  useStudySession,
  type StudyExercise,
} from '../features/study/hooks/useStudySession';
import { useSessionPersistence } from '../features/study/hooks/useSessionPersistence';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

// --- Exercise generation helpers ---

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function generateGapFillExercises(
  sentences: any[],
  vocabulary: any[],
): StudyExercise[] {
  const baseExercises: Array<{
    sentence: any;
    vocab: any;
    prompt: string;
    correctAnswer: string;
  }> = [];

  for (const sentence of sentences) {
    for (const vocab of vocabulary) {
      const regex = new RegExp(`\\b${escapeRegex(vocab.lemma)}\\b`, 'i');
      const match = regex.exec(sentence.text);
      if (!match) continue;

      baseExercises.push({
        sentence,
        vocab,
        prompt:
          sentence.text.substring(0, match.index) +
          '____' +
          sentence.text.substring(match.index + match[0].length),
        correctAnswer: match[0].toLowerCase(),
      });
      break;
    }
  }

  const midpoint = Math.ceil(baseExercises.length / 2);
  const exercises: StudyExercise[] = [];

  for (let i = 0; i < baseExercises.length; i++) {
    const { sentence, vocab, prompt, correctAnswer } = baseExercises[i];
    const isMC = i < midpoint;

    if (isMC) {
      const distractors = vocabulary
        .filter((v: any) => v.lemma.toLowerCase() !== vocab.lemma.toLowerCase())
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((v: any) => v.lemma.toLowerCase());

      const allOptions = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);

      exercises.push({
        exerciseType: 'multiple-choice-gap-fill',
        sourceEntityType: 'sentence',
        sourceEntityId: sentence.id,
        renderedPrompt: prompt,
        sentenceTranslation: sentence.translation,
        targetWord: vocab.lemma,
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
        targetWord: vocab.lemma,
        correctAnswer,
      });
    }
  }

  return exercises;
}

const SKIP_WORDS = new Set([
  'ik', 'je', 'u', 'we', 'ze', 'het', 'de', 'een', 'en', 'of', 'in',
  'op', 'is', 'dat', 'er', 'ja', 'nee', 'met', 'van', 'voor', 'naar',
  'aan', 'om', 'al', 'ook', 'nog', 'maar', 'dan', 'wel', 'niet', 'kan',
  'dit', 'die', 'wat', 'hoe',
]);

function pickTargetWord(text: string): { word: string; start: number; end: number } | null {
  const wordRegex = /[a-zA-ZÀ-ÿ]+/g;
  const candidates: Array<{ word: string; start: number; end: number }> = [];
  let m;
  while ((m = wordRegex.exec(text)) !== null) {
    if (m[0].length >= 3 && !SKIP_WORDS.has(m[0].toLowerCase())) {
      candidates.push({ word: m[0], start: m.index, end: m.index + m[0].length });
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.word.length - a.word.length);
  const top = candidates.slice(0, Math.max(1, Math.ceil(candidates.length / 2)));
  return top[Math.floor(Math.random() * top.length)];
}

function generateDialogExercisesFromTurns(
  turns: any[],
  vocabLemmas: string[],
): StudyExercise[] {
  const exercises: StudyExercise[] = [];

  for (let i = 1; i < turns.length && exercises.length < 3; i++) {
    const targetTurn = turns[i];
    const target = pickTargetWord(targetTurn.text);
    if (!target) continue;

    const contextTurns = turns.slice(0, i + 1).map((t: any, idx: number) => ({
      speaker: t.speaker,
      text: idx === i
        ? t.text.substring(0, target.start) + '____' + t.text.substring(target.end)
        : t.text,
      isTarget: idx === i,
    }));

    const correctAnswer = target.word.toLowerCase();
    const dialogMode = exercises.length % 2 === 0 ? 'mc' : 'typed';

    const exercise: StudyExercise = {
      exerciseType: 'dialog-completion',
      sourceEntityType: 'dialog_turn',
      sourceEntityId: targetTurn.id,
      renderedPrompt: contextTurns.find((t: any) => t.isTarget)?.text ?? '',
      sentenceTranslation: targetTurn.translation,
      targetWord: target.word,
      correctAnswer,
      dialogContextTurns: contextTurns,
      dialogMode,
    };

    if (dialogMode === 'mc') {
      const distractors = vocabLemmas
        .filter((w) => w.toLowerCase() !== correctAnswer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const allOptions = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
      exercise.options = allOptions;
      exercise.correctIndex = allOptions.indexOf(correctAnswer);
    }

    exercises.push(exercise);
  }

  return exercises;
}

// --- StudyPage component ---

export function StudyPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const { data: lessonContent, isLoading: contentLoading } =
    useLessonContent(lessonId);

  const vocabGroup = lessonContent?.classGroups?.find(
    (g: any) => g.type === 'vocabulary',
  );
  const { data: vocabulary, isLoading: vocabLoading } = useVocabulary(
    vocabGroup?.id,
  );

  // Fetch dialog turns for the first dialog in the lesson
  const hasDialogs = (lessonContent?.dialogs?.length ?? 0) > 0;
  const firstDialog = lessonContent?.dialogs?.[0];
  const { data: dialogTurns, isLoading: dialogLoading } = useQuery({
    queryKey: ['dialogTurns', firstDialog?.id],
    queryFn: () => api.content.getDialogTurns(firstDialog!.id),
    enabled: !!firstDialog?.id,
  });
  // Dialog data is "ready" when either there are no dialogs, or turns have loaded
  const dialogReady = !hasDialogs || (!dialogLoading && dialogTurns !== undefined);

  const session = useStudySession();
  const persistence = useSessionPersistence();
  const initialized = useRef(false);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    message: string;
  } | null>(null);
  const [sessionStats, setSessionStats] = useState<any>(null);
  const answerStartTime = useRef(Date.now());

  // ALL hooks before any early returns

  // Initialize exercises when ALL content loads (including dialog turns)
  useEffect(() => {
    if (initialized.current) return;
    if (!lessonContent?.sentences || lessonContent.sentences.length === 0) return;
    if (!vocabulary || vocabulary.length === 0) return;
    if (!dialogReady) return;

    const gapFillExercises = generateGapFillExercises(
      lessonContent.sentences,
      vocabulary,
    );

    const vocabLemmas = vocabulary.map((v: any) => v.lemma);
    const dialogExercises =
      dialogTurns && dialogTurns.length > 1
        ? generateDialogExercisesFromTurns(dialogTurns, vocabLemmas)
        : [];

    // Interleave: gap-fills first, then dialogs at the end
    const allExercises = [...gapFillExercises, ...dialogExercises];

    initialized.current = true;

    if (allExercises.length > 0) {
      session.startSession(allExercises);
      persistence.startPersistedSession('learn', lessonId);
    }
  }, [lessonContent, vocabulary, dialogTurns, dialogReady]);

  // Reset timer on new exercise
  useEffect(() => {
    answerStartTime.current = Date.now();
    setFeedback(null);
  }, [session.currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!feedback) return;
      const exercise = session.currentExercise;
      if (exercise?.exerciseType === 'multiple-choice-gap-fill') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          session.nextExercise();
        }
      } else if (
        exercise?.exerciseType === 'typed-gap-fill' ||
        exercise?.exerciseType === 'dialog-completion'
      ) {
        if (e.key === 'Enter') {
          e.preventDefault();
          session.nextExercise();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [feedback, session.currentExercise, session.nextExercise]);

  // End persisted session when complete
  useEffect(() => {
    if (session.isComplete && !sessionStats) {
      persistence.endPersistedSession().then((stats) => {
        if (stats) setSessionStats(stats);
      });
    }
  }, [session.isComplete, sessionStats]);

  const handleMCAnswer = useCallback(
    (selectedIndex: number, correct: boolean) => {
      const responseTimeMs = Date.now() - answerStartTime.current;
      const exercise = session.currentExercise!;
      const userAnswer = exercise.options![selectedIndex];

      session.submitAnswer(userAnswer, correct, responseTimeMs);
      persistence.persistAnswer(exercise.sourceEntityId, userAnswer, correct, responseTimeMs, false);

      setFeedback({
        correct,
        message: correct ? 'Correct!' : `Incorrect. The answer is: ${exercise.correctAnswer}`,
      });
    },
    [session, persistence],
  );

  const handleTypedAnswer = useCallback(
    (userAnswer: string, isCorrect: boolean, isTypo: boolean) => {
      const responseTimeMs = Date.now() - answerStartTime.current;
      const exercise = session.currentExercise!;

      session.submitAnswer(userAnswer, isCorrect, responseTimeMs);
      persistence.persistAnswer(exercise.sourceEntityId, userAnswer, isCorrect, responseTimeMs, false);

      if (isCorrect && !isTypo) {
        setFeedback({ correct: true, message: 'Correct!' });
      } else if (isCorrect && isTypo) {
        setFeedback({ correct: true, message: `Close enough! The exact answer is: ${exercise.correctAnswer}` });
      } else {
        setFeedback({ correct: false, message: `Incorrect. The answer is: ${exercise.correctAnswer}` });
      }
    },
    [session, persistence],
  );

  const handleDialogAnswer = useCallback(
    (userAnswer: string, correct: boolean) => {
      const responseTimeMs = Date.now() - answerStartTime.current;
      const exercise = session.currentExercise!;

      session.submitAnswer(userAnswer, correct, responseTimeMs);
      persistence.persistAnswer(exercise.sourceEntityId, userAnswer, correct, responseTimeMs, false);

      setFeedback({
        correct,
        message: correct ? 'Correct!' : `Incorrect. The answer is: ${exercise.correctAnswer}`,
      });
    },
    [session, persistence],
  );

  // --- Render ---

  if (!lessonId) {
    return (
      <div className="mx-auto max-w-2xl pt-12">
        <EmptyState title="No lesson selected" description="Go to Courses to pick a lesson to study." />
      </div>
    );
  }

  if (contentLoading || vocabLoading || !dialogReady) return <LoadingSpinner />;

  if (initialized.current && session.exercises.length === 0) {
    return (
      <div className="mx-auto max-w-2xl pt-12">
        <EmptyState
          title="No exercises available"
          description="This lesson doesn't have enough content to generate exercises."
        />
        <div className="mt-4 text-center">
          <button onClick={() => navigate(`/lessons/${lessonId}`)} className="text-sm" style={{ color: 'var(--color-accent)' }}>
            Go Back
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
          lessonId={lessonId}
        />
      </div>
    );
  }

  const exercise = session.currentExercise!;

  if (exercise.exerciseType === 'dialog-completion') {
    return (
      <div className="mx-auto max-w-2xl pt-4">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="mb-1 flex items-center justify-between text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <span>Question {session.currentIndex + 1} of {session.exercises.length}</span>
            <span className="rounded px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success-text)' }}>
              Dialog
            </span>
          </div>
          <div className="h-2 w-full rounded-full" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{ backgroundColor: 'var(--color-accent)', width: `${((session.currentIndex + 1) / session.exercises.length) * 100}%` }}
            />
          </div>
        </div>

        <DialogCompletionExercise
          contextTurns={exercise.dialogContextTurns!}
          targetTranslation={exercise.sentenceTranslation}
          correctAnswer={exercise.correctAnswer}
          mode={exercise.dialogMode!}
          options={exercise.options}
          correctIndex={exercise.correctIndex}
          onAnswer={handleDialogAnswer}
          disabled={!!feedback}
        />

        {feedback && (
          <>
            <div className="mt-4 flex justify-end">
              <button
                onClick={session.nextExercise}
                className="rounded-lg px-6 py-2.5 text-sm font-medium"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text-inverse)' }}
              >
                Next
              </button>
            </div>
            <p className="mt-2 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Press Enter for next question
            </p>
          </>
        )}
      </div>
    );
  }

  // Gap-fill exercises (MC and typed)
  const isTyped = exercise.exerciseType === 'typed-gap-fill';

  return (
    <div className="pt-4">
      <ExerciseShell
        current={session.currentIndex + 1}
        total={session.exercises.length}
        prompt={exercise.renderedPrompt}
        translation={exercise.sentenceTranslation}
        feedback={isTyped ? null : feedback}
        showNext={!!feedback}
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

      {feedback && (
        <p className="mt-2 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          Press Enter for next question
        </p>
      )}
    </div>
  );
}
