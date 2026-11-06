import type { ReactNode } from 'react';
import { useId } from 'react';
import { cn } from '@/core/lib/cn';

interface SettingsSectionProps {
  title: string;
  /** Says what the section is for and what changing it does. Sits beside the card, not inside it. */
  description?: string;
  /** The controls. */
  children: ReactNode;
  /** A strip along the bottom of the card, usually the section's own button. */
  footer?: ReactNode;
  /** A red outline for destructive or end-of-session actions. */
  danger?: boolean;
  /**
   * Put the title above the card instead of beside it. Use it where the page already has a column
   * of its own (such as the settings rail), so the controls keep the full width.
   */
  stacked?: boolean;
  className?: string;
}

/**
 * One group of settings, laid out the same way on every settings-style page: the title and its
 * explanation on the left, the controls in a card on the right. On a phone they stack.
 * Stack several of them; a hairline separates one from the next.
 */
export function SettingsSection({
  title,
  description,
  children,
  footer,
  danger,
  stacked,
  className,
}: SettingsSectionProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        'grid gap-4 border-t border-line py-8 first:border-t-0 first:pt-0',
        stacked ? 'max-w-3xl' : 'lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-12',
        className,
      )}
    >
      <div className={cn('flex flex-col gap-1.5', !stacked && 'lg:pt-1')}>
        <h2 id={headingId} className="font-display text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-[0.9rem] leading-relaxed text-ink-soft">{description}</p>
        )}
      </div>

      <div
        className={cn(
          'min-w-0 overflow-hidden rounded-card border bg-surface shadow-card',
          danger ? 'border-danger/30' : 'border-line/80',
        )}
      >
        <div className="p-5 sm:p-6">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-line bg-sunken/35 px-5 py-3.5 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </section>
  );
}
