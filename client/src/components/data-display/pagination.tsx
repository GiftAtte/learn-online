import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolbarSelect } from './toolbar-select';

const PAGE_SIZES = ['10', '25', '50'];

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** When given, shows a "rows per page" selector. */
  onPageSizeChange?: (pageSize: number) => void;
}

/**
 * Footer for paged tables: "Showing 11–20 of 34" on the left; rows per page and previous / next on
 * the right. Renders nothing when there is nothing to page through.
 */
export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  if (total === 0) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-ink-soft tnum" aria-live="polite">
        Showing{' '}
        <span className="font-medium text-ink">
          {first}–{last}
        </span>{' '}
        of <span className="font-medium text-ink">{total}</span>
      </p>
      <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3 sm:w-auto sm:justify-end">
        {onPageSizeChange && (
          <ToolbarSelect
            label="Rows per page"
            prefix="Rows:"
            value={String(pageSize)}
            onChange={(value) => onPageSizeChange(Number(value))}
            options={PAGE_SIZES.map((size) => ({ value: size, label: size }))}
            className="sm:min-w-28"
          />
        )}
        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="icon-sm"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <span className="min-w-20 text-center text-sm text-ink-soft tnum">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="icon-sm"
            aria-label="Next page"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </nav>
  );
}
