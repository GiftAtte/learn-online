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

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Learn new skills');
    expect(screen.getByRole('heading', { name: 'How it works' })).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: /sign up|create a free account/i })[0],
    ).toHaveAttribute('href', '/sign-up');
    expect(screen.getByRole('link', { name: 'Browse the catalog' })).toHaveAttribute(
      'href',
      '/learner/catalog',
    );
  });

  it('sends a signed-in person into the app instead of asking them to sign up', () => {
    session.current = { status: 'authenticated', user: { id: '1', name: 'Leo' } };
    renderPage();

    expect(screen.getByRole('link', { name: 'Go to the catalog' })).toHaveAttribute(
      'href',
      '/learner/catalog',
    );
    expect(screen.queryByRole('link', { name: /create a free account/i })).not.toBeInTheDocument();
  });
});
