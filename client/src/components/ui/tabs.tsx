import { Tabs as TabsPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/core/lib/cn';

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn('no-scrollbar flex gap-1 overflow-x-auto border-b border-line', className)}
      {...props}
    />
  );
}

/** The active tab is underlined with the pencil stroke. */
export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'relative cursor-pointer px-3.5 py-3 text-[0.95rem] font-medium whitespace-nowrap text-ink-soft transition-colors hover:text-ink',
        'data-[state=active]:text-ink',
        'after:absolute after:inset-x-3 after:-bottom-px after:h-[3px] after:rounded-full after:bg-pencil-500 after:opacity-0 data-[state=active]:after:opacity-100',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('pt-5', className)} {...props} />;
}

/**
 * A vertical tab list for settings-style pages: a rail of sections on the left from `md` up, and a
 * scrolling row on phones. Use with `<Tabs orientation="vertical">`.
 */
export function SideTabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      aria-orientation="vertical"
      className={cn(
        'no-scrollbar flex gap-1 overflow-x-auto border-b border-line pb-2 md:sticky md:top-6 md:w-64 md:shrink-0 md:flex-col md:gap-1.5 md:self-start md:overflow-visible md:border-b-0 md:pb-0',
        className,
      )}
      {...props}
    />
  );
}

/**
 * One section in a `SideTabsList`. Children are laid out by the caller (see `SideTabLabel`); the active
 * section lifts onto a white card with a soft border, and the rest stay quiet.
 */
export function SideTabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'group/tab relative flex cursor-pointer items-center gap-3 rounded-card border border-transparent px-3 py-2.5 text-left whitespace-nowrap transition-colors outline-none',
        'focus-visible:ring-2 focus-visible:ring-spruce-700/40',
        'text-ink-soft hover:bg-surface/70 hover:text-ink',
        'data-[state=active]:border-line/80 data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-card',
        'md:whitespace-normal',
        className,
      )}
      {...props}
    />
  );
}
