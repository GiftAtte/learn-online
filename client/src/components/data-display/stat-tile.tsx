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

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        {Icon ? (
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-xl',
              ICON_TONE[tone],
            )}
            aria-hidden
          >
            <Icon className="size-5" strokeWidth={1.8} />
          </span>
        ) : (
          <span />
        )}
        {hasDelta && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[0.6875rem] font-semibold tnum',
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
      </div>
      <p className="mt-4 text-sm font-medium text-ink-soft">{label}</p>
      <p className="mt-0.5 font-display text-[1.75rem] leading-9 font-bold tracking-tight tnum">
        {value}
      </p>
      {hint && <p className="mt-1 truncate text-xs text-ink-faint">{hint}</p>}
    </>
  );

  const classes = cn(
    'block min-w-0 rounded-card border border-line/70 bg-surface p-5 shadow-card',
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
