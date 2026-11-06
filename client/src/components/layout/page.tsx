import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, type PageHeaderProps } from './page-header';

interface PageProps extends PageHeaderProps {
  /** The page body. Each direct child is a block (a <Section>, a grid, a card) and gets equal spacing. */
  children: ReactNode;
}

/**
 * The one layout every page uses, so all screens share the same structure and spacing:
 *
 *   [ back link ]
 *   Title                      [ actions ]
 *   Description
 *   ────────────────────────────────────
 *   block
 *   block
 *   ...
 *
 * Never add your own outer padding or margins in a page; compose blocks inside <Page>.
 */
export function Page({ children, ...header }: PageProps) {
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader {...header} />
      <div className="flex flex-col gap-8 sm:gap-10">{children}</div>
    </div>
  );
}

/**
 * Loading placeholder shaped like <Page>: a header skeleton plus the skeleton of the page body.
 * Used when the page title itself depends on data that is still loading (e.g. a course name).
 */
export function PageSkeleton({ children }: { children?: ReactNode }) {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-6 sm:gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-2/3 sm:h-11" />
        <Skeleton className="h-5 w-1/2" />
      </div>
      {children}
    </div>
  );
}
