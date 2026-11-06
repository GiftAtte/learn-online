import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ConfirmProvider, useConfirm } from '@/components/feedback/confirm-dialog';

function Harness() {
  const confirm = useConfirm();
  const [result, setResult] = useState('none');
  return (
    <>
      <button
        onClick={async () =>
          setResult(
            (await confirm({ title: 'Delete this course?', confirmLabel: 'Delete course' }))
              ? 'confirmed'
              : 'cancelled',
          )
        }
      >
        Open
      </button>
      <p data-testid="result">{result}</p>
    </>
  );
}

const setup = () =>
  render(
    <ConfirmProvider>
      <Harness />
    </ConfirmProvider>,
  );

describe('useConfirm', () => {
  it('resolves true when the person confirms', async () => {
    setup();
    await userEvent.click(screen.getByText('Open'));
    expect(screen.getByRole('dialog', { name: 'Delete this course?' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete course' }));
    expect(screen.getByTestId('result')).toHaveTextContent('confirmed');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('resolves false on cancel and on Escape', async () => {
    setup();
    await userEvent.click(screen.getByText('Open'));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByTestId('result')).toHaveTextContent('cancelled');

    await userEvent.click(screen.getByText('Open'));
    await userEvent.keyboard('{Escape}');
    expect(screen.getByTestId('result')).toHaveTextContent('cancelled');
  });
});
