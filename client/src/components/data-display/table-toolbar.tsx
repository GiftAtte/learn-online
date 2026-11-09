import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { SearchInput } from './search-input';

interface TableToolbarProps {
  search: { value: string; onChange: (value: string) => void; label: string };
  /** Filter controls, usually <ToolbarSelect>s. */
  filters?: ReactNode;
  /** Phone-only sort control (on larger screens people sort by clicking the column headers). */
  sort?: ReactNode;
  /** Result count, e.g. "12 courses". Announced to screen readers when it changes. */
  summary?: ReactNode;
  /** A link or button at the far right, e.g. "View more" to the full list. */
  action?: ReactNode;
  /** Pass when any search or filter is active; shows a "Clear filters" button. */
  onClear?: () => void;
}

/**
 * The bar above every data table: search, then filters, then the result count on the right.
 * All controls share one height, and a filter that is applied tints itself.
 */
export function TableToolbar({
  search,
  filters,
  sort,
  summary,
  action,
  onClear,
}: TableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
      <SearchInput
        value={search.value}
        onChange={search.onChange}
        label={search.label}
        className="w-full md:w-72"
      />
      {(filters || sort) && (
        <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 md:flex md:items-center">
          {filters}
          {sort && <div className="contents md:hidden">{sort}</div>}
        </div>
      )}
      <div className="flex items-center gap-2 md:ml-auto">
        {onClear && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear filters
          </Button>
        )}
        {summary && (
          <p
            className="rounded-full bg-sunken/70 px-3 py-1.5 text-sm font-medium text-ink-soft tnum"
            aria-live="polite"
          >
            {summary}
          </p>
        )}
        {action}
      </div>
    </div>
  );
}
