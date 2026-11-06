import { useId, type ReactNode } from 'react';
import { cn } from '@/core/lib/cn';

interface SectionProps {
  title: string;
  description?: string;
  /** Something to the right of the title: a count, a button, a link. */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * A titled block inside a page ("Your courses", "Recent activity"...).
 * Section titles are deliberately smaller than the page title, so the hierarchy is clear:
 * page title (32px) > section title (20px) > card title (18px).
 */
export function Section({ title, description, action, className, children }: SectionProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className={cn('flex min-w-0 flex-col gap-4', className)}>
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 id={headingId} className="text-xl font-semibold tracking-[-0.015em]">
            {title}
          </h2>
          {description && <p className="text-sm text-ink-soft">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

interface SectionCardProps {
  title?: string;
  description?: string;
  /** Buttons or a figure at the right end of the heading row. */
  actions?: ReactNode;
  /** Removes body padding, for lists and tables that run edge to edge. */
  flush?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * The standard content panel: an optional heading row (title, description, actions) over a body, in
 * the same raised style as every card. `min-w-0` lets it shrink inside a grid instead of pushing the
 * page wider than a phone.
 */
export function SectionCard({
  title,
  description,
  actions,
  flush,
  className,
  children,
}: SectionCardProps) {
  return (
    <section
      className={cn('min-w-0 rounded-card border border-line/70 bg-surface shadow-card', className)}
    >
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-[0.9375rem] leading-6 font-semibold">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-[0.8125rem] leading-5 text-ink-soft">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(!flush && 'p-5')}>{children}</div>
    </section>
  );
}
