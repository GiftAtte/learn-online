import type { SortingState } from '@tanstack/react-table';

/** Turns the `sortBy` / `sortDir` URL values into the table's sort state. */
export const toSortingState = (sortBy: string, sortDir: string): SortingState => [
  { id: sortBy, desc: sortDir === 'desc' },
];

/** Turns the table's sort state back into `sortBy` / `sortDir` values (falling back to `fallback`). */
export const fromSortingState = (
  sorting: SortingState,
  fallback: { sortBy: string; sortDir: 'asc' | 'desc' },
) => {
  const first = sorting[0];
  return first
    ? { sortBy: first.id, sortDir: first.desc ? ('desc' as const) : ('asc' as const) }
    : fallback;
};

/** Newest first: the starting order of every sortable list. */
export const DEFAULT_SORT = { sortBy: 'createdAt', sortDir: 'desc' } as const;

/**
 * Splits a sort choice from a select ("name:asc") into `sortBy` and `sortDir` URL values,
 * falling back to `fallback` for anything missing.
 */
export const parseSortOption = (
  value: string,
  fallback: { sortBy: string; sortDir: 'asc' | 'desc' },
) => {
  const [sortBy = fallback.sortBy, sortDir = fallback.sortDir] = value.split(':');
  return { sortBy, sortDir };
};
