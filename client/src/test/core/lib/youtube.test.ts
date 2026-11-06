import { parseYouTubeId, youTubeIdOf, youTubeThumbnail, youTubeUrl } from '@/core/lib/youtube';

const ID = 'dQw4w9WgXcQ';

describe('parseYouTubeId', () => {
  it('accepts the bare video ID', () => {
    expect(parseYouTubeId(ID)).toBe(ID);
    expect(parseYouTubeId(`  ${ID}  `)).toBe(ID);
    expect(parseYouTubeId('a_b-c1234AB')).toBe('a_b-c1234AB');
  });

  it('finds the ID in every usual kind of link', () => {
    const links = [
      `https://www.youtube.com/watch?v=${ID}`,
      `https://www.youtube.com/watch?v=${ID}&t=42s&list=PL123`,
      `https://youtube.com/watch?feature=share&v=${ID}`,
      `https://m.youtube.com/watch?v=${ID}`,
      `https://youtu.be/${ID}`,
      `https://youtu.be/${ID}?si=abc`,
      `https://www.youtube.com/embed/${ID}`,
      `https://www.youtube-nocookie.com/embed/${ID}`,
      `https://www.youtube.com/shorts/${ID}`,
      `https://www.youtube.com/live/${ID}?feature=share`,
      `www.youtube.com/watch?v=${ID}`,
      `youtu.be/${ID}`,
    ];
    for (const link of links) expect(parseYouTubeId(link), link).toBe(ID);
  });

  it('refuses anything that is not a YouTube video', () => {
    for (const text of [
      '',
      '   ',
      'hello',
      'tooshort',
      'waytoolongtobeanid',
      'https://example.com/watch?v=dQw4w9WgXcQ',
      'https://vimeo.com/123456789',
      'https://www.youtube.com/channel/UC1234567890',
      'https://www.youtube.com/watch?v=short',
      'https://notyoutube.com/embed/dQw4w9WgXcQ',
      'javascript:alert(1)',
    ]) {
      expect(parseYouTubeId(text), text).toBeNull();
    }
  });
});

describe('YouTube addresses', () => {
  it('stores one standard address and reads the ID back from it', () => {
    expect(youTubeUrl(ID)).toBe(`https://www.youtube.com/watch?v=${ID}`);
    expect(youTubeIdOf(youTubeUrl(ID))).toBe(ID);
    expect(youTubeThumbnail(ID)).toBe(`https://i.ytimg.com/vi/${ID}/hqdefault.jpg`);
  });

  it('does not mistake a normal video link for a YouTube lesson', () => {
    expect(
      youTubeIdOf('https://res.cloudinary.com/demo/video/upload/v1/learnonline/videos/a.mp4'),
    ).toBeNull();
    expect(youTubeIdOf('https://example.com/lesson.mp4')).toBeNull();
    // A bare 11-character word is only an ID in the admin form, never a stored address.
    expect(youTubeIdOf(ID)).toBeNull();
  });
});
