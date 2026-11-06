import { cn } from '@/core/lib/cn';
import { initialsOf } from '@/core/lib/format';

const TINTS = [
  'bg-spruce-100 text-spruce-800',
  'bg-pencil-100 text-pencil-700',
  'bg-info-soft text-info',
  'bg-success-soft text-success',
];

/** Initials avatar. The tint is derived from the name so a person always looks the same. */
export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const tint = TINTS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TINTS.length];
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold',
        size === 'sm' && 'size-8 text-xs',
        size === 'md' && 'size-10 text-sm',
        size === 'lg' && 'size-14 text-lg',
        tint,
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
