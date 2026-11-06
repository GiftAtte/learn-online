/** The application details and upload rules an administrator can change. Public: shown before sign-in. */
export interface AppSettings {
  appName: string;
  tagline: string | null;
  logoUrl: string | null;
  supportEmail: string | null;
  /** Biggest image, in megabytes. */
  imageMaxMegabytes: number;
  /** Biggest video, in megabytes. */
  videoMaxMegabytes: number;
  /** Allowed image extensions, lower case without a dot. */
  imageFormats: string[];
  videoFormats: string[];
  /** Whether new people can create their own account. */
  allowSignups: boolean;
}

/** The file types an administrator can choose from (the same lists as the API accepts). */
export const IMAGE_FORMAT_CHOICES = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'] as const;
export const VIDEO_FORMAT_CHOICES = ['mp4', 'webm', 'mov', 'm4v', 'ogv'] as const;

/** The largest limits the form accepts (the API enforces the same). */
export const MAX_IMAGE_MEGABYTES = 50;
export const MAX_VIDEO_MEGABYTES = 1000;
