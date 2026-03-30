import React, { useState, useEffect, useRef } from 'react';

interface TypedGapFillExerciseProps {
  correctAnswer: string;
  onAnswer: (userAnswer: string, isCorrect: boolean, isTypo: boolean) => void;
  disabled?: boolean;
  showHint?: boolean;
}

export function TypedGapFillExercise({
  correctAnswer,
  onAnswer,
  disabled = false,
  showHint = false,
}: TypedGapFillExerciseProps) {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; typo: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue('');
    setSubmitted(false);
    setResult(null);
    inputRef.current?.focus();
  }, [correctAnswer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || submitted || !value.trim()) return;

    const normalized = value.trim().toLowerCase().replace(/[.,!?;:]+$/, '');
    const correct = correctAnswer.toLowerCase();

    if (normalized === correct) {
      setResult({ correct: true, typo: false });
      setSubmitted(true);
      onAnswer(value.trim(), true, false);
      return;
    }

    const distance = levenshtein(normalized, correct);
    const maxDist = correct.length <= 6 ? 1 : 2;

    if (distance <= maxDist) {
      setResult({ correct: true, typo: true });
      setSubmitted(true);
      onAnswer(value.trim(), true, true);
      return;
    }

    setResult({ correct: false, typo: false });
    setSubmitted(true);
    onAnswer(value.trim(), false, false);
  };

  const hint = showHint ? correctAnswer.charAt(0) + '...' : '';

  const inputBorder = submitted
    ? result?.correct
      ? 'var(--color-success)'
      : 'var(--color-error)'
    : 'var(--color-border)';
  const inputBg = submitted
    ? result?.correct
      ? 'var(--color-success-light)'
      : 'var(--color-error-light)'
    : 'var(--color-bg-input)';
  const inputColor = submitted
    ? result?.correct
      ? 'var(--color-success-text)'
      : 'var(--color-error-text)'
    : 'var(--color-text-primary)';

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled || submitted}
        placeholder={hint || 'Type your answer...'}
        autoComplete="off"
        spellCheck={false}
        className="w-full rounded-lg border px-4 py-3 text-lg font-medium outline-none transition-colors"
        style={{ borderColor: inputBorder, backgroundColor: inputBg, color: inputColor }}
      />

      {!submitted && (
        <button
          type="submit"
          disabled={!value.trim()}
          className="rounded-lg px-6 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text-inverse)' }}
        >
          Check Answer
        </button>
      )}

      {submitted && result && (
        <div
          className="rounded-lg p-3 text-sm"
          style={{
            backgroundColor: result.correct ? 'var(--color-success-light)' : 'var(--color-error-light)',
            color: result.correct ? 'var(--color-success-text)' : 'var(--color-error-text)',
          }}
        >
          {result.correct && !result.typo && <span>Correct!</span>}
          {result.correct && result.typo && (
            <span>Close enough! The exact answer is: <strong>{correctAnswer}</strong></span>
          )}
          {!result.correct && (
            <span>Incorrect. The answer is: <strong>{correctAnswer}</strong></span>
          )}
        </div>
      )}
    </form>
  );
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}
