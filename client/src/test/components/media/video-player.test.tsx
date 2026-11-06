import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoPlayer } from '@/components/media/video-player';

const setup = (props: Partial<React.ComponentProps<typeof VideoPlayer>> = {}) => {
  const view = render(<VideoPlayer src="https://example.com/v.mp4" title="Intro" {...props} />);
  const video = view.container.querySelector('video') as HTMLVideoElement;
  // jsdom does not play media, so give the element the parts the player reads.
  Object.defineProperty(video, 'duration', { value: 100, configurable: true });
  video.play = vi.fn().mockResolvedValue(undefined);
  video.pause = vi.fn();
  return { video, ...view };
};

describe('VideoPlayer', () => {
  it('offers to resume when there is a saved position and jumps to it once loaded', () => {
    const { video } = setup({ startAt: 40 });
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
    fireEvent.loadedMetadata(video);
    expect(video.currentTime).toBe(40);
  });

  it('starts over when the saved position is at the very end', () => {
    const { video } = setup({ startAt: 99 });
    fireEvent.loadedMetadata(video);
    expect(video.currentTime).toBe(0);
  });

  it('plays when the big button is pressed', async () => {
    const { video } = setup();
    await userEvent.click(screen.getAllByRole('button', { name: 'Play' })[0]!);
    expect(video.play).toHaveBeenCalled();
  });

  it('reports progress when paused and every 10 seconds of playback', () => {
    const onProgress = vi.fn();
    const { video } = setup({ onProgress });
    fireEvent.loadedMetadata(video);

    video.currentTime = 4;
    fireEvent.timeUpdate(video);
    expect(onProgress).not.toHaveBeenCalled();

    video.currentTime = 12;
    fireEvent.timeUpdate(video);
    expect(onProgress).toHaveBeenLastCalledWith(12);

    video.currentTime = 15;
    fireEvent.pause(video);
    expect(onProgress).toHaveBeenLastCalledWith(15);
  });

  it('calls onEnded once the video finishes and then offers a replay', () => {
    const onEnded = vi.fn();
    const { video } = setup({ onEnded });
    fireEvent.loadedMetadata(video);
    fireEvent.ended(video);
    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Watch again' })).toBeInTheDocument();
  });

  it('seeks with the slider and the skip buttons', async () => {
    const { video } = setup();
    fireEvent.loadedMetadata(video);
    fireEvent.change(screen.getByRole('slider', { name: 'Seek' }), { target: { value: '30' } });
    expect(video.currentTime).toBe(30);

    await userEvent.click(screen.getByRole('button', { name: 'Forward 10 seconds' }));
    expect(video.currentTime).toBe(40);
    await userEvent.click(screen.getByRole('button', { name: 'Back 10 seconds' }));
    expect(video.currentTime).toBe(30);
  });

  it('cycles the playback speed', async () => {
    const { video } = setup();
    await userEvent.click(screen.getByRole('button', { name: /Playback speed 1x/ }));
    expect(video.playbackRate).toBe(1.25);
    await userEvent.click(screen.getByRole('button', { name: /Playback speed 1.25x/ }));
    expect(video.playbackRate).toBe(1.5);
  });

  it('shows a recoverable error when the video cannot load', () => {
    const { video } = setup();
    fireEvent.error(video);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
