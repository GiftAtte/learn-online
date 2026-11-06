import { uploadMedia } from '@/core/services/media.service';

/** A stand-in for the browser's XMLHttpRequest, so a test can play the part of Cloudinary. */
class FakeRequest {
  static last: FakeRequest;
  upload: { onprogress: ((event: unknown) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  status = 200;
  responseText = '';
  url = '';
  body: FormData | null = null;
  open = vi.fn((_method: string, url: string) => {
    this.url = url;
  });
  send = vi.fn((body: FormData) => {
    this.body = body;
  });
  abort = vi.fn();
  constructor() {
    FakeRequest.last = this;
  }
}

const signature = {
  success: true,
  data: {
    uploadUrl: 'https://api.cloudinary.com/v1_1/demo/video/upload',
    apiKey: 'key-1',
    timestamp: 1700000000,
    folder: 'learnonline/videos',
    allowedFormats: 'mp4,webm,mov',
    signature: 'sig-1',
  },
};

beforeEach(() => {
  FakeRequest.last = undefined as unknown as FakeRequest;
  vi.stubGlobal('XMLHttpRequest', FakeRequest);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ status: 200, ok: true, json: async () => signature }),
  );
});
afterEach(() => vi.unstubAllGlobals());

const waitForUpload = () => vi.waitFor(() => expect(FakeRequest.last?.send).toHaveBeenCalled());

describe('uploadMedia', () => {
  it('asks our API for permission, sends the file to Cloudinary with the signed settings, and returns the address and length', async () => {
    const progress = vi.fn();
    const file = new File(['video'], 'lesson.mp4', { type: 'video/mp4' });
    const upload = uploadMedia(file, 'video', { onProgress: progress });

    await waitForUpload();
    const request = FakeRequest.last;
    expect(request.url).toBe('https://api.cloudinary.com/v1_1/demo/video/upload');
    expect(request.body?.get('api_key')).toBe('key-1');
    expect(request.body?.get('signature')).toBe('sig-1');
    expect(request.body?.get('folder')).toBe('learnonline/videos');
    expect(request.body?.get('timestamp')).toBe('1700000000');
    expect(request.body?.get('file')).toBeInstanceOf(File);

    request.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 });
    expect(progress).toHaveBeenCalledWith(50);

    request.responseText = JSON.stringify({
      secure_url: 'https://res.cloudinary.com/demo/video/upload/v1/learnonline/videos/a.mp4',
      duration: 12.4,
    });
    request.onload?.();

    await expect(upload).resolves.toEqual({
      kind: 'video',
      url: 'https://res.cloudinary.com/demo/video/upload/v1/learnonline/videos/a.mp4',
      durationSeconds: 12,
    });
  });

  it('does not report a length for images', async () => {
    const upload = uploadMedia(new File(['x'], 'cover.png'), 'image');
    await waitForUpload();
    FakeRequest.last.responseText = JSON.stringify({
      secure_url: 'https://res.cloudinary.com/a.png',
    });
    FakeRequest.last.onload?.();
    await expect(upload).resolves.toEqual({
      kind: 'image',
      url: 'https://res.cloudinary.com/a.png',
    });
  });

  it("shows Cloudinary's own explanation when it refuses the file", async () => {
    const upload = uploadMedia(new File(['x'], 'lesson.mp4'), 'video');
    await waitForUpload();
    FakeRequest.last.status = 400;
    FakeRequest.last.responseText = JSON.stringify({ error: { message: 'File size too large.' } });
    FakeRequest.last.onload?.();
    await expect(upload).rejects.toMatchObject({ message: 'File size too large.', status: 400 });
  });

  it('reports a dropped connection as a network error', async () => {
    const upload = uploadMedia(new File(['x'], 'lesson.mp4'), 'video');
    await waitForUpload();
    FakeRequest.last.onerror?.();
    await expect(upload).rejects.toMatchObject({ isNetwork: true });
  });

  it('stops the upload when cancelled', async () => {
    const controller = new AbortController();
    const upload = uploadMedia(new File(['x'], 'lesson.mp4'), 'video', {
      signal: controller.signal,
    });
    await waitForUpload();
    controller.abort();
    await expect(upload).rejects.toMatchObject({ name: 'AbortError' });
    expect(FakeRequest.last.abort).toHaveBeenCalled();
  });

  it('does not upload anything when our API refuses permission', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 503,
        ok: false,
        json: async () => ({
          success: false,
          error: { code: 'SERVICE_UNAVAILABLE', message: 'File uploads are not set up yet.' },
        }),
      }),
    );
    await expect(uploadMedia(new File(['x'], 'a.mp4'), 'video')).rejects.toMatchObject({
      message: 'File uploads are not set up yet.',
      status: 503,
    });
    expect(FakeRequest.last).toBeUndefined();
  });
});
