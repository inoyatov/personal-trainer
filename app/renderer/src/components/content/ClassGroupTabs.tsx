import React from 'react';

interface ClassGroup {
  id: string;
  type: string;
  title: string;
  orderIndex: number;
}

interface ClassGroupTabsProps {
  classGroups: ClassGroup[];
  activeGroupId: string | null;
  onSelect: (id: string) => void;
}

const typeVars: Record<string, { bg: string; text: string }> = {
  vocabulary: { bg: '--color-badge-blue', text: '--color-badge-blue-text' },
  grammar: { bg: '--color-badge-purple', text: '--color-badge-purple-text' },
  dialog: { bg: '--color-badge-green', text: '--color-badge-green-text' },
  writing: { bg: '--color-badge-orange', text: '--color-badge-orange-text' },
};

export function ClassGroupTabs({
  classGroups,
  activeGroupId,
  onSelect,
}: ClassGroupTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {classGroups.map((group) => {
        const isActive = group.id === activeGroupId;
        const colors = typeVars[group.type] ?? typeVars.vocabulary;

        return (
          <button
            key={group.id}
            onClick={() => onSelect(group.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              isActive ? 'ring-2 ring-offset-1' : ''
            }`}
            style={
              isActive
                ? {
                    backgroundColor: `var(${colors.bg})`,
                    color: `var(${colors.text})`,
                    outlineColor: 'var(--color-accent)',
                  }
                : {
                    backgroundColor: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-secondary)',
                  }
            }
          >
            {group.title}
          </button>
        );
      })}
    </div>
  );
}
