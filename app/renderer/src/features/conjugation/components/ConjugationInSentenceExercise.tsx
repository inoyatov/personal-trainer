import React, { useState, useEffect, useRef } from 'react';

interface ConjugationInSentenceExerciseProps {
  renderedPrompt: string;
  sentenceTranslation: string;
  verbInfinitive: string;
  correctAnswer: string;
  onAnswer: (userAnswer: string) => void;
  feedback: { accepted: boolean; errorType: string; message: string } | null;
  disabled?: boolean;
}

export function ConjugationInSentenceExercise({
  renderedPrompt,
  sentenceTranslation,
  verbInfinitive,
  correctAnswer,
  onAnswer,
  feedback,
  disabled = false,
}: ConjugationInSentenceExerciseProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue('');
    inputRef.current?.focus();
  }, [renderedPrompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || !value.trim()) return;
    onAnswer(value.trim());
  };

  const inputBorder = feedback
    ? feedback.accepted ? 'var(--color-success)' : 'var(--color-error)'
    : 'var(--color-border)';
  const inputBg = feedback
    ? feedback.accepted ? 'var(--color-success-light)' : 'var(--color-error-light)'
    : 'var(--color-bg-input)';

  return (
    <div className="space-y-4">
      {/* Sentence with blank */}
      <div
        className="rounded-lg border p-5 text-center"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
      >
        <p className="text-xl font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {formatPrompt(renderedPrompt, verbInfinitive)}
        </p>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {sentenceTranslation}
        </p>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          placeholder="Type the correct verb form..."
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

function formatPrompt(prompt: string, infinitive: string): React.ReactNode {
  // Split on ____ and (infinitive) hint
  const hintPattern = `(${infinitive})`;
  const mainPart = prompt.replace(hintPattern, '').trim();
  const parts = mainPart.split('____');

  if (parts.length < 2) return prompt;

  return (
    <>
      {parts[0]}
      <span
        className="mx-1 inline-block min-w-[80px] border-b-2 text-center"
        style={{ borderColor: 'var(--color-accent)' }}
      >
        &nbsp;
      </span>
      {parts[1]}
      <span className="ml-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
        ({infinitive})
      </span>
    </>
  );
}
