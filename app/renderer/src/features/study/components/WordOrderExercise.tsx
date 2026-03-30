import React, { useState, useEffect, useCallback } from 'react';

interface WordOrderExerciseProps {
  shuffledTokens: string[];
  correctTokens: string[];
  translation: string;
  onAnswer: (userTokens: string[], correct: boolean) => void;
  disabled?: boolean;
}

export function WordOrderExercise({
  shuffledTokens,
  correctTokens,
  translation,
  onAnswer,
  disabled = false,
}: WordOrderExerciseProps) {
  const [availableTokens, setAvailableTokens] = useState<string[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Reset when exercise changes
  useEffect(() => {
    setAvailableTokens([...shuffledTokens]);
    setSelectedTokens([]);
    setSubmitted(false);
    setIsCorrect(false);
  }, [shuffledTokens]);

  const addToken = useCallback(
    (index: number) => {
      if (disabled || submitted) return;
      const token = availableTokens[index];
      setSelectedTokens((prev) => [...prev, token]);
      setAvailableTokens((prev) => prev.filter((_, i) => i !== index));
    },
    [disabled, submitted, availableTokens],
  );

  const removeToken = useCallback(
    (index: number) => {
      if (disabled || submitted) return;
      const token = selectedTokens[index];
      setAvailableTokens((prev) => [...prev, token]);
      setSelectedTokens((prev) => prev.filter((_, i) => i !== index));
    },
    [disabled, submitted, selectedTokens],
  );

  const handleSubmit = useCallback(() => {
    if (disabled || submitted || selectedTokens.length === 0) return;

    const normalize = (tokens: string[]) =>
      tokens.map((t) => t.toLowerCase().replace(/[.,!?;:]+$/, '')).join(' ');

    const correct = normalize(selectedTokens) === normalize(correctTokens);
    setSubmitted(true);
    setIsCorrect(correct);
    onAnswer(selectedTokens, correct);
  }, [disabled, submitted, selectedTokens, correctTokens, onAnswer]);

  // Keyboard: Enter to submit when all tokens placed
  useEffect(() => {
    if (disabled || submitted) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && selectedTokens.length > 0 && availableTokens.length === 0) {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [disabled, submitted, selectedTokens, availableTokens, handleSubmit]);

  return (
    <div className="space-y-4">
      {/* Translation hint */}
      <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        {translation}
      </p>

      {/* Answer area — selected tokens */}
      <div
        className="min-h-[52px] rounded-lg border-2 border-dashed p-3"
        style={{
          borderColor: submitted
            ? isCorrect ? 'var(--color-success)' : 'var(--color-error)'
            : 'var(--color-border)',
          backgroundColor: submitted
            ? isCorrect ? 'var(--color-success-light)' : 'var(--color-error-light)'
            : 'var(--color-bg-secondary)',
        }}
      >
        {selectedTokens.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Click words below to build the sentence...
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {selectedTokens.map((token, i) => (
            <button
              key={`sel-${i}`}
              onClick={() => removeToken(i)}
              disabled={disabled || submitted}
              className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--color-accent-light)',
                borderColor: 'var(--color-accent)',
                color: 'var(--color-accent-text)',
                cursor: submitted ? 'default' : 'pointer',
              }}
            >
              {token}
            </button>
          ))}
        </div>
      </div>

      {/* Available tokens pool */}
      {!submitted && (
        <div className="flex flex-wrap gap-2">
          {availableTokens.map((token, i) => (
            <button
              key={`avail-${i}`}
              onClick={() => addToken(i)}
              disabled={disabled || submitted}
              className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              {token}
            </button>
          ))}
        </div>
      )}

      {/* Submit button */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={availableTokens.length > 0 || selectedTokens.length === 0}
          className="rounded-lg px-6 py-2.5 text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text-inverse)' }}
        >
          Check Order
        </button>
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
          {isCorrect ? (
            'Correct word order!'
          ) : (
            <span>
              Not quite. The correct order is: <strong>{correctTokens.join(' ')}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
