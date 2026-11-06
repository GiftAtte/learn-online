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
