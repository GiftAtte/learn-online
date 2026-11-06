import type { ComponentProps } from 'react';
import { cn } from '@/core/lib/cn';

interface ContainerProps extends ComponentProps<'div'> {
  /**
   * Fill all the width that is available (with small side margins) instead of a centred column.
   * Used next to the sidebar so content uses the screen and only keeps a small margin on both sides.
   */
  fluid?: boolean;
}

/** Standard page gutters: 16px on phones, 24px from `sm`, 32px from `lg`. */
export function Container({ className, fluid, ...props }: ContainerProps) {
  return (
    <div
      className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', !fluid && 'max-w-6xl', className)}
      {...props}
    />
  );
}
