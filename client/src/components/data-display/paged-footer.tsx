import type { PageMeta } from '@/core/types/api.types';
import { Pagination } from './pagination';

interface PagedFooterProps {
  /** Paging details from the API response. */
  meta: PageMeta;
  /** The setter from `useUrlParams`; this footer writes the `page` and `pageSize` values. */
  setParams: (patch: { page?: string; pageSize?: string }) => void;
}

/** The footer of a table whose page and page size live in the URL: wires <Pagination> to `useUrlParams`. */
export function PagedFooter({ meta, setParams }: PagedFooterProps) {
  return (
    <Pagination
      page={meta.page}
      pageSize={meta.pageSize}
      total={meta.total}
      totalPages={meta.totalPages}
      onPageChange={(page) => setParams({ page: String(page) })}
      onPageSizeChange={(size) => setParams({ pageSize: String(size), page: '1' })}
    />
  );
}
