import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { ClassGroupTabs } from '../components/content/ClassGroupTabs';
import { VocabularyList } from '../components/content/VocabularyList';
import { SentenceList } from '../components/content/SentenceList';
import { useLessonContent, useVocabulary } from '../hooks/useContentQueries';
import { SessionModeSelector, type SessionModeId } from '../features/study/components/SessionModeSelector';
import { api } from '../lib/api';

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { data, isLoading, error } = useLessonContent(lessonId);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  const activeGroup = data?.classGroups?.find((g: any) => g.id === activeGroupId);
  const { data: vocabulary } = useVocabulary(
    activeGroup?.type === 'vocabulary' ? activeGroupId ?? undefined : undefined,
  );

  React.useEffect(() => {
    if (data?.classGroups?.length && !activeGroupId) {
      setActiveGroupId(data.classGroups[0].id);
    }
  }, [data?.classGroups, activeGroupId]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load lesson." />;
  if (!data?.lesson) return <EmptyState title="Lesson not found" />;

  const sentencesForGroup = activeGroupId
    ? data.sentences?.filter((s: any) => s.classGroupId === activeGroupId)
    : data.sentences;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="mb-2 text-sm" style={{ color: 'var(--color-accent)' }}>
            &larr; Back
          </button>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {data.lesson.title}
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {data.lesson.description} (~{data.lesson.estimatedMinutes} min)
          </p>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="shrink-0 rounded px-2 py-1 text-sm opacity-60 hover:opacity-100 transition-opacity"
          title="Delete lesson"
        >
          🗑
        </button>
      </div>

      {data.classGroups?.length > 0 && (
        <div className="mb-6">
          <ClassGroupTabs classGroups={data.classGroups} activeGroupId={activeGroupId} onSelect={setActiveGroupId} />
        </div>
      )}

      <div className="mb-6">
        <SessionModeSelector
          onSelect={(mode: SessionModeId) => navigate(`/study/${lessonId}?mode=${mode}`)}
        />
      </div>

      {activeGroup?.type === 'vocabulary' && vocabulary && <VocabularyList items={vocabulary} />}
      {activeGroup?.type === 'vocabulary' && vocabulary && vocabulary.length === 0 && <EmptyState title="No vocabulary items" />}

      {(activeGroup?.type === 'grammar' || activeGroup?.type === 'dialog' || activeGroup?.type === 'writing') &&
        sentencesForGroup && sentencesForGroup.length > 0 && <SentenceList items={sentencesForGroup} />}

      {!activeGroup && data.sentences?.length > 0 && <SentenceList items={data.sentences} />}

      {activeGroup?.type === 'dialog' && data.dialogs?.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Dialogs</h3>
          {data.dialogs.map((dialog: any) => (
            <div key={dialog.id} className="rounded-lg border p-4" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{dialog.title}</h4>
              {dialog.scenario && <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{dialog.scenario}</p>}
            </div>
          ))}
        </div>
      )}

      {activeGroup?.type === 'grammar' && data.grammarPatterns?.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Grammar Patterns</h3>
          {data.grammarPatterns.map((pattern: any) => (
            <div key={pattern.id} className="rounded-lg border p-4" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{pattern.name}</h4>
              <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{pattern.description}</p>
            </div>
          ))}
        </div>
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Lesson"
          message={`Delete "${data.lesson.title}" and all its content? This cannot be undone.`}
          onConfirm={async () => {
            await api.content.deleteLesson(lessonId!);
            queryClient.invalidateQueries();
            navigate(-1);
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
