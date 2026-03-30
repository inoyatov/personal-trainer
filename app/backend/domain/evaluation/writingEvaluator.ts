export interface WritingFeedback {
  score: number; // 0-1
  checks: WritingCheck[];
  overallFeedback: string;
}

export interface WritingCheck {
  name: string;
  passed: boolean;
  message: string;
}

interface EvaluationInput {
  text: string;
  expectedKeywords: string[];
  targetPatterns: string[];
}

/**
 * Evaluate a writing submission using heuristic checks.
 * No AI/NLP — just straightforward rule-based feedback.
 */
export function evaluateWriting(input: EvaluationInput): WritingFeedback {
  const { text, expectedKeywords, targetPatterns } = input;
  const checks: WritingCheck[] = [];

  // 1. Non-empty check
  const trimmed = text.trim();
  checks.push({
    name: 'Not empty',
    passed: trimmed.length > 0,
    message: trimmed.length > 0 ? 'Text provided' : 'Please write something',
  });

  if (trimmed.length === 0) {
    return { score: 0, checks, overallFeedback: 'Please write something.' };
  }

  // 2. Minimum length
  const wordCount = trimmed.split(/\s+/).length;
  const hasMinLength = wordCount >= 5;
  checks.push({
    name: 'Minimum length',
    passed: hasMinLength,
    message: hasMinLength
      ? `Good length (${wordCount} words)`
      : `Too short (${wordCount} words). Try to write at least 5 words.`,
  });

  // 3. Capitalization
  const sentences = trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const allCapitalized = sentences.every(
    (s) => /^[A-ZÀ-Ÿ]/.test(s.trim()),
  );
  checks.push({
    name: 'Capitalization',
    passed: allCapitalized,
    message: allCapitalized
      ? 'Sentences start with capital letters'
      : 'Remember to start each sentence with a capital letter',
  });

  // 4. Ending punctuation
  const hasEndPunctuation = /[.!?]$/.test(trimmed);
  checks.push({
    name: 'Punctuation',
    passed: hasEndPunctuation,
    message: hasEndPunctuation
      ? 'Ends with punctuation'
      : 'Add a period, exclamation mark, or question mark at the end',
  });

  // 5. Keyword coverage
  const lowerText = trimmed.toLowerCase();
  const foundKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const keyword of expectedKeywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  }

  const keywordCoverage =
    expectedKeywords.length > 0
      ? foundKeywords.length / expectedKeywords.length
      : 1;

  checks.push({
    name: 'Keyword coverage',
    passed: keywordCoverage >= 0.5,
    message:
      expectedKeywords.length > 0
        ? `Used ${foundKeywords.length}/${expectedKeywords.length} expected words${
            missingKeywords.length > 0
              ? `. Try to include: ${missingKeywords.join(', ')}`
              : ''
          }`
        : 'No specific keywords expected',
  });

  // 6. Target pattern usage
  const foundPatterns: string[] = [];
  for (const pattern of targetPatterns) {
    if (lowerText.includes(pattern.toLowerCase())) {
      foundPatterns.push(pattern);
    }
  }

  const patternCoverage =
    targetPatterns.length > 0
      ? foundPatterns.length / targetPatterns.length
      : 1;

  if (targetPatterns.length > 0) {
    checks.push({
      name: 'Target patterns',
      passed: patternCoverage >= 0.3,
      message: `Used ${foundPatterns.length}/${targetPatterns.length} target patterns${
        foundPatterns.length > 0
          ? `: ${foundPatterns.join(', ')}`
          : ''
      }`,
    });
  }

  // 7. Sentence completeness (at least contains a subject-like word)
  const hasSubject = /\b(ik|wij|u|je|zij|hij|het|dit|dat|er)\b/i.test(trimmed);
  const hasVerb = trimmed.split(/\s+/).length >= 3; // rough proxy
  checks.push({
    name: 'Sentence structure',
    passed: hasSubject && hasVerb,
    message:
      hasSubject && hasVerb
        ? 'Contains subject and verb structure'
        : 'Try to write complete sentences with a subject and verb',
  });

  // Calculate score
  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100) / 100;

  // Overall feedback
  let overallFeedback: string;
  if (score >= 0.85) {
    overallFeedback = 'Excellent work! Your writing covers the topic well.';
  } else if (score >= 0.7) {
    overallFeedback = 'Good effort! Check the feedback below to improve.';
  } else if (score >= 0.5) {
    overallFeedback = 'A solid start. Try to address the missing items.';
  } else {
    overallFeedback = 'Keep practicing. Focus on using complete sentences with the expected vocabulary.';
  }

  return { score, checks, overallFeedback };
}
