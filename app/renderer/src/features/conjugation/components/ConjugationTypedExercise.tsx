import React, { useState, useEffect, useRef } from 'react';

interface ConjugationTypedExerciseProps {
  verbInfinitive: string;
  verbTranslation: string;
  pronoun: string;
  correctAnswer: string;
  onAnswer: (userAnswer: string) => void;
  feedback: { accepted: boolean; errorType: string; message: string } | null;
  disabled?: boolean;
}

const PRONOUN_LABELS: Record<string, string> = {
  IK: 'ik', JIJ: 'jij', U: 'u', HIJ: 'hij', ZIJ_SG: 'zij',
  HET: 'het', WIJ: 'wij', JULLIE: 'jullie', ZIJ_PL: 'zij (pl)',
};

export function ConjugationTypedExercise({
  verbInfinitive,
  verbTranslation,
  pronoun,
  correctAnswer,
  onAnswer,
  feedback,
  disabled = false,
}: ConjugationTypedExerciseProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue('');
    inputRef.current?.focus();
  }, [verbInfinitive, pronoun]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || !value.trim()) return;
    onAnswer(value.trim());
  };

  const pronounLabel = PRONOUN_LABELS[pronoun] ?? pronoun.toLowerCase();

  const inputBorder = feedback
    ? feedback.accepted ? 'var(--color-success)' : 'var(--color-error)'
    : 'var(--color-border)';
  const inputBg = feedback
    ? feedback.accepted ? 'var(--color-success-light)' : 'var(--color-error-light)'
    : 'var(--color-bg-input)';

  return (
    <div className="space-y-4">
      {/* Verb + pronoun display */}
      <div className="text-center">
        <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {verbInfinitive}
        </p>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {verbTranslation}
        </p>
        <div
          className="mt-3 inline-block rounded-full px-4 py-1.5 text-sm font-semibold"
          style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}
        >
          {pronounLabel}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          placeholder={`Type the form for "${pronounLabel}"...`}
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-lg border px-4 py-3 text-center text-lg font-medium outline-none transition-colors"
          style={{ borderColor: inputBorder, backgroundColor: inputBg, color: 'var(--color-text-primary)' }}
        />

        {!feedback && (
          <div className="text-center">
            <button
              type="submit"
              disabled={!value.trim()}
              className="rounded-lg px-6 py-2.5 text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text-inverse)' }}
            >
              Check
            </button>
          </div>
        )}
      </form>

      {/* Feedback */}
      {feedback && (
        <div
          className="rounded-lg p-3 text-center text-sm"
          style={{
            backgroundColor: feedback.accepted ? 'var(--color-success-light)' : 'var(--color-error-light)',
            color: feedback.accepted ? 'var(--color-success-text)' : 'var(--color-error-text)',
          }}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}
