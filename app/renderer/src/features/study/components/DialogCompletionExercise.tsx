import React, { useState, useEffect, useCallback, useRef } from 'react';

interface ContextTurn {
  speaker: string;
  text: string;
  isTarget: boolean;
}

interface DialogCompletionExerciseProps {
  contextTurns: ContextTurn[];
  targetTranslation: string;
  correctAnswer: string;
  mode: 'mc' | 'typed';
  options?: string[];
  correctIndex?: number;
  onAnswer: (userAnswer: string, correct: boolean) => void;
  disabled?: boolean;
}

const speakerBgVars = ['--color-badge-blue', '--color-badge-green'];

export function DialogCompletionExercise({
  contextTurns,
  targetTranslation,
  correctAnswer,
  mode,
  options,
  correctIndex,
  onAnswer,
  disabled = false,
}: DialogCompletionExerciseProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [typedValue, setTypedValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const speakers = [...new Set(contextTurns.map((t) => t.speaker))];

  useEffect(() => {
    setSelectedIndex(null);
    setTypedValue('');
    setSubmitted(false);
    setIsCorrect(false);
    if (mode === 'typed') inputRef.current?.focus();
  }, [contextTurns, correctAnswer]);

  useEffect(() => {
    if (mode !== 'mc' || disabled || submitted || !options) return;
    const handler = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= options.length) handleMCSelect(num - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode, disabled, submitted, options]);

  const handleMCSelect = useCallback(
    (index: number) => {
      if (disabled || submitted || !options) return;
      setSelectedIndex(index);
      setSubmitted(true);
      const correct = index === correctIndex;
      setIsCorrect(correct);
      onAnswer(options[index], correct);
    },
    [disabled, submitted, options, correctIndex, onAnswer],
  );

  const handleTypedSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (disabled || submitted || !typedValue.trim()) return;
      const normalized = typedValue.trim().toLowerCase().replace(/[.,!?]+$/, '');
      let accepted = normalized === correctAnswer.toLowerCase();
      if (!accepted) {
        const dist = levenshtein(normalized, correctAnswer.toLowerCase());
        accepted = dist <= (correctAnswer.length <= 6 ? 1 : 2);
      }
      setSubmitted(true);
      setIsCorrect(accepted);
      onAnswer(typedValue.trim(), accepted);
    },
    [disabled, submitted, typedValue, correctAnswer, onAnswer],
  );

  return (
    <div className="space-y-4">
      {/* Dialog bubbles */}
      <div className="space-y-2">
        {contextTurns.map((turn, i) => {
          const speakerIdx = speakers.indexOf(turn.speaker);
          const isRight = speakerIdx % 2 === 1;

          return (
            <div key={i} className={`flex ${isRight ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${turn.isTarget ? 'ring-2 ring-offset-1' : ''}`}
                style={{
                  backgroundColor: `var(${speakerBgVars[speakerIdx % 2]})`,
                  ...(turn.isTarget ? { outlineColor: 'var(--color-accent)' } : {}),
                }}
              >
                <p className="mb-0.5 text-xs font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>
                  {turn.speaker}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  {turn.isTarget ? formatBlanked(turn.text) : turn.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Translation hint */}
      <p className="text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
        {targetTranslation}
      </p>

      {/* MC options */}
      {mode === 'mc' && options && (
        <div className="grid grid-cols-2 gap-2">
          {options.map((opt, i) => {
            const isSelected = selectedIndex === i;
            const isCorrectOpt = i === correctIndex;

            let borderColor = 'var(--color-border)';
            let bgColor = 'var(--color-bg-secondary)';
            let opacity = '1';
            if (submitted) {
              if (isCorrectOpt) {
                borderColor = 'var(--color-success)';
                bgColor = 'var(--color-success-light)';
              } else if (isSelected) {
                borderColor = 'var(--color-error)';
                bgColor = 'var(--color-error-light)';
              } else {
                opacity = '0.6';
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleMCSelect(i)}
                disabled={disabled || submitted}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors"
                style={{ borderColor, backgroundColor: bgColor, opacity }}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
                >
                  {i + 1}
                </span>
                <span style={{ color: 'var(--color-text-primary)' }}>{opt}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Typed input */}
      {mode === 'typed' && (
        <form onSubmit={handleTypedSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={typedValue}
            onChange={(e) => setTypedValue(e.target.value)}
            disabled={disabled || submitted}
            placeholder="Type the missing word..."
            autoComplete="off"
            spellCheck={false}
            className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
            style={{
              borderColor: submitted
                ? isCorrect ? 'var(--color-success)' : 'var(--color-error)'
                : 'var(--color-border)',
              backgroundColor: submitted
                ? isCorrect ? 'var(--color-success-light)' : 'var(--color-error-light)'
                : 'var(--color-bg-input)',
              color: 'var(--color-text-primary)',
            }}
          />
          {!submitted && (
            <button
              type="submit"
              disabled={!typedValue.trim()}
              className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text-inverse)' }}
            >
              Check
            </button>
          )}
        </form>
      )}

      {/* Feedback */}
      {submitted && (
        <div
          className="rounded-lg p-3 text-sm"
          style={{
            backgroundColor: isCorrect ? 'var(--color-success-light)' : 'var(--color-error-light)',
            color: isCorrect ? 'var(--color-success-text)' : 'var(--color-error-text)',
          }}
        >
          {isCorrect ? 'Correct!' : `The answer is: ${correctAnswer}`}
        </div>
      )}
    </div>
  );
}

function formatBlanked(text: string): React.ReactNode {
  const parts = text.split('____');
  if (parts.length < 2) return text;
  return (
    <>
      {parts[0]}
      <span
        className="mx-1 inline-block min-w-[60px] border-b-2"
        style={{ borderColor: 'var(--color-accent)' }}
      >
        &nbsp;
      </span>
      {parts[1]}
    </>
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
