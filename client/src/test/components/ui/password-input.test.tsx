import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Mail } from 'lucide-react';
import { FormField, Input, PasswordInput } from '@/components/ui';

describe('PasswordInput', () => {
  it('hides the password at first and shows or hides it with the eye button', async () => {
    const user = userEvent.setup();
    render(
      <FormField label="Password" required>
        <PasswordInput />
      </FormField>,
    );

    const field = screen.getByLabelText('Password', { selector: 'input' });
    expect(field).toHaveAttribute('type', 'password');
    await user.type(field, 'Secret123');

    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);

    expect(field).toHaveAttribute('type', 'text');
    expect(field).toHaveValue('Secret123'); // what was typed is kept
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(field).toHaveAttribute('type', 'password');
  });

  it('does not submit the form when the eye is pressed', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <PasswordInput aria-label="pw" />
      </form>,
    );
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('Input with an icon', () => {
  it('keeps the field accessible and makes room for the icon', () => {
    render(
      <FormField label="Email" required>
        <Input icon={Mail} />
      </FormField>,
    );
    const field = screen.getByLabelText('Email');
    expect(field).toHaveClass('pl-11');
    expect(field.parentElement?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
