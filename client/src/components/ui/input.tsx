import type { ComponentProps } from 'react';
import { cn } from '@/core/lib/cn';
import { useFieldControl } from './form-field';

/** Shared look for text-like controls. 16px text prevents iOS from zooming on focus. */
export const fieldStyles = [
  'w-full rounded-xl border border-spruce-700/25 bg-surface px-4 text-base text-ink shadow-[0_1px_2px_rgba(16,24,40,0.04)]',
  'placeholder:text-ink-faint transition-[border-color,box-shadow] duration-200',
  'hover:border-spruce-700/40',
  'focus-visible:border-spruce-700/60 focus-visible:ring-4 focus-visible:ring-spruce-700/10 focus-visible:outline-none',
  'aria-invalid:border-danger aria-invalid:ring-danger/15 aria-invalid:hover:border-danger',
  'disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-faint',
];

export function Input({ className, ...props }: ComponentProps<'input'>) {
  const field = useFieldControl();
  return <input className={cn(fieldStyles, 'h-11', className)} {...field} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  const field = useFieldControl();
  return (
    <textarea
      className={cn(fieldStyles, 'min-h-28 resize-y py-2.5 leading-relaxed', className)}
      {...field}
      {...props}
    />
  );
}
