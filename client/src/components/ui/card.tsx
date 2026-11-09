import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/core/lib/cn';

const cardStyles = cva('rounded-card border border-line/70 bg-surface shadow-card', {
  variants: {
    padding: { none: '', sm: 'p-4', md: 'p-4 sm:p-6' },
    // Cards that lead somewhere lift on hover; static panels do not.
    interactive: {
      true: 'transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lift',
      false: '',
    },
  },
  defaultVariants: { padding: 'md', interactive: false },
});

interface CardProps extends ComponentProps<'div'>, VariantProps<typeof cardStyles> {
  asChild?: boolean;
}

export function Card({ className, padding, interactive, asChild, ...props }: CardProps) {
  const Comp = asChild ? Slot.Root : 'div';
  return <Comp className={cn(cardStyles({ padding, interactive }), className)} {...props} />;
}
