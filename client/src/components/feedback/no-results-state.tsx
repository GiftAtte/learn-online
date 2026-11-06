import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MESSAGES } from '@/core/lib/messages';
import { EmptyState } from './empty-state';

interface NoResultsStateProps {
  /** Resets the search and filters that produced the empty result. */
  onClear: () => void;
  /** Button text; defaults to "Clear filters". Use "Clear search" when only a search box applies. */
  clearLabel?: string;
}

/** "Nothing matches your search": the one empty state every filtered list and table shows. */
export function NoResultsState({ onClear, clearLabel = 'Clear filters' }: NoResultsStateProps) {
  return (
    <EmptyState
      icon={SearchX}
      {...MESSAGES.empty.search}
      action={
        <Button variant="secondary" onClick={onClear}>
          {clearLabel}
        </Button>
      }
    />
  );
}
