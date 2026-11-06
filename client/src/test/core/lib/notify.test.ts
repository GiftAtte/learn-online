import { toast } from 'sonner';
import { ApiError } from '@/core/api/error';
import { MESSAGES } from '@/core/lib/messages';
import { notify } from '@/core/lib/notify';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    promise: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

beforeEach(() => vi.clearAllMocks());

describe('notify', () => {
  it('shows the API message for API errors', () => {
    notify.apiError(new ApiError('Category is used by 2 course(s)', 409, 'CONFLICT'));
    expect(toast.error).toHaveBeenCalledWith(
      'Category is used by 2 course(s)',
      expect.objectContaining({ duration: 7000 }),
    );
  });

  it('falls back to the generic message for unknown errors', () => {
    notify.apiError(new Error('boom: stack trace details'));
    expect(toast.error).toHaveBeenCalledWith(MESSAGES.generic.error, expect.anything());
  });

  it('gives network errors a shared id so repeated failures do not stack', () => {
    notify.apiError(new ApiError(MESSAGES.generic.network, 0, 'NETWORK'));
    expect(toast.error).toHaveBeenCalledWith(
      MESSAGES.generic.network,
      expect.objectContaining({ id: 'network-error' }),
    );
  });

  it('routes success and info through the same service', () => {
    notify.success(MESSAGES.course.created);
    notify.info(MESSAGES.auth.sessionExpired);
    expect(toast.success).toHaveBeenCalledWith(MESSAGES.course.created, undefined);
    expect(toast.info).toHaveBeenCalledWith(MESSAGES.auth.sessionExpired, undefined);
  });
});
