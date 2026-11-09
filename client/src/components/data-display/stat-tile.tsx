import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/core/lib/cn';
import type { StatTone } from '@/core/types/ui.types';

/** The tinted square behind the icon: soft tint, strong glyph. */
const ICON_TONE: Record<StatTone, string> = {
  default: 'bg-spruce-50 text-spruce-600',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
};

interface StatTileProps {
  label: string;
  value: ReactNode;
  /** Small supporting line, e.g. "3 published". */
  hint?: ReactNode;
  icon?: LucideIcon;
  /** Tints the icon tile to signal meaning (e.g. warning when something needs attention). */
  tone?: StatTone;
  /** Percentage change against the previous period; positive is shown as growth. */
  delta?: number | null;
  /** Makes the whole tile a link to the list behind the number. */
  href?: string;
}

/**
 * One headline figure: a tinted icon tile at the top left (and a change chip at the right when there
 * is one), then the label, the figure large and bold, and a hint. Pass `href` to link the tile to the
 * filtered list behind the number.
 */
export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
  delta,
  href,
}: StatTileProps) {
  const hasDelta = delta !== undefined && delta !== null;

  // Always stacked: icon (and change chip) on top, figure and label below. Tiles sit two per row on
  // phones, so the layout has to work in a narrow column.
  const body = (
    <>
      {Icon && (
        <span
          className={cn(
            'col-start-1 row-start-1 flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-10',
            ICON_TONE[tone],
          )}
          aria-hidden
        >
          <Icon className="size-[1.1rem] sm:size-5" strokeWidth={1.8} />
        </span>
      )}
      {/* The figure comes before the label so figures line up across tiles even when a label wraps. */}
      <div className={cn('col-span-2 col-start-1 row-start-2 min-w-0', Icon && 'mt-3 sm:mt-4')}>
        <p className="font-display text-xl leading-7 font-bold tracking-tight break-words tnum sm:text-[1.75rem] sm:leading-9">
          {value}
        </p>
        <p className="mt-0.5 text-sm leading-snug font-medium text-ink-soft">{label}</p>
        {hint && <p className="mt-1 line-clamp-2 text-xs text-ink-faint">{hint}</p>}
      </div>
      {hasDelta && (
        <span
          className={cn(
            'col-start-2 row-start-1 inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-1 text-[0.6875rem] font-semibold tnum',
            delta >= 0 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
          )}
        >
          {delta >= 0 ? (
            <ArrowUpRight className="size-3.5" aria-hidden />
          ) : (
            <ArrowDownRight className="size-3.5" aria-hidden />
          )}
          {Math.abs(delta)}%
        </span>
      )}
    </>
  );

  const classes = cn(
    'grid h-full min-w-0 grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_1fr] items-start gap-x-2 rounded-card border border-line/70 bg-surface p-3.5 shadow-card sm:p-5',
    href && 'transition-transform hover:-translate-y-0.5',
  );

  return href ? (
    <Link to={href} className={classes}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}
