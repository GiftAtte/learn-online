import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SignInPage from '@/pages/auth/sign-in-page';
import { ApiError } from '@/core/api/error';

const signIn = vi.hoisted(() => ({ mutateAsync: vi.fn() }));
vi.mock('@/core/hooks/queries/use-auth', () => ({
  useSignIn: () => ({ ...signIn, isPending: false }),
}));

const submit = async (password = 'whatever1') => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <SignInPage />
    </MemoryRouter>,
  );
  await user.type(screen.getByLabelText('Email'), 'leo@example.com');
  await user.type(screen.getByLabelText('Password', { selector: 'input' }), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
};

describe('sign-in page errors', () => {
  beforeEach(() => {
    signIn.mutateAsync.mockReset();
  });

  it('explains a wrong email or password in the form', async () => {
    signIn.mutateAsync.mockImplementation(async () => {
      throw new ApiError('Invalid email or password', 401, 'UNAUTHORIZED');
    });
    await submit();
    expect(await screen.findByText('Couldn’t sign you in')).toBeInTheDocument();
    expect(screen.getByText(/email and password don.t match/i)).toBeInTheDocument();
  });

  it('shows the lockout message, with how long to wait, after too many wrong passwords', async () => {
    signIn.mutateAsync.mockImplementation(async () => {
      throw new ApiError('Too many failed attempts. Try again in 14 minutes.', 429, 'RATE_LIMITED');
    });
    await submit();
    expect(
      await screen.findByText('Too many failed attempts. Try again in 14 minutes.'),
    ).toBeInTheDocument();
  });
});
