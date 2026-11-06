import { cn } from '@/core/lib/cn';
import type { ChipOption } from '@/core/types/ui.types';

interface FilterChipsProps {
  options: ChipOption[];
  /** Selected value, or '' for "all". */
  value: string;
  onChange: (value: string) => void;
  allLabel?: string;
  label: string;
}

/** Single-choice filter row (e.g. categories). Scrolls sideways on phones without a visible scrollbar. */
export function FilterChips({
  options,
  value,
  onChange,
  allLabel = 'All',
  label,
}: FilterChipsProps) {
  const items: ChipOption[] = [{ value: '', label: allLabel }, ...options];
  return (
    <div
      role="group"
      aria-label={label}
      className="-mx-4 no-scrollbar flex snap-x gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:px-0"
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value || 'all'}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'min-h-10 shrink-0 cursor-pointer snap-start rounded-full border px-4 text-[0.9rem] font-medium transition-colors',
              active
                ? 'border-brand bg-brand text-on-brand'
                : 'border-line-strong bg-surface text-ink-soft hover:border-spruce-300 hover:text-ink',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
