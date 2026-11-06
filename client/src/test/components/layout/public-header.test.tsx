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

  it('keeps every link once someone is signed in, and sends Courses to the signed-in catalog', () => {
    session.current = { user: { id: '1', name: 'Leo' } };
    renderHeader('/');

    expect(screen.getByRole('link', { name: 'How it works' })).toHaveAttribute(
      'href',
      '/#how-it-works',
    );
    expect(screen.getByRole('link', { name: 'What you get' })).toHaveAttribute(
      'href',
      '/#features',
    );
    expect(screen.getByRole('link', { name: 'Courses' })).toHaveAttribute(
      'href',
      '/learner/catalog',
    );
    expect(screen.getByRole('link', { name: 'Open the app' })).toBeInTheDocument();
  });
});
