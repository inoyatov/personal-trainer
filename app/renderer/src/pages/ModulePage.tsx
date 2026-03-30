import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { LessonCard } from '../components/content/LessonCard';
import { useModules, useLessons } from '../hooks/useContentQueries';
import { api } from '../lib/api';

export function ModulePage() {
  const { courseId, moduleId } = useParams<{
    courseId: string;
    moduleId: string;
  }>();
  const { data: modules } = useModules(courseId);
  const { data: lessons, isLoading, error } = useLessons(moduleId);
  const queryClient = useQueryClient();
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const mod = modules?.find((m: any) => m.id === moduleId);

  const handleImportLesson = async () => {
    if (!moduleId) return;
    setImportStatus(null);
    try {
      const result = await api.importExport.importLesson(moduleId);
      if (result.success) {
        const total =
          result.counts.vocabulary +
          result.counts.sentences +
          result.counts.dialogs;
        setImportStatus({
          type: 'success',
          message: `Lesson imported (${result.counts.vocabulary} vocab, ${result.counts.sentences} sentences, ${result.counts.dialogs} dialogs)`,
        });
        queryClient.invalidateQueries({ queryKey: ['lessons', moduleId] });
      } else if (result.errors?.length) {
        setImportStatus({ type: 'error', message: result.errors.join('; ') });
      }
    } catch (err: any) {
      setImportStatus({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-2">
            <a
              href={`#/courses/${courseId}`}
              className="text-sm"
              style={{ color: 'var(--color-accent)' }}
            >
              &larr; Back
            </a>
          </div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {mod?.title ?? 'Module'}
          </h2>
        </div>
        <button
          onClick={handleImportLesson}
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-success)', color: 'var(--color-text-inverse)' }}
        >
          Import Lesson
        </button>
      </div>

      {importStatus && (
        <div
          className="mb-4 rounded-lg p-3 text-sm"
          style={
            importStatus.type === 'success'
              ? { backgroundColor: 'var(--color-success-light)', color: 'var(--color-success-text)', border: '1px solid var(--color-success)' }
              : { backgroundColor: 'var(--color-error-light)', color: 'var(--color-error-text)', border: '1px solid var(--color-error)' }
          }
        >
          {importStatus.message}
          <button
            onClick={() => setImportStatus(null)}
            className="ml-2 text-xs underline"
          >
            dismiss
          </button>
        </div>
      )}

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message="Failed to load lessons." />}

      {lessons && lessons.length === 0 && (
        <EmptyState
          title="No lessons yet"
          description="Click 'Import Lesson' to add a lesson from a JSON file."
        />
      )}

      {lessons && lessons.length > 0 && (
        <div className="space-y-2">
          {lessons.map((lesson: any) => (
            <LessonCard
              key={lesson.id}
              id={lesson.id}
              title={lesson.title}
              description={lesson.description}
              estimatedMinutes={lesson.estimatedMinutes}
              orderIndex={lesson.orderIndex}
            />
          ))}
        </div>
      )}
    </div>
  );
}
