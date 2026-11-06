import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ProgressBar } from '@/components/ui/progress';
import { cn } from '@/core/lib/cn';

interface TitleCellProps {
  title: string;
  subtitle?: string;
  /** Makes the title a link. */
  to?: string;
  /** Something before the text that anchors the row: a thumbnail, an avatar, an icon tile. */
  leading?: ReactNode;
}

/** The first cell of a row: an optional visual, a bold title, and a quiet line under it. */
export function TitleCell({ title, subtitle, to, leading }: TitleCellProps) {
  return (
    <div className="flex min-w-0 items-center gap-3.5">
      {leading}
      <div className="flex min-w-0 flex-col">
        {to ? (
          <Link
            to={to}
            className="truncate font-semibold underline-offset-4 hover:text-spruce-700 hover:underline"
          >
            {title}
          </Link>
        ) : (
          <span className="truncate font-semibold">{title}</span>
        )}
        {subtitle && (
          <span className="line-clamp-1 text-sm font-normal text-ink-faint">{subtitle}</span>
        )}
      </div>
    </div>
  );
}

/** A progress bar with its percentage, for table cells. */
export function ProgressCell({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn('flex w-44 items-center gap-3', className)}>
      <ProgressBar value={value} label={label} size="sm" />
      <span className="w-10 text-right text-sm font-medium tnum">{Math.round(value)}%</span>
    </div>
  );
}

/** A figure, bold and tabular so columns of numbers line up. Pair with `numericColumns` on the table. */
export function NumberCell({ value }: { value: number | string }) {
  return <span className="font-medium tnum">{value}</span>;
}

/** A quiet secondary value such as a date. */
export function MutedCell({ children }: { children: ReactNode }) {
  return <span className="whitespace-nowrap text-ink-soft">{children}</span>;
}
