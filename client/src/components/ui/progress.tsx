import { Progress as ProgressPrimitive } from 'radix-ui';
import { cn } from '@/core/lib/cn';

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  /** Accessible name, e.g. "Course progress". */
  label: string;
  size?: 'sm' | 'md';
  /** Use on dark or photo backgrounds. */
  onDark?: boolean;
  className?: string;
}

/**
 * The signature progress stroke: pencil yellow while in progress, solid spruce once complete.
 * Used on course cards, lesson rows, the video stage and dashboards.
 */
export function ProgressBar({ value, label, size = 'md', onDark, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  const complete = clamped >= 100;
  return (
    <ProgressPrimitive.Root
      value={clamped}
      aria-label={label}
      className={cn(
        'relative w-full overflow-hidden rounded-full',
        size === 'sm' ? 'h-1.5' : 'h-2.5',
        onDark ? 'bg-white/25' : 'bg-spruce-100',
        className,
      )}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full rounded-full transition-[width] duration-500 ease-out',
          complete ? (onDark ? 'bg-white' : 'bg-spruce-600') : 'bg-pencil-500',
        )}
        style={{ width: `${clamped}%` }}
      />
    </ProgressPrimitive.Root>
  );
}

/** Circular version for dashboards. The percentage is shown in the centre. */
export function ProgressRing({
  value,
  label,
  size = 72,
}: {
  value: number;
  label: string;
  size?: number;
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-spruce-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className={cn(
            'transition-[stroke-dashoffset] duration-700 ease-out',
            clamped >= 100 ? 'stroke-spruce-600' : 'stroke-pencil-500',
          )}
        />
      </svg>
      <span className="absolute font-display text-base font-semibold tnum">{clamped}%</span>
    </div>
  );
}
