import type { ReactNode } from 'react';

/** The standard responsive grid for course cards: 1 column on phones, 2 on tablets, 3 on desktop. */
export function CourseGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">{children}</div>
  );
}
