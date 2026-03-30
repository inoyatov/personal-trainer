import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useCourses, useModules } from '../hooks/useContentQueries';
import { useVocabCoverage } from '../hooks/useProgressQueries';
import { api } from '../lib/api';

export function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: courses } = useCourses();
  const { data: modules, isLoading, error } = useModules(courseId);
  const { data: vocabCoverage } = useVocabCoverage(courseId);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const course = courses?.find((c: any) => c.id === courseId);

  const handleDeleteModule = async () => {
    if (!deleteTarget) return;
    await api.content.deleteModule(deleteTarget.id);
    queryClient.invalidateQueries({ queryKey: ['modules', courseId] });
    queryClient.invalidateQueries({ queryKey: ['vocabCoverage'] });
    queryClient.invalidateQueries({ queryKey: ['totalVocabCoverage'] });
    setDeleteTarget(null);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={course?.title ?? 'Course'}
        subtitle={course?.description}
        backTo="/courses"
      />

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message="Failed to load modules." />}

      {modules && modules.length === 0 && (
        <EmptyState title="No modules yet" description="This course has no modules." />
      )}

      {/* Vocabulary Coverage */}
      {vocabCoverage && (
        <div
          className="mb-6 rounded-lg border p-4"
          style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Vocabulary Progress
            </h3>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {vocabCoverage.wordsLearned} / {vocabCoverage.targetWords} words
            </span>
          </div>
          <div
            className="mb-2 h-3 overflow-hidden rounded-full"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${vocabCoverage.progressPercent}%`,
                background: 'linear-gradient(90deg, var(--color-badge-blue), var(--color-success))',
              }}
            />
          </div>
          <div className="flex gap-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <span>Mastered: {vocabCoverage.wordsMastered}</span>
            <span>Learning: {vocabCoverage.wordsLearned - vocabCoverage.wordsMastered}</span>
            <span>In course: {vocabCoverage.totalWords}</span>
          </div>
        </div>
      )}

      {/* Unified Learning button */}
      {courseId && (
        <div className="mb-6">
          <button
            onClick={() => navigate(`/unified/${courseId}`)}
            className="rounded-lg px-6 py-3 text-sm font-semibold"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text-inverse)' }}
          >
            Start Learning
          </button>
        </div>
      )}

      {modules && modules.length > 0 && courseId && (
        <div className="space-y-2">
          {modules.map((mod: any, index: number) => (
            <div key={mod.id} className="relative">
              <button
                onClick={() => navigate(`/courses/${courseId}/modules/${mod.id}`)}
                className="flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors"
                style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{ backgroundColor: 'var(--color-badge-blue)', color: 'var(--color-badge-blue-text)' }}
                >
                  {index + 1}
                </span>
                <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{mod.title}</h4>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: mod.id, title: mod.title }); }}
                className="absolute right-2 top-2 rounded px-1.5 py-1 text-sm opacity-60 hover:opacity-100 transition-opacity"
                title="Delete module"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Module"
          message={`Delete "${deleteTarget.title}" and all its lessons? This cannot be undone.`}
          onConfirm={handleDeleteModule}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
