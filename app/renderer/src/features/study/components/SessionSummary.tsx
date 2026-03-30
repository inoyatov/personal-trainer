import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { AnswerRecord } from '../hooks/useStudySession';

interface SessionSummaryProps {
  answers: AnswerRecord[];
  totalCorrect: number;
  totalQuestions: number;
  sessionStats?: any;
  lessonId?: string | null;
}

export function SessionSummary({ answers, totalCorrect, totalQuestions, sessionStats, lessonId }: SessionSummaryProps) {
  const navigate = useNavigate();
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const avgTime = answers.length > 0
    ? Math.round(answers.reduce((sum, a) => sum + a.responseTimeMs, 0) / answers.length)
    : 0;
  const durationSecs = sessionStats ? Math.round(sessionStats.durationMs / 1000) : null;

  const formatDuration = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  };

  return (
    <div className="mx-auto max-w-lg">
      <div
        className="rounded-lg border p-8 text-center"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
      >
        <h2 className="mb-2 text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Session Complete
        </h2>
        <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          Great work! Here are your results.
        </p>

        <div className={`mb-6 grid gap-4 ${durationSecs !== null ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <div>
            <p className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>{accuracy}%</p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Accuracy</p>
          </div>
          <div>
            <p className="text-3xl font-bold" style={{ color: 'var(--color-success)' }}>{totalCorrect}/{totalQuestions}</p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Correct</p>
          </div>
          <div>
            <p className="text-3xl font-bold" style={{ color: 'var(--color-badge-purple-text)' }}>{(avgTime / 1000).toFixed(1)}s</p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Avg. Time</p>
          </div>
          {durationSecs !== null && (
            <div>
              <p className="text-3xl font-bold" style={{ color: 'var(--color-badge-orange-text)' }}>{formatDuration(durationSecs)}</p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Duration</p>
            </div>
          )}
        </div>

        {sessionStats && (
          <p className="mb-4 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Session saved</p>
        )}

        <div className="mb-6 space-y-1 text-left">
          {answers.map((answer, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded px-3 py-1.5 text-sm"
              style={{
                backgroundColor: answer.isCorrect ? 'var(--color-success-light)' : 'var(--color-error-light)',
                color: answer.isCorrect ? 'var(--color-success-text)' : 'var(--color-error-text)',
              }}
            >
              <span>Q{i + 1}: {answer.userAnswer}</span>
              {!answer.isCorrect && <span className="text-xs">Correct: {answer.correctAnswer}</span>}
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="rounded-lg border px-6 py-2.5 text-sm font-medium"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            Back to Dashboard
          </button>
          {lessonId && (
            <button
              onClick={() => navigate(`/lessons/${lessonId}`)}
              className="rounded-lg border px-6 py-2.5 text-sm font-medium"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              Back to Lesson
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg px-6 py-2.5 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text-inverse)' }}
          >
            Study Again
          </button>
        </div>
      </div>
    </div>
  );
}
