import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MediaUploadButton } from '@/components/media/media-upload-button';

class FakeRequest {
  static last: FakeRequest;
  upload = { onprogress: null as ((event: unknown) => void) | null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  status = 200;
  responseText = '';
  open = vi.fn();
  send = vi.fn();
  abort = vi.fn();
  constructor() {
    FakeRequest.last = this;
  }
}

const renderButton = (onUploaded = vi.fn()) => {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
    >
      <MediaUploadButton kind="video" label="Upload a video" onUploaded={onUploaded} />
    </QueryClientProvider>,
  );
  return onUploaded;
};

const choose = (file: File) =>
  fireEvent.change(screen.getByLabelText('Upload a video'), { target: { files: [file] } });

beforeEach(() => {
  vi.stubGlobal('XMLHttpRequest', FakeRequest);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        success: true,
        data: {
          uploadUrl: 'https://api.cloudinary.com/v1_1/demo/video/upload',
          apiKey: 'k',
          timestamp: 1,
          folder: 'f',
          allowedFormats: 'mp4',
          signature: 's',
        },
      }),
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe('MediaUploadButton', () => {
  it('explains a wrong file straight away and uploads nothing', () => {
    const onUploaded = renderButton();
    choose(new File(['x'], 'notes.pdf'));

    expect(screen.getByRole('alert')).toHaveTextContent('MP4, WEBM, MOV');
    expect(fetch).not.toHaveBeenCalled();
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it('shows progress while uploading, then hands the new address to the form', async () => {
    const onUploaded = renderButton();
    choose(new File(['x'], 'lesson.mp4'));

    await waitFor(() => expect(FakeRequest.last?.send).toHaveBeenCalled());
    FakeRequest.last.upload.onprogress?.({ lengthComputable: true, loaded: 40, total: 100 });
    expect(await screen.findByText('40%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    FakeRequest.last.responseText = JSON.stringify({
      secure_url: 'https://res.cloudinary.com/demo/video/upload/v1/a.mp4',
      duration: 30,
    });
    FakeRequest.last.onload?.();

    await waitFor(() =>
      expect(onUploaded).toHaveBeenCalledWith({
        kind: 'video',
        url: 'https://res.cloudinary.com/demo/video/upload/v1/a.mp4',
        durationSeconds: 30,
      }),
    );
    expect(await screen.findByText(/Uploaded/)).toBeInTheDocument();
  });

  it('says so when the server has no upload set up', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 503,
        ok: false,
        json: async () => ({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'File uploads are not set up yet. Paste a link instead.',
          },
        }),
      }),
    );
    renderButton();
    choose(new File(['x'], 'lesson.mp4'));

    expect(await screen.findByRole('alert')).toHaveTextContent('not set up yet');
  });
});
