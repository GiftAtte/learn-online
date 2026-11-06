import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MediaField } from '@/components/media/media-field';
import type { MediaKind, UploadedMedia } from '@/core/types/media.types';

/** A stand-in for the browser's XMLHttpRequest, so a test can play the part of Cloudinary. */
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

const renderField = (
  props: Partial<{
    kind: MediaKind;
    value: string;
    onChange: (url: string) => void;
    onUploaded: (media: UploadedMedia) => void;
  }> = {},
) => {
  const onChange = props.onChange ?? vi.fn();
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
    >
      <MediaField
        kind={props.kind ?? 'video'}
        value={props.value ?? ''}
        onChange={onChange}
        onUploaded={props.onUploaded}
      />
    </QueryClientProvider>,
  );
  return onChange;
};

const drop = (file: File) =>
  fireEvent.drop(screen.getByRole('button', { name: /drop an? /i }), {
    dataTransfer: { files: [file] },
  });

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

describe('MediaField', () => {
  it('starts as a drop area that says what it accepts, with a link as the alternative', () => {
    renderField({ kind: 'video' });

    expect(screen.getByRole('button', { name: /drop a video here/i })).toBeInTheDocument();
    expect(screen.getByText(/MP4, WEBM, MOV, up to 100 MB/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /paste a link/i })).toBeInTheDocument();
  });

  it('explains a wrong file at once and uploads nothing', () => {
    const onChange = renderField({ kind: 'image' });
    fireEvent.drop(screen.getByRole('button', { name: /drop an? /i }), {
      dataTransfer: { files: [new File(['x'], 'notes.pdf')] },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('JPG');
    expect(fetch).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows the file and its progress while uploading, then hands over the new address', async () => {
    const onUploaded = vi.fn();
    const onChange = renderField({ kind: 'video', onUploaded });
    drop(new File(['x'], 'lesson.mp4'));

    await waitFor(() => expect(FakeRequest.last?.send).toHaveBeenCalled());
    FakeRequest.last.upload.onprogress?.({ lengthComputable: true, loaded: 40, total: 100 });
    expect(await screen.findByText('lesson.mp4')).toBeInTheDocument();
    expect(await screen.findByText('40%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    FakeRequest.last.responseText = JSON.stringify({
      secure_url: 'https://res.cloudinary.com/demo/video/upload/v1/a.mp4',
      duration: 30,
    });
    FakeRequest.last.onload?.();

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(
        'https://res.cloudinary.com/demo/video/upload/v1/a.mp4',
      ),
    );
    expect(onUploaded).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'video', durationSeconds: 30 }),
    );
  });

  it('shows what is already there, and lets the person remove it', () => {
    const onChange = renderField({
      kind: 'image',
      value: 'https://res.cloudinary.com/demo/image/upload/v1/learnonline/images/cover%20one.png',
    });

    expect(screen.getByText('cover one.png')).toBeInTheDocument();
    expect(screen.getByText('Uploaded image')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /drop an? /i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('calls a pasted address a link, not an upload', () => {
    renderField({ kind: 'image', value: 'https://example.com/pic.jpg' });
    expect(screen.getByText('Linked image')).toBeInTheDocument();
  });

  it('lets the person paste a link instead of uploading', () => {
    const onChange = renderField({ kind: 'video' });

    fireEvent.click(screen.getByRole('button', { name: /paste a link/i }));
    fireEvent.change(screen.getByPlaceholderText(/lesson\.mp4/), {
      target: { value: 'https://example.com/v.mp4' },
    });
    expect(onChange).toHaveBeenCalledWith('https://example.com/v.mp4');

    fireEvent.click(screen.getByRole('button', { name: /upload a file instead/i }));
    expect(screen.getByRole('button', { name: /drop a video here/i })).toBeInTheDocument();
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
    renderField({ kind: 'video' });
    drop(new File(['x'], 'lesson.mp4'));

    expect(await screen.findByRole('alert')).toHaveTextContent('not set up yet');
  });
});
