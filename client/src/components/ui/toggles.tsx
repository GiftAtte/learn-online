import { Check } from 'lucide-react';
import { Checkbox as CheckboxPrimitive, Switch as SwitchPrimitive } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/core/lib/cn';

interface ToggleProps {
  label: ReactNode;
  description?: string;
}

/** Checkbox with its label; the whole row is clickable. */
export function Checkbox({
  label,
  description,
  className,
  ...props
}: ToggleProps & ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3 py-1', className)}>
      <CheckboxPrimitive.Root
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[0.3rem] border border-line-strong bg-surface transition-colors data-[state=checked]:border-brand data-[state=checked]:bg-brand"
        {...props}
      >
        <CheckboxPrimitive.Indicator>
          <Check className="size-3.5 text-on-brand" strokeWidth={3} aria-hidden />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <span className="flex flex-col">
        <span className="text-[0.95rem] text-ink">{label}</span>
        {description && <span className="text-sm text-ink-faint">{description}</span>}
      </span>
    </label>
  );
}

/** On/off setting such as "Published". */
export function Switch({
  label,
  description,
  className,
  ...props
}: ToggleProps & ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <label className={cn('flex cursor-pointer items-center justify-between gap-4 py-1', className)}>
      <span className="flex flex-col">
        <span className="text-[0.95rem] font-medium text-ink">{label}</span>
        {description && <span className="text-sm text-ink-faint">{description}</span>}
      </span>
      <SwitchPrimitive.Root
        className="relative h-7 w-12 shrink-0 rounded-full bg-line-strong transition-colors data-[state=checked]:bg-brand"
        {...props}
      >
        <SwitchPrimitive.Thumb className="block size-5 translate-x-1 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-6" />
      </SwitchPrimitive.Root>
    </label>
  );
}
