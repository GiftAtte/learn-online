import type { CSSProperties } from 'react';
import { Check, History, Play } from 'lucide-react';

/** The three lessons shown in the preview; the second one is "playing". */
const LESSONS = [
  { title: 'Why TypeScript?', state: 'done' },
  { title: 'Types and Interfaces', state: 'playing' },
  { title: 'Generics in Practice', state: 'next' },
] as const;

/**
 * A small, animated picture of the product, used in the hero: a lesson player whose scrubber runs,
 * a finished lesson that gets ticked, and a "resumed" note. It is decoration only (it shows what
 * the app does), so screen readers skip it.
 */
export function HeroPreview() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-lg">
      {/* Status chips that float around the card */}
      <div
        className="lp-float absolute -top-5 right-2 z-10 flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-medium text-ink shadow-lift sm:-right-4"
        style={{ '--d': '0ms' } as CSSProperties}
      >
        <History className="size-4 text-spruce-600" />
        Resumed at 4:12
      </div>
      <div
        className="lp-float absolute -bottom-8 left-2 z-10 flex items-center gap-2 rounded-full bg-pencil-500 px-3.5 py-2 text-sm font-semibold text-spruce-950 shadow-lift sm:-left-4"
        style={{ '--d': '1800ms' } as CSSProperties}
      >
        <Check className="size-4" strokeWidth={3} />1 of 3 lessons done
      </div>

      <div className="lp-settle overflow-hidden rounded-[1.375rem] border border-white/15 bg-spruce-900 shadow-overlay">
        {/* The player */}
        <div className="relative aspect-video bg-gradient-to-br from-spruce-600 via-spruce-700 to-spruce-900">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-white/95 text-spruce-800 shadow-lift">
              <Play className="size-7 translate-x-0.5" fill="currentColor" />
            </span>
          </div>
          <p className="absolute top-3 left-4 text-sm font-medium text-white/90">
            Types and Interfaces
          </p>

          {/* Scrubber: the yellow part is what you have watched */}
          <div className="absolute inset-x-4 bottom-4">
            <div className="relative h-1.5 rounded-full bg-white/25">
              <div
                className="lp-scrub relative h-full rounded-full bg-pencil-500"
                style={{ width: '38%' }}
              >
                <span className="absolute top-1/2 -right-1.5 size-3.5 -translate-y-1/2 rounded-full bg-pencil-400 ring-4 ring-pencil-500/30" />
              </div>
            </div>
            <div className="mt-2 flex justify-between text-xs text-white/75 tabular-nums">
              <span>4:12</span>
              <span>10:54</span>
            </div>
          </div>
        </div>

        {/* The course's lessons */}
        <ul className="divide-y divide-white/10">
          {LESSONS.map(({ title, state }, index) => (
            <li key={title} className="flex items-center gap-3 px-5 py-3.5 text-sm">
              <span className="flex size-6 shrink-0 items-center justify-center">
                {state === 'done' && (
                  <span
                    className="lp-tick flex size-6 items-center justify-center rounded-full bg-success text-white"
                    style={{ '--d': '1300ms' } as CSSProperties}
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                )}
                {state === 'playing' && (
                  <span className="lp-pulse size-3 rounded-full bg-pencil-500" />
                )}
                {state === 'next' && (
                  <span className="size-3 rounded-full border border-white/35" />
                )}
              </span>
              <span className={state === 'next' ? 'text-white/55' : 'text-white'}>
                {index + 1}. {title}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
