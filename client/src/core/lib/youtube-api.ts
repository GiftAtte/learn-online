/**
 * A thin loader for YouTube's IFrame Player API, plus the small part of its types we use.
 * The script is fetched once, the first time a YouTube lesson is shown or added.
 */

/** YouTube's player states (the ones we care about). */
export const YT_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2 } as const;

export interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}

interface YTNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      host?: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: () => void;
        onStateChange?: (event: { data: number }) => void;
        onError?: () => void;
      };
    },
  ) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let loading: Promise<YTNamespace> | undefined;

/** Loads the API once and resolves with its `YT` object. Rejects when YouTube can't be reached. */
export const loadYouTubeApi = (): Promise<YTNamespace> => {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  loading ??= new Promise<YTNamespace>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      loading = undefined; // allow a retry later
      reject(new Error('Could not load YouTube'));
    };
    document.head.appendChild(script);
  });
  return loading;
};

/** The privacy-friendly address YouTube serves the embedded player from. */
export const YT_HOST = 'https://www.youtube-nocookie.com';

/**
 * Asks YouTube how long a video is, by loading it in a hidden player until it knows.
 * Returns whole seconds, or null if it could not be found out in time (private video, no network).
 */
export const fetchYouTubeDuration = async (videoId: string, timeoutMs = 10_000) => {
  let yt: YTNamespace;
  try {
    yt = await loadYouTubeApi();
  } catch {
    return null;
  }

  const holder = document.createElement('div');
  holder.style.cssText = 'position:fixed;left:-9999px;top:0;width:320px;height:180px;';
  const mount = document.createElement('div');
  holder.appendChild(mount);
  document.body.appendChild(holder);

  return new Promise<number | null>((resolve) => {
    let player: YTPlayer | undefined;
    let poll: ReturnType<typeof setInterval> | undefined;
    const finish = (value: number | null) => {
      clearInterval(poll);
      clearTimeout(timer);
      player?.destroy();
      holder.remove();
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);

    player = new yt.Player(mount, {
      videoId,
      host: YT_HOST,
      width: 320,
      height: 180,
      events: {
        onReady: () => {
          // The length is not known the instant the player is ready; check until it is.
          poll = setInterval(() => {
            const seconds = Math.round(player?.getDuration() ?? 0);
            if (seconds > 0) finish(seconds);
          }, 250);
        },
        onError: () => finish(null),
      },
    });
  });
};
