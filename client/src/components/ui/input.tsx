import type { LucideIcon } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
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

interface InputProps extends ComponentProps<'input'> {
  /** A small icon inside the left edge of the field, e.g. an envelope for an email address. */
  icon?: LucideIcon;
  /** Something inside the right edge, e.g. a show/hide button. It stays clickable. */
  trailing?: ReactNode;
}

/**
 * A text input. Pass `icon` for a leading icon and `trailing` for a control at the right end; with
 * neither it renders the bare <input>, exactly as before.
 */
export function Input({ className, icon: Icon, trailing, ...props }: InputProps) {
  const field = useFieldControl();
  if (!Icon && !trailing) {
    return <input className={cn(fieldStyles, 'h-11', className)} {...field} {...props} />;
  }
  return (
    <div className="relative">
      {Icon && (
        <Icon
          className="pointer-events-none absolute top-1/2 left-3.5 size-[1.15rem] -translate-y-1/2 text-ink-faint"
          strokeWidth={1.8}
          aria-hidden
        />
      )}
      <input
        className={cn(fieldStyles, 'h-11', Icon && 'pl-11', trailing && 'pr-12', className)}
        {...field}
        {...props}
      />
      {trailing && <div className="absolute top-1/2 right-1.5 -translate-y-1/2">{trailing}</div>}
    </div>
  );
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
