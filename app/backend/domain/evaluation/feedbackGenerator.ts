import { levenshteinDistance } from './typoTolerance';
import { stripArticle, extractArticle } from './articleChecker';

export interface FeedbackInput {
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  hintUsed: boolean;
  exerciseType: string;
}

export interface FeedbackResult {
  message: string;
  tone: 'positive' | 'encouraging' | 'corrective';
}

/**
 * Generate context-aware, supportive feedback based on the answer.
 * Replaces generic "Incorrect. The answer is: X" with specific guidance.
 */
export function generateFeedback(input: FeedbackInput): FeedbackResult {
  const { userAnswer, correctAnswer, isCorrect, hintUsed, exerciseType } = input;

  // --- Correct answers ---
  if (isCorrect) {
    if (hintUsed) {
      return {
        message: 'You got it with a hint. Next time try without!',
        tone: 'encouraging',
      };
    }

    const messages = [
      'Correct!',
      'Goed zo!',
      'That\'s right!',
      'Well done!',
    ];
    return {
      message: messages[Math.floor(Math.random() * messages.length)],
      tone: 'positive',
    };
  }

  // --- Incorrect answers ---
  const userNorm = userAnswer.trim().toLowerCase();
  const correctNorm = correctAnswer.trim().toLowerCase();

  // Check for wrong article (de/het confusion) — before spelling check
  const userWord = stripArticle(userNorm);
  const correctWord = stripArticle(correctNorm);
  const userArticle = extractArticle(userNorm);
  const correctArticle = extractArticle(correctNorm);

  if (userWord === correctWord && userArticle !== correctArticle && correctArticle) {
    return {
      message: `Good word, but it's "${correctArticle}" not "${userArticle ?? '(no article)'}". The answer is: ${correctAnswer}`,
      tone: 'encouraging',
    };
  }

  // Check if it was a close spelling (1-2 edits away)
  const distance = levenshteinDistance(userNorm, correctNorm);
  if (distance <= 2 && distance > 0) {
    return {
      message: `Almost! Check the spelling carefully. The answer is: ${correctAnswer}`,
      tone: 'encouraging',
    };
  }

  // Word order exercise — wrong order
  if (exerciseType === 'word-order') {
    return {
      message: `Not quite the right order. The correct sentence is: ${correctAnswer}`,
      tone: 'corrective',
    };
  }

  // Dialog exercise — general miss
  if (exerciseType === 'dialog-completion') {
    return {
      message: `Not this time. The word was: ${correctAnswer}. You'll remember next time!`,
      tone: 'encouraging',
    };
  }

  // General incorrect — completely wrong
  return {
    message: `Not quite. The answer is: ${correctAnswer}`,
    tone: 'corrective',
  };
}
