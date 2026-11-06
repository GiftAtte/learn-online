import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/core/lib/cn';
import { Spinner } from './spinner';

export const buttonStyles = cva(
  [
    'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap select-none',
    'transition-[background-color,color,box-shadow,transform] duration-150 active:translate-y-px',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-brand text-on-brand hover:bg-brand-hover',
        // Pencil yellow: used for the single most important "continue" action on a screen.
        accent: 'bg-pencil-500 text-spruce-950 hover:bg-pencil-400',
        secondary: 'border border-line-strong bg-surface text-ink hover:bg-sunken/70',
        ghost: 'text-ink-soft hover:bg-sunken hover:text-ink',
        danger: 'bg-danger text-white hover:bg-danger-hover',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-[0.95rem]',
        lg: 'h-12 px-6 text-base',
        icon: 'size-11',
        'icon-sm': 'size-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonStyles> {
  /** Render the child element (e.g. a router Link) with button styling. */
  asChild?: boolean;
  /** Shows a spinner and blocks clicks while an action is running. */
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild,
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const classes = cn(buttonStyles({ variant, size }), className);

  if (asChild) {
    return (
      <Slot.Root className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }
  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
