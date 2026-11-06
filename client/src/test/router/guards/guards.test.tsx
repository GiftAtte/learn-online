import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { GuestOnly } from '@/router/guards/guest-only';
import { PATHS } from '@/router/paths';
import { RequireAdmin } from '@/router/guards/require-admin';
import { RequireAuth } from '@/router/guards/require-auth';

const session = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
vi.mock('@/core/hooks/queries/use-auth', () => ({ useSession: () => session.current }));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/sign-in" element={<p>sign-in page</p>} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<p>dashboard</p>} />
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<p>admin area</p>} />
          </Route>
        </Route>
        <Route path={PATHS.learner.catalog} element={<p>home</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe('route guards', () => {
  it('sends guests from a protected page to sign in', () => {
    session.current = { status: 'guest', isAdmin: false };
    renderAt('/dashboard');
    expect(screen.queryByText('dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('home')).not.toBeInTheDocument();
  });

  it('shows a loader while the session is being checked, never the protected page', () => {
    session.current = { status: 'loading', isAdmin: false };
    renderAt('/dashboard');
    expect(screen.queryByText('dashboard')).not.toBeInTheDocument();
  });

  it('lets signed-in learners in, but keeps them out of the admin area', () => {
    session.current = { status: 'authenticated', isAdmin: false };
    const { unmount } = renderAt('/dashboard');
    expect(screen.getByText('dashboard')).toBeInTheDocument();
    unmount();

    renderAt('/admin');
    expect(screen.queryByText('admin area')).not.toBeInTheDocument();
  });

  it('lets administrators into the admin area', () => {
    session.current = { status: 'authenticated', isAdmin: true };
    renderAt('/admin');
    expect(screen.getByText('admin area')).toBeInTheDocument();
  });

  it('sends signed-in people away from the sign-in page', () => {
    session.current = { status: 'authenticated', isAdmin: false };
    renderAt('/sign-in');
    expect(screen.getByText('home')).toBeInTheDocument();
  });
});
