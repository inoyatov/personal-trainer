import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useDashboardStats, useRecentSessions } from '../hooks/useDashboardQueries';
import { useAllReviewStates } from '../hooks/useReviewQueries';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { generateCompetenceSignals, type ProgressSnapshot } from '../../../backend/domain/progress/competenceSignals';

const stageLabels: Record<string, string> = {
  new: 'New',
  seen: 'Seen',
  recognized: 'Recognized',
  recalled: 'Recalled',
  stable: 'Stable',
  automated: 'Automated',
};

const stageBarStyles: Record<string, React.CSSProperties> = {
  new: { backgroundColor: 'var(--color-bg-tertiary)' },
  seen: { backgroundColor: 'var(--color-badge-blue)' },
  recognized: { backgroundColor: 'var(--color-badge-orange)' },
  recalled: { backgroundColor: 'var(--color-badge-green)' },
  stable: { backgroundColor: 'var(--color-success)' },
  automated: { backgroundColor: 'var(--color-badge-purple)' },
};

export function ProgressPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: sessions } = useRecentSessions();
  const { data: reviewStates, isLoading: statesLoading } = useAllReviewStates();

  // Conjugation stats
  const { data: conjStats } = useQuery({
    queryKey: ['conjugationStats'],
    queryFn: () => api.conjugation.getStats(),
  });

  if (statsLoading || statesLoading) return <LoadingSpinner />;

  // Compute stage distribution
  const stageCounts: Record<string, number> = {
    new: 0, seen: 0, recognized: 0, recalled: 0, stable: 0, automated: 0,
  };
  const entityTypeCounts: Record<string, number> = {};

  if (reviewStates) {
    for (const state of reviewStates as any[]) {
      stageCounts[state.currentStage] = (stageCounts[state.currentStage] || 0) + 1;
      entityTypeCounts[state.entityType] = (entityTypeCounts[state.entityType] || 0) + 1;
    }
  }

  const totalItems = reviewStates?.length ?? 0;

  // Compute session history stats
  const sessionAccuracies = (sessions as any[] ?? [])
    .filter((s: any) => s.totalQuestions > 0)
    .map((s: any) => s.accuracy);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Progress" subtitle="Track your learning journey" backTo="/" />

      {/* Competence signals */}
      {(() => {
        const snapshot: ProgressSnapshot = {
          totalItemsLearned: stats?.totalItemsLearned ?? 0,
          totalSessions: stats?.totalSessions ?? 0,
          todayAccuracy: stats?.todayAccuracy ?? 0,
          reviewStates: (reviewStates as any[]) ?? [],
          lessonCompletions: [],
        };
        const signals = generateCompetenceSignals(snapshot);
        if (signals.length === 0) return null;
        return (
          <div className="mb-6 space-y-2">
            {signals.slice(0, 3).map((signal, i) => (
              <div
                key={i}
                className="rounded-lg border px-4 py-3 text-sm"
                style={{
                  backgroundColor: signal.category === 'milestone'
                    ? 'var(--color-success-light)'
                    : signal.category === 'strength'
                      ? 'var(--color-badge-blue)'
                      : 'var(--color-accent-light)',
                  borderColor: signal.category === 'milestone'
                    ? 'var(--color-success)'
                    : 'var(--color-border)',
                  color: signal.category === 'milestone'
                    ? 'var(--color-success-text)'
                    : signal.category === 'strength'
                      ? 'var(--color-badge-blue-text)'
                      : 'var(--color-accent-text)',
                }}
              >
                {signal.message}
              </div>
            ))}
          </div>
        );
      })()}

      {/* Overview stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBox label="Total Items Tracked" value={totalItems} />
        <StatBox label="Items Learned" value={stats?.totalItemsLearned ?? 0} />
        <StatBox label="Total Sessions" value={stats?.totalSessions ?? 0} />
        <StatBox
          label="Today's Accuracy"
          value={stats?.todayTotal ? `${stats.todayAccuracy}%` : '--'}
        />
      </div>

      {/* Conjugation stats */}
      {conjStats && conjStats.verbsPracticed > 0 && (
        <div className="mb-8">
          <h3 className="mb-3 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Verb Conjugation
          </h3>
          <div className="mb-3 flex gap-4">
            <div className="rounded-lg border px-4 py-3" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Verbs Practiced</p>
              <p className="text-xl font-bold" style={{ color: 'var(--color-badge-orange-text)' }}>{conjStats.verbsPracticed}</p>
            </div>
            <div className="rounded-lg border px-4 py-3" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Accuracy</p>
              <p className="text-xl font-bold" style={{ color: 'var(--color-accent)' }}>{conjStats.accuracy}%</p>
            </div>
            <div className="rounded-lg border px-4 py-3" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Attempts</p>
              <p className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{conjStats.totalAttempts}</p>
            </div>
          </div>
          {conjStats.weakPronouns.length > 0 && (
            <div
              className="rounded-lg border p-3 text-sm"
              style={{ backgroundColor: 'var(--color-warning-light)', borderColor: 'var(--color-warning)', color: 'var(--color-warning-text)' }}
            >
              Weak pronouns: {conjStats.weakPronouns.map((p: string) => {
                const labels: Record<string, string> = { IK: 'ik', JIJ: 'jij', U: 'u', HIJ: 'hij', ZIJ_SG: 'zij', HET: 'het', WIJ: 'wij', JULLIE: 'jullie', ZIJ_PL: 'zij(pl)' };
                return labels[p] ?? p;
              }).join(', ')} — these need more practice
            </div>
          )}
          {Object.keys(conjStats.errorCounts).length > 0 && (
            <div className="mt-2 flex gap-2">
              {Object.entries(conjStats.errorCounts).map(([type, count]: [string, any]) => (
                <span key={type} className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error-text)' }}>
                  {type}: {count}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mastery stage distribution */}
      <div className="mb-8">
        <h3 className="mb-3 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Mastery Distribution
        </h3>
        {totalItems === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Complete some study sessions to see your mastery distribution.
          </p>
        ) : (
          <>
            {/* Bar chart */}
            <div className="mb-3 flex h-8 overflow-hidden rounded-lg">
              {Object.entries(stageCounts).map(([stage, count]) => {
                if (count === 0) return null;
                const percent = (count / totalItems) * 100;
                return (
                  <div
                    key={stage}
                    className="flex items-center justify-center text-xs font-medium"
                    style={{ width: `${percent}%`, ...stageBarStyles[stage] }}
                    title={`${stageLabels[stage]}: ${count}`}
                  >
                    {percent >= 8 ? count : ''}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3">
              {Object.entries(stageCounts).map(([stage, count]) => (
                <div key={stage} className="flex items-center gap-1.5 text-xs">
                  <div className="h-3 w-3 rounded" style={stageBarStyles[stage]} />
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {stageLabels[stage]}: {count}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* By entity type */}
      {Object.keys(entityTypeCounts).length > 0 && (
        <div className="mb-8">
          <h3 className="mb-3 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Items by Type
          </h3>
          <div className="flex gap-4">
            {Object.entries(entityTypeCounts).map(([type, count]) => (
              <div
                key={type}
                className="rounded-lg px-4 py-3"
                style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
              >
                <p className="text-sm font-medium capitalize" style={{ color: 'var(--color-text-secondary)' }}>
                  {type}
                </p>
                <p className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {count}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent session accuracy */}
      {sessionAccuracies.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-3 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Recent Session Accuracy
          </h3>
          <div className="flex items-end gap-2" style={{ height: 120 }}>
            {sessionAccuracies.map((acc: number, i: number) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{acc}%</span>
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${Math.max(acc, 5)}%`,
                    backgroundColor: acc >= 80
                      ? 'var(--color-success)'
                      : acc >= 50
                        ? 'var(--color-warning)'
                        : 'var(--color-error)',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review states table */}
      {totalItems > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            All Tracked Items
          </h3>
          <div className="overflow-hidden rounded-lg" style={{ border: '1px solid var(--color-border)' }}>
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                <tr>
                  <th className="px-4 py-2 text-left font-medium" style={{ color: 'var(--color-text-secondary)' }}>Type</th>
                  <th className="px-4 py-2 text-left font-medium" style={{ color: 'var(--color-text-secondary)' }}>ID</th>
                  <th className="px-4 py-2 text-left font-medium" style={{ color: 'var(--color-text-secondary)' }}>Stage</th>
                  <th className="px-4 py-2 text-left font-medium" style={{ color: 'var(--color-text-secondary)' }}>Ease</th>
                  <th className="px-4 py-2 text-left font-medium" style={{ color: 'var(--color-text-secondary)' }}>OK/Fail</th>
                  <th className="px-4 py-2 text-left font-medium" style={{ color: 'var(--color-text-secondary)' }}>Due</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {(reviewStates as any[] ?? []).slice(0, 50).map((state: any) => (
                  <tr key={state.id} style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                    <td className="px-4 py-2 capitalize" style={{ color: 'var(--color-text-secondary)' }}>{state.entityType}</td>
                    <td className="px-4 py-2 font-mono text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{state.entityId}</td>
                    <td className="px-4 py-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={stageBarStyles[state.currentStage] ?? stageBarStyles.new}
                      >
                        {stageLabels[state.currentStage] ?? state.currentStage}
                      </span>
                    </td>
                    <td className="px-4 py-2" style={{ color: 'var(--color-text-secondary)' }}>{state.easeScore}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--color-text-secondary)' }}>{state.successCount}/{state.failCount}</td>
                    <td className="px-4 py-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{formatDue(state.dueAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
    </div>
  );
}

function formatDue(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 0) return `in ${Math.abs(diffMin)}m`;
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString();
}
