import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLessonContent, useVocabulary } from '../hooks/useContentQueries';
import { api } from '../lib/api';
import { ExerciseShell } from '../features/study/components/ExerciseShell';
import { MultipleChoiceExercise } from '../features/study/components/MultipleChoiceExercise';
import { TypedGapFillExercise } from '../features/study/components/TypedGapFillExercise';
import { DialogCompletionExercise } from '../features/study/components/DialogCompletionExercise';
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
import { WordOrderExercise } from '../features/study/components/WordOrderExercise';
import { SESSION_MODES, type SessionModeId } from '../../../backend/domain/session/sessionModes';
import { detectFrustration, frustrationMessage, type AnswerSignal } from '../../../backend/domain/session/frustrationDetector';
import { tokenizeSentence } from '../../../backend/domain/exercise-generation/wordOrderGenerator';
import { generateFeedback } from '../../../backend/domain/evaluation/feedbackGenerator';
import { generateBlank } from '../../../backend/domain/exercise-generation/gapModes';
import { useAppStore } from '../lib/store';

// --- Exercise generation helpers ---

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function generateGapFillExercises(
  sentences: any[],
  vocabulary: any[],
  gapMode: 'MASKED' | 'LENGTH_HINT' = 'MASKED',
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

      const blank = generateBlank(match[0], gapMode);
      baseExercises.push({
        sentence,
        vocab,
        prompt:
          sentence.text.substring(0, match.index) +
          blank +
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

function generateWordOrderExercises(
  sentences: any[],
  maxExercises = 3,
): StudyExercise[] {
  const exercises: StudyExercise[] = [];
  // Shuffle sentence order to get variety
  const shuffledSentences = [...sentences].sort(() => Math.random() - 0.5);

  for (const sentence of shuffledSentences) {
    if (exercises.length >= maxExercises) break;
    const tokens = tokenizeSentence(sentence.text);
    if (tokens.length < 3) continue;

    // Shuffle tokens
    const shuffled = [...tokens].sort(() => Math.random() - 0.5);
    // Ensure shuffled differs from original
    if (shuffled.every((t: string, i: number) => t === tokens[i])) {
      // Swap first two if identical
      if (shuffled.length >= 2) [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
      else continue;
    }

    exercises.push({
      exerciseType: 'word-order',
      sourceEntityType: 'sentence',
      sourceEntityId: sentence.id,
      renderedPrompt: '',
      sentenceTranslation: sentence.translation,
      targetWord: '',
      correctAnswer: sentence.text,
      shuffledTokens: shuffled,
      correctTokens: tokens,
    });
  }

  return exercises;
}

// --- StudyPage component ---

export function StudyPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modeId = (searchParams.get('mode') ?? 'normal') as SessionModeId;
  const modeConfig = SESSION_MODES[modeId] ?? SESSION_MODES.normal;
  const gapMode = useAppStore((s) => s.gapMode);

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
  const [awaitingConfidence, setAwaitingConfidence] = useState(false);
  const [sessionStats, setSessionStats] = useState<any>(null);
  const answerStartTime = useRef(Date.now());
  const answerSignals = useRef<AnswerSignal[]>([]);
  const [frustrationMsg, setFrustrationMsg] = useState<string | null>(null);

  // ALL hooks before any early returns

  // Initialize exercises when ALL content loads (including dialog turns)
  useEffect(() => {
    if (initialized.current) return;
    if (!lessonContent?.sentences || lessonContent.sentences.length === 0) return;
    if (!vocabulary || vocabulary.length === 0) return;
    if (!dialogReady) return;

    let gapFillExercises = generateGapFillExercises(
      lessonContent.sentences,
      vocabulary,
      gapMode,
    );

    // In low-energy mode, only keep MC exercises
    if (modeId === 'low-energy') {
      gapFillExercises = gapFillExercises.filter(
        (e) => e.exerciseType === 'multiple-choice-gap-fill',
      );
    }

    const vocabLemmas = vocabulary.map((v: any) => v.lemma);
    const dialogExercises =
      modeId !== 'low-energy' && dialogTurns && dialogTurns.length > 1
        ? generateDialogExercisesFromTurns(dialogTurns, vocabLemmas)
        : [];

    // Word order exercises: normal mode gets 1-2, deep mode gets 2-3
    const wordOrderExercises =
      modeConfig.exerciseTypes.includes('word-order')
        ? generateWordOrderExercises(lessonContent.sentences, modeId === 'deep' ? 3 : 2)
        : modeId === 'normal'
          ? generateWordOrderExercises(lessonContent.sentences, 1)
          : [];

    // Combine: gap-fills → word order → dialogs, trim to mode max
    const allExercises = [
      ...gapFillExercises,
      ...wordOrderExercises,
      ...dialogExercises,
    ].slice(0, modeConfig.maxExercises);

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
    setAwaitingConfidence(false);
  }, [session.currentIndex]);

  // No keyboard-advance effect needed — ConfidenceWidget handles 1/2/3 keys

  // End persisted session when complete
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
    (userAnswer: string, correct: boolean, hintUsed: boolean, exerciseType: string) => {
      const exercise = session.currentExercise!;
      const fb = generateFeedback({
        userAnswer,
        correctAnswer: exercise.correctAnswer,
        isCorrect: correct,
        hintUsed,
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
      makeFeedback(userAnswer, correct, false, exercise.exerciseType);
    },
    [session, persistence, trackFrustration, makeFeedback],
  );

  const handleTypedAnswer = useCallback(
    (userAnswer: string, isCorrect: boolean, isTypo: boolean) => {
      const responseTimeMs = Date.now() - answerStartTime.current;
      const exercise = session.currentExercise!;

      session.submitAnswer(userAnswer, isCorrect, responseTimeMs);
      persistence.persistAnswer(exercise.sourceEntityId, userAnswer, isCorrect, responseTimeMs, false);
      trackFrustration(isCorrect, responseTimeMs, false);
      makeFeedback(userAnswer, isCorrect, false, exercise.exerciseType);
    },
    [session, persistence, trackFrustration, makeFeedback],
  );

  const handleDialogAnswer = useCallback(
    (userAnswer: string, correct: boolean) => {
      const responseTimeMs = Date.now() - answerStartTime.current;
      const exercise = session.currentExercise!;

      session.submitAnswer(userAnswer, correct, responseTimeMs);
      persistence.persistAnswer(exercise.sourceEntityId, userAnswer, correct, responseTimeMs, false);
      trackFrustration(correct, responseTimeMs, false);
      makeFeedback(userAnswer, correct, false, exercise.exerciseType);
    },
    [session, persistence, trackFrustration],
  );

  const handleWordOrderAnswer = useCallback(
    (userTokens: string[], correct: boolean) => {
      const responseTimeMs = Date.now() - answerStartTime.current;
      const exercise = session.currentExercise!;
      const userAnswer = userTokens.join(' ');

      session.submitAnswer(userAnswer, correct, responseTimeMs);
      persistence.persistAnswer(exercise.sourceEntityId, userAnswer, correct, responseTimeMs, false);
      trackFrustration(correct, responseTimeMs, false);

      setFeedback({
        correct,
        message: correct ? 'Correct word order!' : `Incorrect. The correct order is: ${exercise.correctAnswer}`,
      });
      setAwaitingConfidence(true);
    },
    [session, persistence, trackFrustration],
  );

  const handleConfidenceSelect = useCallback(
    (confidence: 0 | 1 | 2) => {
      setAwaitingConfidence(false);
      // TODO: persist confidence to session answer (will be wired when IPC supports it)
      session.nextExercise();
    },
    [session],
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
        {frustrationMsg && <FrustrationBanner message={frustrationMsg} />}
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

        {feedback && awaitingConfidence && (
          <div className="mt-4">
            <ConfidenceWidget onSelect={handleConfidenceSelect} />
          </div>
        )}
      </div>
    );
  }

  if (exercise.exerciseType === 'word-order') {
    return (
      <div className="mx-auto max-w-2xl pt-4">
        {frustrationMsg && <FrustrationBanner message={frustrationMsg} />}
        {/* Progress bar */}
        <div className="mb-6">
          <div className="mb-1 flex items-center justify-between text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <span>Question {session.currentIndex + 1} of {session.exercises.length}</span>
            <span className="rounded px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-badge-purple)', color: 'var(--color-badge-purple-text)' }}>
              Word Order
            </span>
          </div>
          <div className="h-2 w-full rounded-full" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{ backgroundColor: 'var(--color-accent)', width: `${((session.currentIndex + 1) / session.exercises.length) * 100}%` }}
            />
          </div>
        </div>

        <p className="mb-4 text-center text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          Put the words in the correct order
        </p>

        <WordOrderExercise
          shuffledTokens={exercise.shuffledTokens!}
          correctTokens={exercise.correctTokens!}
          translation={exercise.sentenceTranslation}
          onAnswer={handleWordOrderAnswer}
          disabled={!!feedback}
        />

        {feedback && awaitingConfidence && (
          <div className="mt-4">
            <ConfidenceWidget onSelect={handleConfidenceSelect} />
          </div>
        )}
      </div>
    );
  }

  // Gap-fill exercises (MC and typed)
  const isTyped = exercise.exerciseType === 'typed-gap-fill';

  return (
    <div className="pt-4">
      {frustrationMsg && <FrustrationBanner message={frustrationMsg} />}
      <ExerciseShell
        current={session.currentIndex + 1}
        total={session.exercises.length}
        prompt={exercise.renderedPrompt}
        translation={exercise.sentenceTranslation}
        feedback={isTyped ? null : feedback}
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
