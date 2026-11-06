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
  className?: string;
}

/**
 * The top of every page: optional back link, title, description and primary actions, closed off
 * with a hairline so the header reads as its own band above the content.
 * Pages don't render this directly; they use <Page>, which also sets the spacing below it.
 */
export function PageHeader({ title, description, actions, back, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-2">
        {back && (
          <Link
            to={back.to}
            className="-ml-1 inline-flex w-fit items-center gap-0.5 rounded-control py-1 pr-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
          >
            <ChevronLeft className="size-4" aria-hidden />
            {back.label}
          </Link>
        )}
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.025em] sm:text-[2rem]">
          {title}
        </h1>
        {description && <p className="max-w-prose text-[0.95rem] text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
