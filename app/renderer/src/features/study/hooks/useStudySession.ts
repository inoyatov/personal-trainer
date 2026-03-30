import { useState, useCallback } from 'react';

export interface StudyExercise {
  exerciseType: 'multiple-choice-gap-fill' | 'typed-gap-fill' | 'dialog-completion';
  sourceEntityType: string;
  sourceEntityId: string;
  renderedPrompt: string;
  sentenceTranslation: string;
  targetWord: string;
  correctAnswer: string;
  /** MC only */
  options?: string[];
  /** MC only */
  correctIndex?: number;
  /** Dialog only */
  dialogContextTurns?: Array<{ speaker: string; text: string; isTarget: boolean }>;
  /** Dialog only */
  dialogMode?: 'mc' | 'typed';
}

export interface AnswerRecord {
  exerciseIndex: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  responseTimeMs: number;
  hintUsed: boolean;
}

interface UseStudySessionReturn {
  exercises: StudyExercise[];
  currentIndex: number;
  currentExercise: StudyExercise | null;
  answers: AnswerRecord[];
  isComplete: boolean;
  totalCorrect: number;
  startSession: (exercises: StudyExercise[]) => void;
  submitAnswer: (userAnswer: string, isCorrect: boolean, responseTimeMs: number, hintUsed?: boolean) => void;
  nextExercise: () => void;
}

export function useStudySession(): UseStudySessionReturn {
  const [exercises, setExercises] = useState<StudyExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [answered, setAnswered] = useState(false);

  const currentExercise =
    currentIndex < exercises.length ? exercises[currentIndex] : null;
  const isComplete = exercises.length > 0 && currentIndex >= exercises.length;
  const totalCorrect = answers.filter((a) => a.isCorrect).length;

  const startSession = useCallback((newExercises: StudyExercise[]) => {
    setExercises(newExercises);
    setCurrentIndex(0);
    setAnswers([]);
    setAnswered(false);
  }, []);

  const submitAnswer = useCallback(
    (
      userAnswer: string,
      isCorrect: boolean,
      responseTimeMs: number,
      hintUsed = false,
    ) => {
      if (!currentExercise || answered) return;

      setAnswers((prev) => [
        ...prev,
        {
          exerciseIndex: currentIndex,
          userAnswer,
          correctAnswer: currentExercise.correctAnswer,
          isCorrect,
          responseTimeMs,
          hintUsed,
        },
      ]);
      setAnswered(true);
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
    totalCorrect,
    startSession,
    submitAnswer,
    nextExercise,
  };
}
