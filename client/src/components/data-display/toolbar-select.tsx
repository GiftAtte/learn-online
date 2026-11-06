import { Select } from '@/components/ui/select';
import type { SelectOption } from '@/core/types/ui.types';
import { cn } from '@/core/lib/cn';

// Radix Select can't have an item with an empty value, so "no filter" uses this stand-in.
const ALL = '__all__';

interface ToolbarSelectProps {
  /** Accessible name, e.g. "Filter by status". The visible prefix is derived from it ("Status"). */
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Adds an option that clears the filter ("All statuses"). Omit for plain choices such as sorting. */
  allLabel?: string;
  /** Text shown inside the control before the value. Defaults to the label without "Filter by". */
  prefix?: string | null;
  className?: string;
}

/** "Filter by status" -> "Status"; other labels are used as they are. */
const prefixFrom = (label: string) => {
  const short = label.replace(/^Filter by /, '');
  return short.charAt(0).toUpperCase() + short.slice(1);
};

/**
 * A compact dropdown for table toolbars: filters and sorting. The control shows what it controls
 * ("Status: All") and tints itself while a filter is applied. With `allLabel`, picking "all" reports
 * an empty string, which pages treat as "no filter".
 */
export function ToolbarSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
  prefix,
  className,
}: ToolbarSelectProps) {
  const items = allLabel ? [{ value: ALL, label: allLabel }, ...options] : options;
  const selected = allLabel && value === '' ? ALL : value;
  const filtering = !!allLabel && selected !== ALL;

  return (
    <Select
      aria-label={label}
      value={selected}
      onValueChange={(next) => onChange(next === ALL ? '' : next)}
      options={items}
      prefix={prefix === null ? undefined : (prefix ?? `${prefixFrom(label)}:`)}
      displayValue={selected === ALL ? 'All' : items.find((item) => item.value === selected)?.label}
      active={filtering}
      className={cn('h-10 w-full text-[0.9375rem] sm:w-auto sm:min-w-40', className)}
    />
  );
}
