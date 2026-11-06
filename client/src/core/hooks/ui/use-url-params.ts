import { useSearchParams } from 'react-router-dom';

/**
 * Filter / search / page state that lives in the URL, so views can be shared and the back button works.
 * Values equal to their default are left out of the URL to keep links short.
 *
 *   const [params, setParams] = useUrlParams({ q: '', categoryId: '', page: '1' });
 *   setParams({ q: 'react', page: '1' });
 */
export function useUrlParams<T extends Record<string, string>>(defaults: T) {
  const [search, setSearch] = useSearchParams();

  const values = Object.fromEntries(
    Object.keys(defaults).map((key) => [key, search.get(key) ?? defaults[key]]),
  ) as T;

  const setValues = (patch: Partial<T>) =>
    setSearch(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(patch)) {
          if (value === undefined || value === defaults[key]) next.delete(key);
          else next.set(key, value as string);
        }
        return next;
      },
      { replace: true },
    );

  return [values, setValues] as const;
}
