import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { ProgressBar } from '@/components/ui/progress';

describe('Button', () => {
  it('blocks clicks and announces busy while loading', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save changes
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save changes' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders as the child element with asChild (e.g. a link)', () => {
    render(
      <Button asChild>
        <a href="/courses">Browse courses</a>
      </Button>,
    );
    expect(screen.getByRole('link', { name: 'Browse courses' })).toHaveAttribute(
      'href',
      '/courses',
    );
  });
});

describe('FormField', () => {
  it('connects the label, hint and control', () => {
    render(
      <FormField label="Course title" hint="Shown on the card" required>
        <Input />
      </FormField>,
    );
    const input = screen.getByLabelText('Course title');
    expect(input).toHaveAccessibleDescription('Shown on the card');
    expect(input).toBeRequired();
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('marks the control invalid and announces the error', () => {
    render(
      <FormField label="Course title" error="Enter at least 3 characters" required>
        <Input />
      </FormField>,
    );
    const input = screen.getByLabelText('Course title');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter at least 3 characters');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter at least 3 characters');
  });

  it('labels optional fields as optional', () => {
    render(
      <FormField label="Thumbnail">
        <Input />
      </FormField>,
    );
    expect(screen.getByText('(optional)')).toBeInTheDocument();
  });
});

describe('ProgressBar', () => {
  it('exposes a clamped value to assistive tech', () => {
    render(<ProgressBar value={140} label="Course progress" />);
    expect(screen.getByRole('progressbar', { name: 'Course progress' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
  });
});
