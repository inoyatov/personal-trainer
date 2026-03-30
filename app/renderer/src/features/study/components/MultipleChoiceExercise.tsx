import React, { useState, useEffect, useCallback } from 'react';

interface MultipleChoiceExerciseProps {
  options: string[];
  correctIndex: number;
  onAnswer: (selectedIndex: number, correct: boolean) => void;
  disabled?: boolean;
}

export function MultipleChoiceExercise({
  options,
  correctIndex,
  onAnswer,
  disabled = false,
}: MultipleChoiceExerciseProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    setSelectedIndex(null);
  }, [options]);

  const handleSelect = useCallback(
    (index: number) => {
      if (disabled || selectedIndex !== null) return;
      setSelectedIndex(index);
      onAnswer(index, index === correctIndex);
    },
    [disabled, selectedIndex, correctIndex, onAnswer],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (disabled || selectedIndex !== null) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= options.length) {
        handleSelect(num - 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [disabled, selectedIndex, options.length, handleSelect]);

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((option, index) => {
        const isSelected = selectedIndex === index;
        const isCorrect = index === correctIndex;
        const answered = selectedIndex !== null;

        let borderColor = 'var(--color-border)';
        let bgColor = 'var(--color-bg-secondary)';
        let numberBg = 'var(--color-bg-tertiary)';
        let numberColor = 'var(--color-text-secondary)';
        let opacity = '1';

        if (answered) {
          if (isCorrect) {
            borderColor = 'var(--color-success)';
            bgColor = 'var(--color-success-light)';
            numberBg = 'var(--color-success)';
            numberColor = 'var(--color-text-inverse)';
          } else if (isSelected && !isCorrect) {
            borderColor = 'var(--color-error)';
            bgColor = 'var(--color-error-light)';
            numberBg = 'var(--color-error)';
            numberColor = 'var(--color-text-inverse)';
          } else {
            opacity = '0.6';
          }
        }

        return (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={disabled || answered}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
              answered ? 'cursor-default' : 'cursor-pointer'
            }`}
            style={{ borderColor, backgroundColor: bgColor, opacity }}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={{ backgroundColor: numberBg, color: numberColor }}
            >
              {index + 1}
            </span>
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {option}
            </span>
          </button>
        );
      })}
    </div>
  );
}
