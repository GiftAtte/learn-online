import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YouTubePlayer } from '@/components/media/youtube-player';
import { YT_STATE } from '@/core/lib/youtube-api';

/** A stand-in for YouTube's player that lets the test play the part of YouTube. */
const fake = vi.hoisted(() => ({
  options: undefined as undefined | Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  time: 0,
  length: 300,
  destroyed: 0,
}));

vi.mock('@/core/lib/youtube-api', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/core/lib/youtube-api')>();
  return {
    ...original,
    loadYouTubeApi: vi.fn(async () => ({
      Player: class {
        constructor(_el: HTMLElement, options: Record<string, unknown>) {
          fake.options = options;
        }
        getCurrentTime = () => fake.time;
        getDuration = () => fake.length;
        destroy = () => {
          fake.destroyed += 1;
        };
      },
    })),
  };
});

const state = (data: number) => act(() => fake.options!.events.onStateChange({ data }));

const setup = (props: Partial<React.ComponentProps<typeof YouTubePlayer>> = {}) =>
  render(<YouTubePlayer videoId="dQw4w9WgXcQ" title="Intro" {...props} />);

describe('YouTubePlayer', () => {
  beforeEach(() => {
    fake.options = undefined;
    fake.time = 0;
    fake.destroyed = 0;
    vi.useRealTimers();
  });

  it('opens the right video from the saved position, using the privacy-friendly host', async () => {
    setup({ startAt: 42.7 });
    await waitFor(() => expect(fake.options).toBeDefined());
    expect(fake.options).toMatchObject({
      videoId: 'dQw4w9WgXcQ',
      host: 'https://www.youtube-nocookie.com',
      playerVars: expect.objectContaining({ start: 42 }),
    });
    expect(screen.getByRole('group', { name: 'Intro video player' })).toBeInTheDocument();
  });

  it('shows a loading state until YouTube is ready', async () => {
    setup();
    expect(screen.getByRole('status', { name: 'Loading video' })).toBeInTheDocument();
    await waitFor(() => expect(fake.options).toBeDefined());
    act(() => fake.options!.events.onReady());
    expect(screen.queryByRole('status', { name: 'Loading video' })).not.toBeInTheDocument();
  });

  it('reports the position when paused and about every 10 seconds while playing', async () => {
    const onProgress = vi.fn();
    setup({ onProgress });
    await waitFor(() => expect(fake.options).toBeDefined());
    vi.useFakeTimers();

    fake.time = 12.4;
    state(YT_STATE.PLAYING);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(onProgress).toHaveBeenLastCalledWith(12);

    fake.time = 25;
    state(YT_STATE.PAUSED);
    expect(onProgress).toHaveBeenLastCalledWith(25);

    // Paused means no more timed reports.
    onProgress.mockClear();
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(onProgress).not.toHaveBeenCalled();
  });

  it('says the video ended, and reports the full length, so the lesson can be completed', async () => {
    const onProgress = vi.fn();
    const onEnded = vi.fn();
    setup({ onProgress, onEnded });
    await waitFor(() => expect(fake.options).toBeDefined());

    state(YT_STATE.ENDED);
    expect(onProgress).toHaveBeenCalledWith(300);
    expect(onEnded).toHaveBeenCalledTimes(1);
  });

  it('saves where you stopped and cleans up when you leave', async () => {
    const onProgress = vi.fn();
    const { unmount } = setup({ onProgress });
    await waitFor(() => expect(fake.options).toBeDefined());
    fake.time = 77;
    unmount();
    expect(onProgress).toHaveBeenCalledWith(77);
    expect(fake.destroyed).toBe(1);
  });

  it('explains when YouTube cannot play the video, and lets you try again', async () => {
    const user = userEvent.setup();
    setup();
    await waitFor(() => expect(fake.options).toBeDefined());
    act(() => fake.options!.events.onError());
    expect(screen.getByText(/couldn.t be played/i)).toBeInTheDocument();

    fake.options = undefined;
    await user.click(screen.getByRole('button', { name: /try again|retry/i }));
    await waitFor(() => expect(fake.options).toBeDefined());
  });
});
