import { useEffect, useRef, useState } from 'react';

/**
 * Tells you when an element has scrolled into view (once). Used to start an animation only when
 * the person can actually see it. Where the browser cannot observe (old browsers, tests), it
 * reports "in view" straight away so nothing stays hidden or empty.
 *
 *   const [ref, inView] = useInView<HTMLDivElement>();
 */
export function useInView<T extends Element>(threshold = 0.35) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect(); // once is enough: the animation does not replay
        }
      },
      { threshold },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}
