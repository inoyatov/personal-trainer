import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '../../../lib/api';

export interface UnifiedExercise {
  id: string;
  exerciseType: string;
  sourceEntityType: string;
  sourceEntityId: string;
  renderedPrompt: string;
  correctAnswer: string;
  sentenceTranslation?: string;
  targetWord?: string;
  options?: string[];
  correctIndex?: number;
  metadata: Record<string, unknown>;
}

export interface UnifiedAnswerRecord {
  exerciseIndex: number;
  exerciseId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  responseTimeMs: number;
  hintUsed: boolean;
}

interface SessionMeta {
  mode: string;
  courseId: string;
  coldStartPhase: string;
  frontierLessonId: string | null;
  adaptationApplied: boolean;
}

interface UseUnifiedSessionReturn {
  exercises: UnifiedExercise[];
  currentIndex: number;
  currentExercise: UnifiedExercise | null;
  answers: UnifiedAnswerRecord[];
  isComplete: boolean;
  isLoading: boolean;
  error: string | null;
  totalCorrect: number;
  sessionMeta: SessionMeta | null;
  sessionStats: any;
  submitAnswer: (userAnswer: string, isCorrect: boolean, responseTimeMs: number, hintUsed?: boolean) => void;
  nextExercise: () => void;
}

let answerCounter = 0;
function generateId(): string {
  answerCounter++;
  return `${Date.now()}-${answerCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useUnifiedSession(
  courseId: string | undefined,
  mode: 'unified-learning' | 'conjugation-practice' = 'unified-learning',
): UseUnifiedSessionReturn {
  const [exercises, setExercises] = useState<UnifiedExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UnifiedAnswerRecord[]>([]);
  const [answered, setAnswered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionMeta, setSessionMeta] = useState<SessionMeta | null>(null);
  const [sessionStats, setSessionStats] = useState<any>(null);
  const sessionIdRef = useRef<string | null>(null);
  const initialized = useRef(false);

  const currentExercise = currentIndex < exercises.length ? exercises[currentIndex] : null;
  const isComplete = exercises.length > 0 && currentIndex >= exercises.length;
  const totalCorrect = answers.filter((a) => a.isCorrect).length;

  // Initialize session
  useEffect(() => {
    if (!courseId || initialized.current) return;
    initialized.current = true;

    async function init() {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Build session via unified engine
        const plan = await api.session.buildUnified({
          courseId,
          mode,
        });

        if (!plan.exercises || plan.exercises.length === 0) {
          setError('No exercises available. Complete some lessons first.');
          setIsLoading(false);
          return;
        }

        setExercises(plan.exercises);
        setSessionMeta(plan.sessionMeta);

        // 2. Create persisted session
        const sourceScope = JSON.stringify({ courseId });
        const session = await api.session.create({
          mode: 'unified-learning',
          sourceScope,
        });
        sessionIdRef.current = session.id;

        setIsLoading(false);
      } catch (err: any) {
        console.error('Failed to initialize unified session:', err);
        setError(err.message ?? 'Failed to start session');
        setIsLoading(false);
      }
    }

    init();
  }, [courseId, mode]);

  // End session when complete
  useEffect(() => {
    if (!isComplete || !sessionIdRef.current) return;

    async function endSession() {
      try {
        await api.session.end(sessionIdRef.current!);
        const stats = await api.session.getStats(sessionIdRef.current!);
        setSessionStats(stats);
      } catch (err) {
        console.error('Failed to end session:', err);
      }
    }

    endSession();
  }, [isComplete]);

  // Abandon session on unmount or window close (if not completed)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionIdRef.current && !isComplete) {
        api.session.abandon(sessionIdRef.current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Component unmount (navigation away) — abandon if not complete
      if (sessionIdRef.current && !isComplete) {
        api.session.abandon(sessionIdRef.current);
      }
    };
  }, [isComplete]);

  const submitAnswer = useCallback(
    (userAnswer: string, isCorrect: boolean, responseTimeMs: number, hintUsed = false) => {
      if (!currentExercise || answered) return;

      const record: UnifiedAnswerRecord = {
        exerciseIndex: currentIndex,
        exerciseId: currentExercise.id,
        userAnswer,
        correctAnswer: currentExercise.correctAnswer,
        isCorrect,
        responseTimeMs,
        hintUsed,
      };

      setAnswers((prev) => [...prev, record]);
      setAnswered(true);

      // Persist answer to backend
      if (sessionIdRef.current) {
        api.session.submitAnswer({
          id: generateId(),
          sessionId: sessionIdRef.current,
          exerciseInstanceId: currentExercise.id,
          exerciseType: currentExercise.exerciseType,
          sourceEntityType: currentExercise.sourceEntityType,
          sourceEntityId: currentExercise.sourceEntityId,
          userAnswer,
          isCorrect,
          responseTimeMs,
          hintUsed,
        }).catch((err) => console.error('Failed to persist answer:', err));
      }
    },
    [currentExercise, currentIndex, answered],
  );

  const nextExercise = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
    setAnswered(false);
  }, []);

  return {
    exercises,
    currentIndex,
    currentExercise,
    answers,
    isComplete,
    isLoading,
    error,
    totalCorrect,
    sessionMeta,
    sessionStats,
    submitAnswer,
    nextExercise,
  };
}
