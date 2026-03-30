import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { CourseCard } from '../components/content/CourseCard';
import { useCourses } from '../hooks/useContentQueries';
import { api } from '../lib/api';

export function CoursesPage() {
  const { data: courses, isLoading, error } = useCourses();
  const queryClient = useQueryClient();
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleImport = async () => {
    setImportStatus(null);
    try {
      const result = await api.importExport.importPack();
      if (result.success) {
        const total = Object.values(result.counts).reduce(
          (sum: number, n: any) => sum + (n as number),
          0,
        );
        setImportStatus({
          type: 'success',
          message: `Imported ${total} items (${result.counts.courses} courses, ${result.counts.vocabulary} vocabulary, ${result.counts.sentences} sentences)`,
        });
        // Refresh course list
        queryClient.invalidateQueries({ queryKey: ['courses'] });
      } else if (result.errors?.length) {
        setImportStatus({
          type: 'error',
          message: result.errors.join('; '),
        });
      }
    } catch (err: any) {
      setImportStatus({ type: 'error', message: err.message });
    }
  };

  const handleExport = async (courseId: string) => {
    try {
      const result = await api.importExport.exportPack('course', courseId);
      if (result.success) {
        setImportStatus({
          type: 'success',
          message: `Exported to ${result.filePath}`,
        });
      } else {
        setImportStatus({
          type: 'error',
          message: result.error ?? 'Export failed',
        });
      }
    } catch (err: any) {
      setImportStatus({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Courses
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Select a course to begin studying
          </p>
        </div>
        <button
          onClick={handleImport}
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text-inverse)' }}
        >
          Import Content Pack
        </button>
      </div>

      {/* Import/export status message */}
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
      {error && <ErrorMessage message="Failed to load courses." />}

      {courses && courses.length === 0 && (
        <EmptyState
          title="No courses yet"
          description="Click 'Import Content Pack' to load a JSON content pack."
        />
      )}

      {courses && courses.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {courses.map((course: any) => (
            <div key={course.id} className="relative">
              <CourseCard
                id={course.id}
                title={course.title}
                description={course.description}
                targetLevel={course.targetLevel}
                languageCode={course.languageCode}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExport(course.id);
                }}
                className="absolute right-2 top-2 rounded px-2 py-1 text-xs"
                style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
              >
                Export
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
