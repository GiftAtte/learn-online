import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/core/lib/cn';
import { MESSAGES } from '@/core/lib/messages';
import { loadYouTubeApi, YT_HOST, YT_STATE, type YTPlayer } from '@/core/lib/youtube-api';

interface YouTubePlayerProps {
  /** The 11-character YouTube video ID. */
  videoId: string;
  /** Accessible name of the video, normally the lesson title. */
  title: string;
  /** Resume point in seconds (from the learner's saved progress). */
  startAt?: number;
  /** Called with the playback position roughly every 10 seconds, on pause, and when leaving the page. */
  onProgress?: (positionSeconds: number) => void;
  /** Called once when the video plays to the end. */
  onEnded?: () => void;
  className?: string;
}

const SAVE_EVERY_MS = 10_000;

/**
 * Plays a lesson that lives on YouTube, using YouTube's own embedded player and controls (the rules of
 * the platform: the video must be shown by YouTube's player). It does the same job as the lesson
 * <VideoPlayer>: starts where the learner stopped, reports their position about every 10 seconds and
 * when they pause or leave, and reports when the video ends so the lesson can be marked complete.
 */
export function YouTubePlayer({
  videoId,
  title,
  startAt = 0,
  onProgress,
  onEnded,
  className,
}: YouTubePlayerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [attempt, setAttempt] = useState(0);

  // Keep the latest callbacks in refs so the player's events never use stale ones.
  const progressRef = useRef(onProgress);
  const endedRef = useRef(onEnded);
  useEffect(() => {
    progressRef.current = onProgress;
    endedRef.current = onEnded;
  });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const holder = mountRef.current;
    if (!holder) return;

    // YouTube replaces the element it is given with the player, so give it a fresh one each time.
    const target = document.createElement('div');
    holder.replaceChildren(target);

    const position = () => Math.floor(playerRef.current?.getCurrentTime?.() ?? 0);
    const report = () => {
      const seconds = position();
      if (seconds > 0) progressRef.current?.(seconds);
    };
    const stopTimer = () => clearInterval(timer);

    loadYouTubeApi()
      .then((yt) => {
        if (cancelled) return;
        playerRef.current = new yt.Player(target, {
          videoId,
          host: YT_HOST,
          width: '100%',
          height: '100%',
          playerVars: { start: Math.floor(startAt), rel: 0, playsinline: 1, modestbranding: 1 },
          events: {
            onReady: () => !cancelled && setStatus('ready'),
            onError: () => !cancelled && setStatus('failed'),
            onStateChange: ({ data }) => {
              stopTimer();
              if (data === YT_STATE.PLAYING) {
                timer = setInterval(report, SAVE_EVERY_MS);
              } else if (data === YT_STATE.PAUSED) {
                report();
              } else if (data === YT_STATE.ENDED) {
                const length = Math.floor(playerRef.current?.getDuration?.() ?? 0);
                if (length > 0) progressRef.current?.(length);
                endedRef.current?.();
              }
            },
          },
        });
      })
      .catch(() => !cancelled && setStatus('failed'));

    // Save where the learner stopped when they close the tab or move to another page.
    window.addEventListener('pagehide', report);
    return () => {
      cancelled = true;
      window.removeEventListener('pagehide', report);
      stopTimer();
      report();
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
    // startAt is only the starting point; later changes must not restart the video.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, attempt]);

  return (
    <div
      role="group"
      aria-label={`${title} video player`}
      className={cn(
        'relative aspect-video overflow-hidden rounded-stage bg-spruce-950 shadow-lift',
        className,
      )}
    >
      {/* YouTube puts its iframe in here */}
      <div ref={mountRef} className="size-full [&_iframe]:size-full" />

      {status === 'loading' && (
        <div
          role="status"
          aria-label="Loading video"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <Spinner className="size-9 text-white" />
        </div>
      )}

      {status === 'failed' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-spruce-950">
          <p className="max-w-xs px-6 text-center text-white">{MESSAGES.lesson.videoFailed}</p>
          <Button
            variant="secondary"
            onClick={() => {
              setStatus('loading');
              setAttempt((n) => n + 1);
            }}
          >
            {MESSAGES.generic.retry}
          </Button>
        </div>
      )}
    </div>
  );
}
