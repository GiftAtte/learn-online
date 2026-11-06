import { Check } from 'lucide-react';
import { DropdownMenu as MenuPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/core/lib/cn';

export const DropdownMenu = MenuPrimitive.Root;
export const DropdownMenuTrigger = MenuPrimitive.Trigger;

export function DropdownMenuContent({
  className,
  sideOffset = 8,
  ...props
}: ComponentProps<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-52 animate-fade-in rounded-card border border-line bg-surface p-1.5 shadow-overlay',
          className,
        )}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  tone,
  ...props
}: ComponentProps<typeof MenuPrimitive.Item> & { tone?: 'danger' }) {
  return (
    <MenuPrimitive.Item
      className={cn(
        'flex min-h-10 cursor-pointer items-center gap-2.5 rounded-control px-3 py-2 text-[0.95rem] outline-none select-none',
        tone === 'danger'
          ? 'text-danger data-highlighted:bg-danger-soft'
          : 'data-highlighted:bg-spruce-50',
        className,
      )}
      {...props}
    />
  );
}

/** A menu item with a tick, for switches such as "show this column". */
export function DropdownMenuCheckboxItem({
  className,
  children,
  ...props
}: ComponentProps<typeof MenuPrimitive.CheckboxItem>) {
  return (
    <MenuPrimitive.CheckboxItem
      className={cn(
        'relative flex min-h-10 cursor-pointer items-center rounded-control py-2 pr-3 pl-9 text-[0.95rem] outline-none select-none data-highlighted:bg-spruce-50',
        className,
      )}
      {...props}
    >
      <span className="absolute left-3 flex size-4 items-center justify-center">
        <MenuPrimitive.ItemIndicator>
          <Check className="size-4 text-spruce-600" aria-hidden />
        </MenuPrimitive.ItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: ComponentProps<typeof MenuPrimitive.Label>) {
  return (
    <MenuPrimitive.Label className={cn('px-3 py-2 text-sm text-ink-faint', className)} {...props} />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof MenuPrimitive.Separator>) {
  return <MenuPrimitive.Separator className={cn('my-1.5 h-px bg-line', className)} {...props} />;
}
