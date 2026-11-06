import type { UseQueryResult } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '@/core/api/error';
import { QueryBoundary } from '@/components/feedback/query-boundary';

/** Minimal stand-in for a TanStack Query result. */
const fakeQuery = (state: Partial<UseQueryResult<string[]>>) =>
  ({
    isPending: false,
    isError: false,
    data: undefined,
    error: null,
    refetch: vi.fn(),
    ...state,
  }) as UseQueryResult<string[]>;

const renderBoundary = (query: UseQueryResult<string[]>) =>
  render(
    <QueryBoundary
      query={query}
      loading={<p>loading skeleton</p>}
      isEmpty={(items) => items.length === 0}
      empty={<p>nothing here</p>}
    >
      {(items) => <p>{items.join(', ')}</p>}
    </QueryBoundary>,
  );

describe('QueryBoundary', () => {
  it('shows the loading placeholder during the first load', () => {
    renderBoundary(fakeQuery({ isPending: true }));
    expect(screen.getByText('loading skeleton')).toBeInTheDocument();
  });

  it('shows the error with a working "Try again" button', async () => {
    const refetch = vi.fn();
    renderBoundary(
      fakeQuery({
        isError: true,
        error: new ApiError('Can’t reach the server.', 0, 'NETWORK'),
        refetch,
      } as Partial<UseQueryResult<string[]>>),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Can’t reach the server.');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state when the data counts as empty', () => {
    renderBoundary(fakeQuery({ data: [] }));
    expect(screen.getByText('nothing here')).toBeInTheDocument();
  });

  it('renders the content when there is data', () => {
    renderBoundary(fakeQuery({ data: ['a', 'b'] }));
    expect(screen.getByText('a, b')).toBeInTheDocument();
  });
});
