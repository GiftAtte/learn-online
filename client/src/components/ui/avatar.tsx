import { cn } from '@/core/lib/cn';
import { initialsOf } from '@/core/lib/format';

/**
 * Initials avatar. It uses the app's one soft-green tile colour (the same as the category icons and the
 * stat tiles), so every person looks consistent instead of a different colour for each name.
 */
export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold',
        size === 'sm' && 'size-8 text-xs',
        size === 'md' && 'size-10 text-sm',
        size === 'lg' && 'size-14 text-lg',
        size === 'xl' && 'size-20 text-2xl',
        'bg-spruce-50 text-spruce-600',
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
