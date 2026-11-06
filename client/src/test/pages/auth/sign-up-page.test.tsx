import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignUpPage from '@/pages/auth/sign-up-page';
import * as settings from '@/core/hooks/queries/use-settings';

vi.mock('@/core/hooks/queries/use-auth', () => ({
  useSignUp: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <SignUpPage />
    </MemoryRouter>,
  );

describe('sign-up page', () => {
  it('shows the form while sign-ups are open', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
  });

  it('says sign-ups are closed, and who to write to, instead of showing the form', () => {
    vi.spyOn(settings, 'useAppSettings').mockReturnValue({
      ...settings.DEFAULT_SETTINGS,
      allowSignups: false,
      supportEmail: 'help@x.test',
    });
    renderPage();
    expect(screen.queryByRole('button', { name: 'Create account' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('New sign-ups are closed');
    expect(screen.getByRole('link', { name: 'help@x.test' })).toHaveAttribute('href', 'mailto:help@x.test');
  });
});
