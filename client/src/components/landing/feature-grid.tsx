import type { CSSProperties } from 'react';
import { History, Library, ShieldCheck, Users } from 'lucide-react';
import { useInView } from '@/core/hooks/ui/use-in-view';

/** One row of a progress meter: a name, a bar that fills to `percent`, and the number. */
function MeterRow({ name, percent, delay }: { name: string; percent: number; delay: number }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="font-medium">{name}</span>
        <span className="text-ink-soft tabular-nums">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-sunken">
        <div
          className="lp-meter h-full rounded-full bg-spruce-600"
          style={{ '--to': `${percent}%`, '--d': `${delay}ms` } as CSSProperties}
        />
      </div>
    </div>
  );
}

/**
 * What a learner gets, as tiles of different sizes and colours (not a row of identical cards).
 * The meters inside fill once, when the grid scrolls into view.
 */
export function FeatureGrid() {
  const [ref, inView] = useInView<HTMLDivElement>(0.25);

  return (
    <div ref={ref} data-in-view={inView} className="grid gap-4 md:grid-cols-6">
      {/* Resume: the main promise of the player */}
      <div className="flex flex-col gap-5 rounded-card border border-line bg-surface p-6 shadow-card sm:p-8 md:col-span-4">
        <History className="size-7 text-spruce-600" aria-hidden />
        <div>
          <h3 className="text-2xl font-semibold">Pick up exactly where you stopped</h3>
          <p className="mt-2 max-w-lg text-ink-soft">
            Close the tab, switch to your phone, come back next week. The player saves your position
            in every lesson and starts from there.
          </p>
        </div>
        <div className="mt-auto rounded-control bg-sunken p-4">
          <div className="mb-2 flex justify-between text-sm text-ink-soft tabular-nums">
            <span>Lesson 2, saved position</span>
            <span>4:12 of 10:54</span>
          </div>
          <div className="h-2 rounded-full bg-white">
            <div
              className="lp-meter h-full rounded-full bg-pencil-500"
              style={{ '--to': '38%', '--d': '200ms' } as CSSProperties}
            />
          </div>
        </div>
      </div>

      {/* Progress across courses */}
      <div className="flex flex-col gap-5 rounded-card bg-spruce-700 p-6 text-white shadow-card sm:p-8 md:col-span-2">
        <h3 className="text-2xl font-semibold">See how far you have come</h3>
        <p className="text-spruce-100">
          Every course shows its own progress, so you know what to open next.
        </p>
        <div className="mt-auto flex flex-col gap-4 rounded-control bg-white p-4 text-ink">
          <MeterRow name="TypeScript" percent={100} delay={100} />
          <MeterRow name="React" percent={66} delay={250} />
          <MeterRow name="Node APIs" percent={33} delay={400} />
        </div>
      </div>

      {/* Short lessons */}
      <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-6 shadow-card md:col-span-2">
        <Library className="size-6 text-spruce-600" aria-hidden />
        <h3 className="text-xl font-semibold">Short, focused lessons</h3>
        <p className="text-ink-soft">
          Each course is a set of video lessons you can finish between other things.
        </p>
      </div>

      {/* Safe sign-in */}
      <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-6 shadow-card md:col-span-2">
        <ShieldCheck className="size-6 text-spruce-600" aria-hidden />
        <h3 className="text-xl font-semibold">Your account stays yours</h3>
        <p className="text-ink-soft">
          Passwords are stored hashed, your sign-in is hidden from page scripts, and you can sign
          out everywhere.
        </p>
      </div>

      {/* Administrators */}
      <div className="flex flex-col gap-3 rounded-card bg-pencil-100 p-6 shadow-card md:col-span-2">
        <Users className="size-6 text-pencil-700" aria-hidden />
        <h3 className="text-xl font-semibold">Running the courses?</h3>
        <p className="text-spruce-900/80">
          Administrators add courses and lessons, publish when ready, and follow each learner lesson
          by lesson.
        </p>
      </div>
    </div>
  );
}
