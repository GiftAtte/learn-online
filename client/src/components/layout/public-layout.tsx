import { Outlet } from 'react-router-dom';
import { Container } from './container';
import { PublicFooter } from './public-footer';
import { PublicHeader } from './public-header';

/**
 * The frame for signed-out visitors: the same header and footer as the landing page around the
 * page being viewed (the catalog, a course). Signed-in people get the app frame instead (AppShell).
 */
export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-control focus:bg-brand focus:px-4 focus:py-2 focus:text-on-brand"
      >
        Skip to content
      </a>
      <PublicHeader />
      <main id="main" className="flex-1 py-6 sm:py-10">
        <Container>
          <Outlet />
        </Container>
      </main>
      <PublicFooter />
    </div>
  );
}
