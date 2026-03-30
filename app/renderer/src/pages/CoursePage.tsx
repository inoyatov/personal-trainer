import React from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { ModuleList } from '../components/content/ModuleList';
import { useCourses, useModules } from '../hooks/useContentQueries';

export function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: courses } = useCourses();
  const { data: modules, isLoading, error } = useModules(courseId);

  const course = courses?.find((c: any) => c.id === courseId);

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
        <EmptyState
          title="No modules yet"
          description="This course has no modules."
        />
      )}

      {modules && modules.length > 0 && courseId && (
        <ModuleList modules={modules} courseId={courseId} />
      )}
    </div>
  );
}
