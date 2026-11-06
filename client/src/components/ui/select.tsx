import { Check, ChevronDown } from 'lucide-react';
import { Select as SelectPrimitive } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '@/core/lib/cn';
import { useFieldControl } from './form-field';
import { fieldStyles } from './input';
import type { SelectOption } from '@/core/types/ui.types';

interface SelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Accessible name when the select has no visible <label> (e.g. table filters). */
  'aria-label'?: string;
  /** Small label shown inside the control before the value, e.g. "Status" -> "Status: All". */
  prefix?: string;
  /** Overrides the text shown for the selected value. */
  displayValue?: ReactNode;
  /** Tints the control to show a filter is applied. */
  active?: boolean;
}

/** Accessible dropdown with the same look as Input. Options render in a themed popover. */
export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  disabled,
  className,
  'aria-label': ariaLabel,
  prefix,
  displayValue,
  active,
}: SelectProps) {
  const field = useFieldControl();
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={cn(
          fieldStyles,
          'flex h-11 cursor-pointer items-center justify-between gap-2 text-left',
          active && 'border-spruce-400 bg-spruce-50 hover:border-spruce-500',
          className,
        )}
        {...field}
        aria-label={ariaLabel ?? undefined}
      >
        <span className="flex min-w-0 items-baseline gap-1.5 truncate">
          {prefix && <span className="shrink-0 text-ink-faint">{prefix}</span>}
          <SelectPrimitive.Value
            placeholder={<span className="text-ink-faint">{placeholder}</span>}
          >
            {displayValue}
          </SelectPrimitive.Value>
        </span>
        <SelectPrimitive.Icon>
          <ChevronDown className="size-4 text-ink-faint" aria-hidden />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-72 w-(--radix-select-trigger-width) animate-fade-in overflow-hidden rounded-card border border-line bg-surface shadow-overlay"
        >
          <SelectPrimitive.Viewport className="p-1.5">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="relative flex min-h-10 cursor-pointer items-center rounded-control py-2 pr-8 pl-3 text-[0.95rem] outline-none select-none data-highlighted:bg-spruce-50 data-[state=checked]:font-medium"
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2.5">
                  <Check className="size-4 text-spruce-600" aria-hidden />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
