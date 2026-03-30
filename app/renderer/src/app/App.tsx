import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from '../components/layout/MainLayout';
import { HomePage } from '../pages/HomePage';
import { CoursesPage } from '../pages/CoursesPage';
import { CoursePage } from '../pages/CoursePage';
import { ModulePage } from '../pages/ModulePage';
import { LessonPage } from '../pages/LessonPage';
import { StudyPage } from '../pages/StudyPage';
import { ReviewPage } from '../pages/ReviewPage';
import { ReviewStudyPage } from '../pages/ReviewStudyPage';
import { WritingLabPage } from '../pages/WritingLabPage';
import { ProgressPage } from '../pages/ProgressPage';
import { SettingsPage } from '../pages/SettingsPage';
import { ConjugationPracticePage } from '../pages/ConjugationPracticePage';
import { UnifiedStudyPage } from '../pages/UnifiedStudyPage';
import { useAppStore } from '../lib/store';
import { getThemeById, applyTheme } from '../lib/themes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: false,
    },
  },
});

function ThemeInitializer() {
  const themeId = useAppStore((s) => s.themeId);
  useEffect(() => {
    applyTheme(getThemeById(themeId));
  }, [themeId]);
  return null;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer />
      <HashRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:courseId" element={<CoursePage />} />
            <Route
              path="/courses/:courseId/modules/:moduleId"
              element={<ModulePage />}
            />
            <Route path="/lessons/:lessonId" element={<LessonPage />} />
            <Route path="/study/:lessonId" element={<StudyPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/review/study" element={<ReviewStudyPage />} />
            <Route path="/writing" element={<WritingLabPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/conjugation/:lessonId" element={<ConjugationPracticePage />} />
            <Route path="/unified/:courseId" element={<UnifiedStudyPage />} />
          </Routes>
        </MainLayout>
      </HashRouter>
    </QueryClientProvider>
  );
}
