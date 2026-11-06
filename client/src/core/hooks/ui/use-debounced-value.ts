import { useEffect, useState } from 'react';

/** Returns `value` after it has stopped changing for `delay` ms (e.g. for search-as-you-type). */
export const useDebouncedValue = <T>(value: T, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};
