import { BookOpen } from 'lucide-react';
import { useState } from 'react';

/**
 * A small square course image for table rows. Falls back to a book tile when the course has no
 * image or the image fails to load, so rows keep a consistent shape.
 */
export function CourseThumb({ src }: { src?: string | null }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[0.7rem] bg-spruce-100 text-spruce-400">
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <BookOpen className="size-5" strokeWidth={1.6} aria-hidden />
      )}
    </span>
  );
}
