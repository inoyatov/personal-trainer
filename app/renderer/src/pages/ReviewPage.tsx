import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDueItems } from '../hooks/useReviewQueries';
import { useDashboardStats } from '../hooks/useDashboardQueries';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

const stageStyles: Record<string, React.CSSProperties> = {
  new: { backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' },
  seen: { backgroundColor: 'var(--color-badge-blue)', color: 'var(--color-badge-blue-text)' },
  recognized: { backgroundColor: 'var(--color-badge-orange)', color: 'var(--color-badge-orange-text)' },
  recalled: { backgroundColor: 'var(--color-badge-green)', color: 'var(--color-badge-green-text)' },
  stable: { backgroundColor: 'var(--color-success-light)', color: 'var(--color-success-text)' },
  automated: { backgroundColor: 'var(--color-badge-purple)', color: 'var(--color-badge-purple-text)' },
};

export function ReviewPage() {
  const navigate = useNavigate();
  const { data: dueItems, isLoading } = useDueItems();
  const { data: stats } = useDashboardStats();

  if (isLoading) return <LoadingSpinner />;

  const items = dueItems ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Review Queue"
        subtitle={
          items.length > 0
            ? `${items.length} items due for review`
            : 'No items due right now'
        }
        backTo="/"
      />

      {/* Stats summary */}
      {stats && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Due Now
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-error)' }}>
              {stats.dueReviewCount}
            </p>
          </div>
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Items Learned
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>
              {stats.totalItemsLearned}
            </p>
          </div>
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Today's Accuracy
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
              {stats.todayTotal > 0 ? `${stats.todayAccuracy}%` : '--'}
            </p>
          </div>
        </div>
      )}

      {items.length === 0 && (
        <EmptyState
          title="All caught up!"
          description="No items are due for review right now. Come back later or study new lessons."
        />
      )}

      {items.length > 0 && (
        <>
          {/* Start review button */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/review/study')}
              className="rounded-lg px-6 py-3 text-sm font-medium"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text-inverse)' }}
            >
              Start Review Session ({items.length} items)
            </button>
          </div>

          {/* Due items list */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Items due for review
            </h3>
            {items.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg px-4 py-3"
                style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={stageStyles[item.currentStage] ?? stageStyles.new}
                  >
                    {item.currentStage}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {item.entityType}: {item.entityId}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  <span>
                    {item.successCount}ok / {item.failCount}fail
                  </span>
                  <span>
                    ease: {item.easeScore}
                  </span>
                  <span>
                    due: {formatDue(item.dueAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function formatDue(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 0) return `in ${Math.abs(diffMin)}m`;
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h overdue`;
  return `${Math.floor(diffHr / 24)}d overdue`;
}
