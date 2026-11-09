import type { ReactNode } from 'react';

/** The standard row of <StatTile>s: 2 across on phones and tablets, 4 across on desktop. */
export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{children}</div>;
}
