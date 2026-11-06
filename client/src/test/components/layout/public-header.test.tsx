import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PublicHeader } from '@/components/layout/public-header';

const session = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
vi.mock('@/core/hooks/queries/use-auth', () => ({ useSession: () => session.current }));

const renderHeader = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <PublicHeader />
    </MemoryRouter>,
  );

describe('public header', () => {
  it('shows the same menu on the landing page and on the catalog', () => {
    session.current = { user: null };
    for (const path of ['/', '/catalog']) {
      const { unmount } = renderHeader(path);
      expect(screen.getByRole('link', { name: 'How it works' })).toHaveAttribute(
        'href',
        '/#how-it-works',
      );
      expect(screen.getByRole('link', { name: 'What you get' })).toHaveAttribute(
        'href',
        '/#features',
      );
      expect(screen.getByRole('link', { name: 'Courses' })).toHaveAttribute('href', '/catalog');
      expect(screen.getByRole('link', { name: 'Sign up free' })).toHaveAttribute(
        'href',
        '/sign-up',
      );
      unmount();
    }
  });

  it('hides the section links once someone is signed in, and keeps Courses', () => {
    session.current = { user: { id: '1', name: 'Leo' } };
    renderHeader('/');

    expect(screen.queryByRole('link', { name: 'How it works' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'What you get' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Courses' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the app' })).toBeInTheDocument();
  });
});
