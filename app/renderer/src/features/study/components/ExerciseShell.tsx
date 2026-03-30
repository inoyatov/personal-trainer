import React from 'react';

interface ExerciseShellProps {
  current: number;
  total: number;
  prompt: string;
  translation?: string;
  showTranslation?: boolean;
  feedback?: { correct: boolean; message: string } | null;
  children: React.ReactNode;
  onNext?: () => void;
  showNext?: boolean;
}

export function ExerciseShell({
  current,
  total,
  prompt,
  translation,
  showTranslation = true,
  feedback,
  children,
  onNext,
  showNext = false,
}: ExerciseShellProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="mb-1 flex items-center justify-between text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <span>Question {current} of {total}</span>
          <span>{Math.round((current / total) * 100)}%</span>
        </div>
        <div className="h-2 w-full rounded-full" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{ width: `${(current / total) * 100}%`, backgroundColor: 'var(--color-accent)' }}
          />
        </div>
      </div>

      {/* Prompt */}
      <div
        className="mb-6 rounded-lg border p-6"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
      >
        <p className="text-xl font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {formatPrompt(prompt)}
        </p>
        {showTranslation && translation && (
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {translation}
          </p>
        )}
      </div>

      <div className="mb-4">{children}</div>

      {feedback && (
        <div
          className="mb-4 rounded-lg border p-4"
          style={{
            backgroundColor: feedback.correct ? 'var(--color-success-light)' : 'var(--color-error-light)',
            borderColor: feedback.correct ? 'var(--color-success)' : 'var(--color-error)',
            color: feedback.correct ? 'var(--color-success-text)' : 'var(--color-error-text)',
          }}
        >
          <p className="font-medium">{feedback.message}</p>
        </div>
      )}

      {showNext && (
        <button
          onClick={onNext}
          className="self-end rounded-lg px-6 py-2.5 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text-inverse)' }}
        >
          Next
        </button>
      )}
    </div>
  );
}

function formatPrompt(prompt: string): React.ReactNode {
  const parts = prompt.split('____');
  if (parts.length < 2) return prompt;
  return (
    <>
      {parts[0]}
      <span className="mx-1 inline-block min-w-[80px] border-b-2 text-center" style={{ borderColor: 'var(--color-accent)' }}>
        &nbsp;
      </span>
      {parts[1]}
    </>
  );
}
