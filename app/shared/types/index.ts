export type MasteryStage =
  | 'new'
  | 'seen'
  | 'recognized'
  | 'recalled'
  | 'stable'
  | 'automated';

export type ExerciseType =
  | 'multiple-choice-gap-fill'
  | 'typed-gap-fill'
  | 'dialog-completion'
  | 'word-order'
  | 'guided-writing'
  | 'translation-choice'
  | 'sentence-transformation'
  | 'dictation-recall'
  | 'grammar-drill'
  | 'conjugation-typed'
  | 'conjugation-in-sentence';

export type ClassGroupType = 'vocabulary' | 'grammar' | 'dialog' | 'writing';

export type SessionMode =
  | 'learn'
  | 'practice'
  | 'review'
  | 'exam-simulation'
  | 'writing-lab';

export interface Course {
  id: string;
  title: string;
  description: string;
  targetLevel: string;
  languageCode: string;
  version: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  orderIndex: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  orderIndex: number;
  estimatedMinutes: number;
}

export interface ClassGroup {
  id: string;
  lessonId: string;
  type: ClassGroupType;
  title: string;
  orderIndex: number;
}

export interface VocabularyItem {
  id: string;
  lemma: string;
  displayText: string;
  article: string | null;
  partOfSpeech: string;
  translation: string;
  transliteration: string | null;
  tags: string[];
  difficulty: number;
}

export interface SentenceItem {
  id: string;
  text: string;
  translation: string;
  lessonId: string;
  classGroupId: string;
  targetVocabularyIds: string[];
  targetGrammarPatternIds: string[];
  audioPath: string | null;
}

export interface Dialog {
  id: string;
  lessonId: string;
  title: string;
  scenario: string;
}

export interface DialogTurn {
  id: string;
  dialogId: string;
  speaker: string;
  text: string;
  translation: string;
  orderIndex: number;
}

export interface GrammarPattern {
  id: string;
  name: string;
  description: string;
  explanationMarkdown: string;
  examples: string[];
  lessonId: string | null;
}
