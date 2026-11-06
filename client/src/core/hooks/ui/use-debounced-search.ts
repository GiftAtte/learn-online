import { useEffect, useState } from 'react';
import { useDebouncedValue } from './use-debounced-value';

/**
 * Search-as-you-type for tables and the catalog. The text box updates instantly; `commit` (which
 * normally writes the URL and so triggers the API call) only runs once typing pauses.
 *
 *   const [text, setText] = useDebouncedSearch(params.q, (q) => setParams({ q, page: '1' }));
 *
 * To clear from code, call both `setText('')` and the URL update.
 */
export function useDebouncedSearch(
  committed: string,
  commit: (value: string) => void,
  delay = 350,
) {
  const [text, setText] = useState(committed);
  const debounced = useDebouncedValue(text, delay);

  useEffect(() => {
    if (debounced !== committed) commit(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the debounced text
  }, [debounced]);

  return [text, setText] as const;
}
