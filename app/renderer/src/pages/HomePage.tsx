import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats, useRecentSessions } from '../hooks/useDashboardQueries';
import { useCourses } from '../hooks/useContentQueries';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function HomePage() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentSessions, isLoading: sessionsLoading } =
    useRecentSessions();
  const { data: courses } = useCourses();
  const firstCourseId = courses?.[0]?.id;

  if (statsLoading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="mb-6 text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        Dashboard
      </h2>

      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Due Reviews"
          value={stats?.dueReviewCount ?? 0}
          colorVar="--color-error"
          onClick={stats?.dueReviewCount ? () => navigate('/review') : undefined}
        />
        <StatCard label="Today's Accuracy" value={stats?.todayTotal ? `${stats.todayAccuracy}%` : '--'} colorVar="--color-accent" />
        <StatCard label="Items Learned" value={stats?.totalItemsLearned ?? 0} colorVar="--color-success" />
        <StatCard label="Verbs Practiced" value={stats?.verbsPracticed ?? 0} colorVar="--color-badge-orange-text" />
        <StatCard label="Sessions Today" value={stats?.todaySessionCount ?? 0} colorVar="--color-badge-purple-text" />
      </div>

      {/* Quick actions */}
      <div className="mb-8 flex flex-wrap gap-3">
        {firstCourseId && (
          <button
            onClick={() => navigate(`/unified/${firstCourseId}`)}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text-inverse)' }}
          >
            Start Learning
          </button>
        )}
        {stats?.dueReviewCount ? (
          <button
            onClick={() => navigate('/review')}
            className="rounded-lg px-5 py-2.5 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-error)', color: 'var(--color-text-inverse)' }}
          >
            Start Review ({stats.dueReviewCount} due)
          </button>
        ) : null}
        <button
          onClick={() => navigate('/courses')}
          className="rounded-lg px-5 py-2.5 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
        >
          Browse Courses
        </button>
      </div>

      {/* Recent sessions */}
      <div>
        <h3 className="mb-3 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Recent Sessions
        </h3>
        {sessionsLoading && <LoadingSpinner />}
        {recentSessions && recentSessions.length === 0 && (
          <div
            className="rounded-lg border border-dashed py-8 text-center"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <p style={{ color: 'var(--color-text-secondary)' }}>
              No sessions yet. Start studying to see your progress here.
            </p>
          </div>
        )}
        {recentSessions && recentSessions.length > 0 && (
          <div className="space-y-2">
            {recentSessions.map((s: any) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {formatMode(s.mode)}
                  </span>
                  <span className="ml-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {formatDate(s.startedAt)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {s.correctAnswers}/{s.totalQuestions} correct
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor:
                        s.accuracy >= 80
                          ? 'var(--color-success-light)'
                          : s.accuracy >= 50
                            ? 'var(--color-warning-light)'
                            : 'var(--color-error-light)',
                      color:
                        s.accuracy >= 80
                          ? 'var(--color-success-text)'
                          : s.accuracy >= 50
                            ? 'var(--color-warning-text)'
                            : 'var(--color-error-text)',
                    }}
                  >
                    {s.accuracy}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  colorVar,
  onClick,
}: {
  label: string;
  value: string | number;
  colorVar: string;
  onClick?: () => void;
}) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      className={`rounded-lg border p-5 ${onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}`}
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
      }}
    >
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold" style={{ color: `var(${colorVar})` }}>
        {value}
      </p>
    </Component>
  );
}

function formatMode(mode: string): string {
  const labels: Record<string, string> = {
    learn: 'Learn', practice: 'Practice', review: 'Review',
    'exam-simulation': 'Exam Sim', 'writing-lab': 'Writing',
    'unified-learning': 'Unified', 'conjugation-practice': 'Conjugation',
  };
  return labels[mode] ?? mode;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString();
}
