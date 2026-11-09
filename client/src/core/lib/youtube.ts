/** Helpers for lessons whose video is hosted on YouTube. */

const ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(['youtube.com', 'youtube-nocookie.com']);

/**
 * Finds the 11-character video ID in whatever an administrator pastes: the bare ID, or any of the
 * usual links (watch?v=, youtu.be/, /embed/, /shorts/, /live/), with or without https://.
 * Returns null when it is not a YouTube video.
 */
export const parseYouTubeId = (input: string): string | null => {
  const text = input.trim();
  if (!text) return null;
  if (ID_PATTERN.test(text)) return text;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^(www|m|music)\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1] ?? null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else id = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?]+)/)?.[1] ?? null;
  }
  return id && ID_PATTERN.test(id) ? id : null;
};

/** The one address we store for a YouTube lesson, so every lesson's video is a plain https link. */
export const youTubeUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/** YouTube's own picture for a video (used as the lesson thumbnail until someone adds their own). */
export const youTubeThumbnail = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/** The video ID when a stored lesson address is a YouTube video, otherwise null. */
export const youTubeIdOf = (videoUrl: string): string | null =>
  /^https?:\/\//i.test(videoUrl) ? parseYouTubeId(videoUrl) : null;

/** The picture to show for a lesson: its own thumbnail, else YouTube's for a YouTube video, else none. */
export const lessonPicture = (thumbnailUrl?: string | null, videoUrl?: string | null) => {
  if (thumbnailUrl) return thumbnailUrl;
  const id = videoUrl ? youTubeIdOf(videoUrl) : null;
  return id ? youTubeThumbnail(id) : null;
};
