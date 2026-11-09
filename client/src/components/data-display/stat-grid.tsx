import type { ReactNode } from 'react';

/** The standard row of <StatTile>s: one per row on phones (cards span the row), 2 across on tablets (768px), 4 across on desktop. */
export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-4">{children}</div>
  );
}
