import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Header,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/core/lib/cn';

interface DataTableProps<T> {
  /** Give a column an `accessorFn` (and optionally `sortDescFirst`) to make its header sortable. */
  columns: ColumnDef<T, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  data: T[];
  getRowId: (row: T) => string;
  /** Accessible name for the table. */
  caption: string;
  /** Column id shown as the heading of each card on phones. Defaults to the first column. */
  mobileTitleColumn?: string;
  /** Ids of columns holding figures: they are right-aligned, header included. */
  numericColumns?: string[];
  /** Show placeholder rows (first load). */
  loading?: boolean;
  /** True while new data is being fetched; dims the rows so the table doesn't flash empty. */
  busy?: boolean;
  /** Bar above the table: <TableToolbar>. */
  toolbar?: ReactNode;
  /** Bar below the table: <Pagination>. */
  footer?: ReactNode;
  /** Shown inside the table when there are no rows (empty list, or no search results). */
  empty?: ReactNode;
  /**
   * Pass to sort on the server: the table shows the sort state and reports clicks via
   * `onSortingChange`, and the page re-fetches. Leave out to sort the rows already loaded (small lists).
   */
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  /**
   * Makes the whole row (table row or phone card) clickable. Keep a real link in the row too, so
   * keyboard and screen-reader users have something to focus; clicks on links and buttons are left alone.
   */
  onRowClick?: (row: T) => void;
}

/** True when the click landed on (or inside) something that handles clicks itself. */
const isInteractive = (target: EventTarget) =>
  target instanceof Element && !!target.closest('a, button, input, select, textarea, label');

/**
 * The one table for every list in the app (courses, learners, categories, lessons).
 *
 *   toolbar  - search, filters and result count (see TableToolbar)
 *   table    - quiet sortable headers; from `md` up a real table, on phones each row becomes a card
 *   footer   - paging (see Pagination)
 *
 * It is "dumb" on purpose: the page owns the data, search, filters and paging (usually in the URL).
 */
export function DataTable<T>({
  columns,
  data,
  getRowId,
  caption,
  mobileTitleColumn,
  numericColumns = [],
  loading,
  busy,
  toolbar,
  footer,
  empty,
  sorting,
  onSortingChange,
  onRowClick,
}: DataTableProps<T>) {
  const serverSorted = sorting !== undefined;
  const [localSorting, setLocalSorting] = useState<SortingState>([]);
  const activeSorting = serverSorted ? sorting : localSorting;

  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: { sorting: activeSorting },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(activeSorting) : updater;
      if (serverSorted) onSortingChange?.(next);
      else setLocalSorting(next);
    },
    manualSorting: serverSorted,
    // A server-sorted table always has a sort order; small tables can return to "unsorted".
    enableSortingRemoval: !serverSorted,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: serverSorted ? undefined : getSortedRowModel(),
  });

  const headers = table.getHeaderGroups()[0]?.headers ?? [];
  const rows = table.getRowModel().rows;
  const titleId = mobileTitleColumn ?? headers[0]?.column.id;
  const alignRight = (columnId: string) => numericColumns.includes(columnId);

  return (
    <div className="flex flex-col gap-3 md:gap-0 md:overflow-hidden md:rounded-card md:border md:border-line md:bg-surface md:shadow-card">
      {toolbar && <div className="md:border-b md:border-line md:p-4">{toolbar}</div>}

      {loading ? (
        <SkeletonRows columns={headers.length} />
      ) : rows.length === 0 ? (
        // Inside the card on desktop, so drop the empty state's own dashed border there.
        <div className="md:px-6 md:py-8 md:[&>div]:rounded-none md:[&>div]:border-0">{empty}</div>
      ) : (
        <div
          className={cn('flex flex-col gap-3 md:gap-0', busy && 'opacity-60 transition-opacity')}
          aria-busy={busy}
        >
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-[0.9375rem]">
              <caption className="sr-only">{caption}</caption>
              <thead className="bg-spruce-50/60 text-[0.8125rem] font-medium text-ink-faint">
                <tr className="border-b border-line">
                  {headers.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={ariaSort(header)}
                      className={cn(
                        'px-5 py-2.5 font-medium whitespace-nowrap',
                        alignRight(header.column.id) && 'text-right',
                      )}
                    >
                      <HeaderCell header={header} alignRight={alignRight(header.column.id)} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/80">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'group/row transition-colors hover:bg-spruce-50/50',
                      onRowClick && 'cursor-pointer',
                    )}
                    onClick={
                      onRowClick
                        ? (e) => {
                            if (!isInteractive(e.target)) onRowClick(row.original);
                          }
                        : undefined
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          'px-5 py-3.5 align-middle',
                          alignRight(cell.column.id) && 'text-right',
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phone cards */}
          <ul className="flex flex-col gap-3 md:hidden" aria-label={caption}>
            {rows.map((row) => {
              const cells = row.getVisibleCells();
              const title = cells.find((c) => c.column.id === titleId);
              const rest = cells.filter((c) => c.column.id !== titleId);
              return (
                <li key={row.id}>
                  <Card
                    padding="sm"
                    className={cn('flex flex-col gap-3', onRowClick && 'cursor-pointer')}
                    onClick={
                      onRowClick
                        ? (e) => {
                            if (!isInteractive(e.target)) onRowClick(row.original);
                          }
                        : undefined
                    }
                  >
                    {title && (
                      <div className="font-display text-lg font-semibold">
                        {flexRender(title.column.columnDef.cell, title.getContext())}
                      </div>
                    )}
                    <dl className="flex flex-col gap-2.5">
                      {rest.map((cell) => {
                        const label = cell.column.columnDef.header;
                        return (
                          <div
                            key={cell.id}
                            className="flex items-center justify-between gap-4 text-[0.95rem]"
                          >
                            {typeof label === 'string' && label !== '' && (
                              <dt className="text-ink-faint">{label}</dt>
                            )}
                            <dd className="ml-auto text-right">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {footer && !loading && rows.length > 0 && (
        <div className="md:border-t md:border-line md:bg-spruce-50/30 md:px-5 md:py-3">
          {footer}
        </div>
      )}
    </div>
  );
}

/**
 * A sortable header is a button. The arrows stay hidden until you hover the header or it is the
 * active sort, so the header row stays calm.
 */
function HeaderCell<T>({
  header,
  alignRight,
}: {
  header: Header<T, unknown>;
  alignRight: boolean;
}) {
  const { column } = header;
  const label = header.isPlaceholder
    ? null
    : flexRender(column.columnDef.header, header.getContext());
  if (!column.getCanSort()) return <>{label}</>;

  const sorted = column.getIsSorted();
  const Icon = sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ChevronsUpDown;
  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className={cn(
        'group/sort -mx-2 inline-flex cursor-pointer items-center gap-1.5 rounded-control px-2 py-1 font-medium transition-colors hover:bg-spruce-100/60 hover:text-ink',
        alignRight && 'flex-row-reverse',
        sorted && 'text-ink',
      )}
    >
      {label}
      <Icon
        className={cn(
          'size-3.5 transition-opacity',
          sorted
            ? 'opacity-100'
            : 'opacity-0 group-hover/sort:opacity-60 group-focus-visible/sort:opacity-60',
        )}
        aria-hidden
      />
    </button>
  );
}

/** Tells screen readers which column the table is sorted by. */
const ariaSort = <T,>(header: Header<T, unknown>) => {
  if (!header.column.getCanSort()) return undefined;
  const sorted = header.column.getIsSorted();
  return sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none';
};

function SkeletonRows({ columns }: { columns: number }) {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col md:divide-y md:divide-line/80">
      {Array.from({ length: 5 }, (_, row) => (
        <div key={row} className="flex items-center gap-6 px-5 py-4">
          <Skeleton className="size-11 shrink-0 rounded-[0.7rem]" />
          {Array.from({ length: Math.min(Math.max(columns, 2), 4) - 1 }, (_, col) => (
            <Skeleton key={col} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Standalone placeholder for a table that hasn't got its toolbar yet (e.g. while a page title loads). */
export function TableSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <Card padding="none" className="overflow-hidden">
      <SkeletonRows columns={columns} />
    </Card>
  );
}
