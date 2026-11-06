import { Search, X } from 'lucide-react';
import { cn } from '@/core/lib/cn';
import { fieldStyles } from '@/components/ui/input';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name; also used as the placeholder. */
  label: string;
  className?: string;
}

/** Search box with a clear button. Pair with `useDebouncedValue` before calling the API. */
export function SearchInput({ value, onChange, label, className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-[1.1rem] -translate-y-1/2 text-ink-faint"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        aria-label={label}
        className={cn(fieldStyles, 'h-10 pr-10 pl-10 [&::-webkit-search-cancel-button]:hidden')}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute top-1/2 right-1.5 inline-flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-sunken hover:text-ink"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
