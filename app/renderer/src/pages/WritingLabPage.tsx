import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useCourses, useModules, useLessons } from '../hooks/useContentQueries';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

interface WritingCheck {
  name: string;
  passed: boolean;
  message: string;
}

interface WritingFeedbackData {
  score: number;
  checks: WritingCheck[];
  overallFeedback: string;
}

export function WritingLabPage() {
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const { data: modules } = useModules(selectedCourseId ?? undefined);
  const { data: lessons } = useLessons(selectedModuleId ?? undefined);

  const { data: prompts, isLoading: promptsLoading } = useQuery({
    queryKey: ['writingPrompts', selectedLessonId],
    queryFn: () => api.writing.getPrompts(selectedLessonId!),
    enabled: !!selectedLessonId,
  });

  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<WritingFeedbackData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activePrompt = prompts?.find((p: any) => p.id === activePromptId);

  const handleSubmit = async () => {
    if (!activePrompt || !text.trim()) return;
    setSubmitting(true);

    try {
      const result = await api.writing.submit({
        id: `ws-${Date.now()}`,
        promptId: activePrompt.id,
        text: text.trim(),
        score: null,
        feedbackJson: '{}',
      });

      // Evaluate locally
      const keywords = JSON.parse(activePrompt.expectedKeywords || '[]');
      const patterns = JSON.parse(activePrompt.targetPatterns || '[]');
      const evalResult = evaluateLocally(text.trim(), keywords, patterns);
      setFeedback(evalResult);
    } catch (err) {
      console.error('Failed to submit writing:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewPrompt = () => {
    setText('');
    setFeedback(null);
    setActivePromptId(null);
  };

  if (coursesLoading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Writing Lab" subtitle="Practice writing in Dutch" backTo="/" />

      {/* Lesson selector */}
      {!activePromptId && (
        <div className="mb-6 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <select
              value={selectedCourseId ?? ''}
              onChange={(e) => {
                setSelectedCourseId(e.target.value || null);
                setSelectedModuleId(null);
                setSelectedLessonId(null);
              }}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ backgroundColor: 'var(--color-bg-input)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            >
              <option value="">Select course...</option>
              {courses?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>

            <select
              value={selectedModuleId ?? ''}
              onChange={(e) => {
                setSelectedModuleId(e.target.value || null);
                setSelectedLessonId(null);
              }}
              disabled={!selectedCourseId}
              className="rounded-lg px-3 py-2 text-sm disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-bg-input)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            >
              <option value="">Select module...</option>
              {modules?.map((m: any) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>

            <select
              value={selectedLessonId ?? ''}
              onChange={(e) => setSelectedLessonId(e.target.value || null)}
              disabled={!selectedModuleId}
              className="rounded-lg px-3 py-2 text-sm disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-bg-input)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            >
              <option value="">Select lesson...</option>
              {lessons?.map((l: any) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>

          {promptsLoading && <LoadingSpinner />}

          {prompts && prompts.length === 0 && selectedLessonId && (
            <EmptyState title="No writing prompts" description="This lesson has no writing prompts." />
          )}

          {prompts && prompts.length > 0 && (
            <div className="space-y-2">
              {prompts.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => { setActivePromptId(p.id); setFeedback(null); setText(''); }}
                  className="w-full rounded-lg p-4 text-left"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
                >
                  <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{p.promptText}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Difficulty: {p.difficulty}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Writing area */}
      {activePrompt && (
        <div className="space-y-4">
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-accent-light)', border: '1px solid var(--color-accent)', color: 'var(--color-accent-text)' }}>
            <p className="text-sm font-medium">
              Prompt
            </p>
            <p className="mt-1" style={{ color: 'var(--color-text-primary)' }}>
              {activePrompt.promptText}
            </p>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!!feedback}
            placeholder="Schrijf hier je antwoord... (Write your answer here...)"
            rows={6}
            className="w-full rounded-lg px-4 py-3 text-sm outline-none disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-bg-input)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
          />

          <div className="flex gap-3">
            {!feedback && (
              <button
                onClick={handleSubmit}
                disabled={!text.trim() || submitting}
                className="rounded-lg px-6 py-2.5 text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text-inverse)' }}
              >
                {submitting ? 'Checking...' : 'Submit'}
              </button>
            )}
            <button
              onClick={handleNewPrompt}
              className="rounded-lg px-6 py-2.5 text-sm font-medium"
              style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              {feedback ? 'Try Another' : 'Back'}
            </button>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className="space-y-3">
              <div
                className="rounded-lg p-4"
                style={
                  feedback.score >= 0.7
                    ? { backgroundColor: 'var(--color-success-light)', border: '1px solid var(--color-success)' }
                    : feedback.score >= 0.5
                      ? { backgroundColor: 'var(--color-warning-light)', border: '1px solid var(--color-warning)' }
                      : { backgroundColor: 'var(--color-error-light)', border: '1px solid var(--color-error)' }
                }
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {feedback.overallFeedback}
                  </p>
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                    {Math.round(feedback.score * 100)}%
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                {feedback.checks.map((check, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded px-3 py-2 text-sm"
                    style={
                      check.passed
                        ? { backgroundColor: 'var(--color-success-light)', color: 'var(--color-success-text)' }
                        : { backgroundColor: 'var(--color-error-light)', color: 'var(--color-error-text)' }
                    }
                  >
                    <span>{check.passed ? '✓' : '✗'}</span>
                    <div>
                      <span className="font-medium">{check.name}: </span>
                      <span>{check.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Client-side writing evaluation (mirrors backend logic) */
function evaluateLocally(
  text: string,
  expectedKeywords: string[],
  targetPatterns: string[],
): WritingFeedbackData {
  const checks: WritingCheck[] = [];
  const trimmed = text.trim();

  // Non-empty
  checks.push({ name: 'Not empty', passed: trimmed.length > 0, message: trimmed.length > 0 ? 'Text provided' : 'Please write something' });
  if (!trimmed) return { score: 0, checks, overallFeedback: 'Please write something.' };

  // Min length
  const wordCount = trimmed.split(/\s+/).length;
  const hasMinLength = wordCount >= 5;
  checks.push({ name: 'Minimum length', passed: hasMinLength, message: hasMinLength ? `Good length (${wordCount} words)` : `Too short (${wordCount} words). Try at least 5 words.` });

  // Capitalization
  const sentences = trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const allCap = sentences.every((s) => /^[A-ZÀ-Ÿ]/.test(s.trim()));
  checks.push({ name: 'Capitalization', passed: allCap, message: allCap ? 'Sentences start with capitals' : 'Start each sentence with a capital letter' });

  // End punctuation
  const hasEnd = /[.!?]$/.test(trimmed);
  checks.push({ name: 'Punctuation', passed: hasEnd, message: hasEnd ? 'Ends with punctuation' : 'Add a period, ! or ? at the end' });

  // Keywords
  const lower = trimmed.toLowerCase();
  const found = expectedKeywords.filter((k) => lower.includes(k.toLowerCase()));
  const missing = expectedKeywords.filter((k) => !lower.includes(k.toLowerCase()));
  const kwCoverage = expectedKeywords.length > 0 ? found.length / expectedKeywords.length : 1;
  checks.push({
    name: 'Keyword coverage',
    passed: kwCoverage >= 0.5,
    message: expectedKeywords.length > 0
      ? `Used ${found.length}/${expectedKeywords.length} expected words${missing.length > 0 ? `. Try: ${missing.join(', ')}` : ''}`
      : 'No keywords expected',
  });

  // Patterns
  const foundP = targetPatterns.filter((p) => lower.includes(p.toLowerCase()));
  if (targetPatterns.length > 0) {
    checks.push({
      name: 'Target patterns',
      passed: foundP.length > 0,
      message: `Used ${foundP.length}/${targetPatterns.length} patterns`,
    });
  }

  // Sentence structure
  const hasSub = /\b(ik|wij|u|je|zij|hij|het|dit|dat|er)\b/i.test(trimmed);
  checks.push({ name: 'Sentence structure', passed: hasSub && wordCount >= 3, message: hasSub ? 'Contains subject and verb' : 'Write complete sentences with subject and verb' });

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100) / 100;

  let overallFeedback: string;
  if (score >= 0.85) overallFeedback = 'Excellent work! Your writing covers the topic well.';
  else if (score >= 0.7) overallFeedback = 'Good effort! Check the feedback below to improve.';
  else if (score >= 0.5) overallFeedback = 'A solid start. Try to address the missing items.';
  else overallFeedback = 'Keep practicing. Focus on complete sentences with expected vocabulary.';

  return { score, checks, overallFeedback };
}
