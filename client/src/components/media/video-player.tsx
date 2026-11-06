import { Gauge, Maximize, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/core/lib/cn';
import { formatClock } from '@/core/lib/format';
import { MESSAGES } from '@/core/lib/messages';

interface VideoPlayerProps {
  src: string;
  /** Accessible name of the video, normally the lesson title. */
  title: string;
  poster?: string;
  /** Resume point in seconds (from the learner's saved progress). */
  startAt?: number;
  /** Called with the playback position roughly every 10 seconds, on pause, and when leaving the page. */
  onProgress?: (positionSeconds: number) => void;
  /** Called once when the video plays to the end. */
  onEnded?: () => void;
  className?: string;
}

const SAVE_EVERY_SECONDS = 10;
const SKIP_SECONDS = 10;
const IDLE_HIDE_MS = 2600;
const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

/**
 * Lesson video player: native <video> (so streaming, captions and codecs are the browser's job) with
 * our own accessible controls. Supports play/pause, seek, ±10s skip, mute, fullscreen, replay,
 * resume from a saved position and progress reporting for completion tracking.
 */
export function VideoPlayer({
  src,
  title,
  poster,
  startAt = 0,
  onProgress,
  onEnded,
  className,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedAt = useRef(startAt);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);

  // Keep the latest callbacks in refs so effects and event handlers never use stale ones.
  const progressRef = useRef(onProgress);
  const endedRef = useRef(onEnded);
  useEffect(() => {
    progressRef.current = onProgress;
    endedRef.current = onEnded;
  });

  const report = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.currentTime <= 0) return;
    lastSavedAt.current = video.currentTime;
    progressRef.current?.(Math.floor(video.currentTime));
  }, []);

  // Save where the learner stopped when they navigate away or close the tab.
  useEffect(() => {
    const onHide = () => report();
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      report();
    };
  }, [report]);

  const wake = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setControlsVisible(false), IDLE_HIDE_MS);
  }, []);
  useEffect(() => () => clearTimeout(idleTimer.current), []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (ended) video.currentTime = 0; // replay from the start
    if (video.paused || ended) void video.play();
    else video.pause();
  };

  const seekTo = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(0, seconds), duration || seconds);
    setCurrent(video.currentTime);
  };

  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length] ?? 1;
    setSpeed(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void containerRef.current?.requestFullscreen?.();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Let native controls (seek slider, buttons) handle their own keys.
    if ((event.target as HTMLElement).closest('input, button')) return;
    const handlers: Record<string, () => void> = {
      ' ': togglePlay,
      k: togglePlay,
      ArrowLeft: () => seekTo(current - 5),
      ArrowRight: () => seekTo(current + 5),
      m: () => setMuted((m) => !m),
      f: toggleFullscreen,
    };
    const handler = handlers[event.key];
    if (handler) {
      event.preventDefault();
      handler();
      wake();
    }
  };

  const percent = duration > 0 ? (current / duration) * 100 : 0;
  const showControls = controlsVisible || !playing || ended;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="group"
      aria-label={`${title} video player`}
      onKeyDown={onKeyDown}
      onPointerMove={wake}
      onPointerDown={wake}
      onFocus={wake}
      className={cn(
        'group/player relative aspect-video overflow-hidden rounded-stage bg-spruce-950 shadow-lift select-none',
        'fullscreen:rounded-none',
        className,
      )}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={muted}
        playsInline
        preload="metadata"
        className="size-full object-contain"
        onClick={togglePlay}
        onLoadedMetadata={(e) => {
          const video = e.currentTarget;
          setDuration(video.duration);
          // Resume, unless the saved spot is right at the end (then start over).
          if (startAt > 0 && startAt < video.duration - 3) video.currentTime = startAt;
        }}
        onTimeUpdate={(e) => {
          const time = e.currentTarget.currentTime;
          setCurrent(time);
          if (Math.abs(time - lastSavedAt.current) >= SAVE_EVERY_SECONDS) report();
        }}
        onPlay={() => {
          setPlaying(true);
          setStarted(true);
          setEnded(false);
          setFailed(false);
          wake();
        }}
        onPause={() => {
          setPlaying(false);
          report();
        }}
        onEnded={() => {
          setPlaying(false);
          setEnded(true);
          progressRef.current?.(Math.floor(videoRef.current?.duration ?? 0));
          endedRef.current?.();
        }}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onCanPlay={() => setBuffering(false)}
        onError={() => setFailed(true)}
      />

      {buffering && !failed && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          role="status"
          aria-label="Buffering"
        >
          <Spinner className="size-9 text-white" />
        </div>
      )}

      {/* Centre call to action: start, replay or recover from an error */}
      {(!started || ended || failed) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-spruce-950/45">
          {failed ? (
            <>
              <p className="max-w-xs px-6 text-center text-white">{MESSAGES.lesson.videoFailed}</p>
              <Button
                variant="secondary"
                onClick={() => {
                  setFailed(false);
                  videoRef.current?.load();
                }}
              >
                {MESSAGES.generic.retry}
              </Button>
            </>
          ) : (
            <Button
              variant="accent"
              size="lg"
              onClick={togglePlay}
              className="h-14 rounded-full px-7"
            >
              {ended ? (
                <RotateCcw className="size-5" aria-hidden />
              ) : (
                <Play className="size-5 fill-current" aria-hidden />
              )}
              {ended ? 'Watch again' : startAt > 0 ? 'Resume' : 'Play'}
            </Button>
          )}
        </div>
      )}

      {/* Control bar */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-gradient-to-t from-spruce-950/90 to-transparent px-3 pt-10 pb-2 text-white transition-opacity duration-200 sm:px-4',
          showControls ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <input
          type="range"
          className="seek"
          min={0}
          max={duration || 0}
          step={1}
          value={Math.min(current, duration || 0)}
          style={{ '--seek': percent } as React.CSSProperties}
          onChange={(e) => seekTo(Number(e.target.value))}
          aria-label="Seek"
          aria-valuetext={`${formatClock(current)} of ${formatClock(duration)}`}
        />
        <div className="flex items-center gap-1">
          <ControlButton label={playing ? 'Pause' : ended ? 'Replay' : 'Play'} onClick={togglePlay}>
            {playing ? (
              <Pause className="size-5 fill-current" />
            ) : (
              <Play className="size-5 fill-current" />
            )}
          </ControlButton>
          <ControlButton
            label={`Back ${SKIP_SECONDS} seconds`}
            onClick={() => seekTo(current - SKIP_SECONDS)}
          >
            <RotateCcw className="size-[1.15rem]" />
          </ControlButton>
          <ControlButton
            label={`Forward ${SKIP_SECONDS} seconds`}
            onClick={() => seekTo(current + SKIP_SECONDS)}
          >
            <RotateCw className="size-[1.15rem]" />
          </ControlButton>
          <span className="ml-1.5 text-sm text-white/90 tnum">
            {formatClock(current)} <span className="text-white/60">/ {formatClock(duration)}</span>
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              aria-label={`Playback speed ${speed}x, change`}
              onClick={cycleSpeed}
              className="inline-flex h-10 min-w-12 cursor-pointer items-center justify-center gap-1 rounded-full px-2 text-sm font-medium text-white tnum transition-colors hover:bg-white/15 focus-visible:outline-pencil-400"
            >
              <Gauge className="size-4" aria-hidden />
              {speed}x
            </button>
            <ControlButton label={muted ? 'Unmute' : 'Mute'} onClick={() => setMuted((m) => !m)}>
              {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </ControlButton>
            <ControlButton label="Fullscreen" onClick={toggleFullscreen}>
              <Maximize className="size-5" />
            </ControlButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus-visible:outline-pencil-400"
    >
      {children}
    </button>
  );
}
