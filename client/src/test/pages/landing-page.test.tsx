import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from '@/pages/landing-page';

const session = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
vi.mock('@/core/hooks/queries/use-auth', () => ({ useSession: () => session.current }));

const renderPage = () =>
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );

describe('landing page', () => {
  it('explains the platform and invites a guest to sign up or browse', () => {
    session.current = { status: 'guest', user: null };
    renderPage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Video courses you can actually finish',
    );
    expect(screen.getByRole('heading', { name: /four steps/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Create a free account' })[0]).toHaveAttribute(
      'href',
      '/sign-up',
    );
    expect(screen.getByRole('link', { name: 'Browse courses' })).toHaveAttribute(
      'href',
      '/catalog',
    );
    // The four steps are numbered in order.
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(4);
  });

  it('sends a signed-in person into the app instead of asking them to sign up', () => {
    session.current = { status: 'authenticated', user: { id: '1', name: 'Leo' } };
    renderPage();

    expect(screen.getAllByRole('link', { name: 'Go to the catalog' })[0]).toHaveAttribute(
      'href',
      '/learner/catalog',
    );
    expect(screen.queryByRole('link', { name: /create a free account/i })).not.toBeInTheDocument();
  });
});
