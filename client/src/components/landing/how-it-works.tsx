import type { CSSProperties } from 'react';
import { useInView } from '@/core/hooks/ui/use-in-view';

/** The path from visitor to finished course. These really are in order, so they are numbered. */
const STEPS = [
  {
    title: 'Browse the catalog',
    text: 'Look through every course and its lessons. You do not need an account for this.',
  },
  {
    title: 'Create a free account',
    text: 'Sign up with your email. It takes less than a minute and costs nothing.',
  },
  {
    title: 'Enroll and watch',
    text: 'Join a course and watch its lessons in order. The player remembers where you stopped.',
  },
  {
    title: 'See your progress',
    text: 'Finished lessons are ticked for you, and the dashboard shows how far you are in each course.',
  },
];

/** Four numbered steps joined by a line that draws itself when the section comes into view. */
export function HowItWorks() {
  const [ref, inView] = useInView<HTMLOListElement>(0.2);

  return (
    <ol ref={ref} data-in-view={inView} className="relative grid gap-8 lg:grid-cols-4 lg:gap-6">
      {/* The line behind the numbers (wide screens) */}
      <div
        aria-hidden
        className="absolute top-5 right-[12.5%] left-[12.5%] hidden h-px bg-line-strong lg:block"
      >
        <div
          className="lp-meter h-full bg-spruce-600"
          style={{ '--to': '100%' } as CSSProperties}
        />
      </div>

      {STEPS.map(({ title, text }, index) => (
        <li
          key={title}
          className="relative border-l border-line-strong pl-8 lg:border-0 lg:pl-0 lg:text-center"
        >
          <span className="absolute top-0 -left-5 flex size-10 items-center justify-center rounded-full border border-line-strong bg-surface font-display text-lg font-semibold text-spruce-700 lg:static lg:mx-auto">
            {index + 1}
          </span>
          <div className="lg:mt-5">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-1.5 text-ink-soft">{text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
