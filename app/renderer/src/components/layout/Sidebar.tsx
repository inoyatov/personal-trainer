import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/courses', label: 'Courses' },
  { to: '/review', label: 'Review Queue' },
  { to: '/writing', label: 'Writing Lab' },
  { to: '/progress', label: 'Progress' },
  { to: '/settings', label: 'Settings' },
];

export function Sidebar() {
  return (
    <aside
      className="flex w-56 flex-col border-r"
      style={{
        backgroundColor: 'var(--color-bg-sidebar)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="p-4">
        <h1
          className="text-lg font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Personal Trainer
        </h1>
        <p
          className="text-xs"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Dutch A2 Exam Prep
        </p>
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="block rounded-md px-3 py-2 text-sm font-medium transition-colors"
            style={({ isActive }) => ({
              backgroundColor: isActive
                ? 'var(--color-bg-active)'
                : 'transparent',
              color: isActive
                ? 'var(--color-accent-text)'
                : 'var(--color-text-secondary)',
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
