import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/core/lib/cn';

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Buttons aligned to the right (stacked under the title on phones). */
  actions?: ReactNode;
  /** Adds a "back" link above the title. */
  back?: { to: string; label: string };
  /** The big dark banner used on the landing page, for pages people arrive on (such as the catalog). */
  hero?: boolean;
  className?: string;
}

/**
 * The top of every page: optional back link, title, description and primary actions, closed off
 * with a hairline so the header reads as its own band above the content.
 * Pages don't render this directly; they use <Page>, which also sets the spacing below it.
 */
export function PageHeader({
  title,
  description,
  actions,
  back,
  hero,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between',
        hero
          ? 'lp-hero-bg relative overflow-hidden rounded-stage p-7 text-white sm:p-12'
          : 'border-b border-line pb-6',
        className,
      )}
    >
      <div className="relative flex min-w-0 flex-col gap-2">
        {back && (
          <Link
            to={back.to}
            className={cn(
              '-ml-1 inline-flex w-fit items-center gap-0.5 rounded-control py-1 pr-2 text-sm font-medium transition-colors',
              hero ? 'text-spruce-100 hover:text-white' : 'text-ink-soft hover:text-ink',
            )}
          >
            <ChevronLeft className="size-4" aria-hidden />
            {back.label}
          </Link>
        )}
        <h1
          className={cn(
            hero
              ? 'font-display text-3xl leading-[1.05] font-bold tracking-tight sm:text-5xl'
              : 'text-2xl leading-tight font-semibold tracking-[-0.025em] sm:text-[2rem]',
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              'max-w-prose',
              hero
                ? 'text-base text-spruce-100 sm:text-lg'
                : 'text-sm text-ink-soft sm:text-[0.95rem]',
            )}
          >
            {description}
          </p>
        )}
      </div>
      {actions && (
        // On phones the buttons sit under the title, so they span the row and push to the right, the same
        // side they are on desktop (beside the title).
        <div className="relative flex w-full shrink-0 flex-wrap items-center justify-end gap-2 sm:w-auto">
          {actions}
        </div>
      )}
    </header>
  );
}
