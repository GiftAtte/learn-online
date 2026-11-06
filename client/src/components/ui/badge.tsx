import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/core/lib/cn';

const badgeStyles = cva(
  'inline-flex w-fit items-center gap-1.5 rounded-full text-[0.8rem] leading-none font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'bg-sunken text-ink-soft',
        brand: 'bg-spruce-100 text-spruce-800',
        success: 'bg-success-soft text-success',
        // Pencil yellow always means "in progress / you are here".
        progress: 'bg-pencil-100 text-pencil-700',
        warning: 'bg-warning-soft text-warning',
        danger: 'bg-danger-soft text-danger',
        info: 'bg-info-soft text-info',
        // For use on top of photos and the dark video stage.
        overlay: 'bg-spruce-950/70 text-white backdrop-blur-sm',
      },
      size: { sm: 'px-2 py-1', md: 'px-2.5 py-1.5' },
    },
    defaultVariants: { tone: 'neutral', size: 'md' },
  },
);

interface BadgeProps extends ComponentProps<'span'>, VariantProps<typeof badgeStyles> {
  icon?: ReactNode;
}

export function Badge({ className, tone, size, icon, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeStyles({ tone, size }), className)} {...props}>
      {icon}
      {children}
    </span>
  );
}
