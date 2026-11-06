import { DEFAULT_SETTINGS } from '@/core/hooks/queries/use-settings';
import { uploadRulesFor, validateMediaFile, videoPosterUrl } from '@/core/lib/media';

const video = uploadRulesFor(DEFAULT_SETTINGS, 'video');
const image = uploadRulesFor(DEFAULT_SETTINGS, 'image');

const file = (name: string, megabytes = 1) =>
  new File([new Uint8Array(Math.floor(megabytes * 1024 * 1024))], name);

describe('validateMediaFile', () => {
  it('accepts the right kind of file', () => {
    expect(validateMediaFile(file('lesson.mp4'), video)).toBeNull();
    expect(validateMediaFile(file('Lesson.MOV'), video)).toBeNull();
    expect(validateMediaFile(file('cover.png'), image)).toBeNull();
  });

  it('explains a wrong file type', () => {
    expect(validateMediaFile(file('notes.pdf'), video)).toContain('MP4, WEBM, MOV');
    expect(validateMediaFile(file('lesson.mp4'), image)).toContain('JPG');
  });

  it('follows limits an administrator changed', () => {
    const strict = { extensions: ['png'], maxMegabytes: 2 };
    expect(validateMediaFile(file('a.jpg'), strict)).toContain('PNG');
    expect(validateMediaFile(file('a.png', 3), strict)).toContain('2 MB');
    expect(validateMediaFile(file('a.png', 1), strict)).toBeNull();
  });

  it('refuses files over the size limit and says what the limit is', () => {
    expect(validateMediaFile(file('big.jpg', 11), image)).toContain('10 MB');
    expect(validateMediaFile(file('big.mp4', 101), video)).toContain('100 MB');
  });
});

describe('videoPosterUrl', () => {
  it('turns a Cloudinary video address into a picture taken one second in', () => {
    expect(
      videoPosterUrl('https://res.cloudinary.com/demo/video/upload/v1/learnonline/videos/a.mp4'),
    ).toBe(
      'https://res.cloudinary.com/demo/video/upload/so_1,w_640,h_360,c_fill,q_auto/v1/learnonline/videos/a.jpg',
    );
  });

  it('returns null for addresses that are not Cloudinary videos', () => {
    expect(videoPosterUrl('https://example.com/video.mp4')).toBeNull();
    expect(videoPosterUrl('https://res.cloudinary.com/demo/image/upload/v1/a.jpg')).toBeNull();
  });
});
