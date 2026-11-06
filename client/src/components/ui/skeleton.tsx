import type { ComponentProps } from 'react';
import { cn } from '@/core/lib/cn';

/** Placeholder block shown while data loads. Compose it to mirror the final layout. */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden
      className={cn(
        'animate-shimmer rounded-control bg-[linear-gradient(90deg,var(--color-sunken)_25%,#f5f8f6_50%,var(--color-sunken)_75%)] bg-[length:200%_100%]',
        className,
      )}
      {...props}
    />
  );
}
