import { BookOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress';
import { cn } from '@/core/lib/cn';

interface AdminCourseCardProps {
  title: string;
  /** Where the card leads (the course's page). */
  to: string;
  category: string;
  thumbnailUrl?: string | null;
  description?: string;
  /** Shown as a "Draft" badge on the picture when false. */
  published: boolean;
  /** Small facts under the text, each a label and a value ("Lessons", "3"). */
  facts?: { label: string; value: ReactNode }[];
  /** A progress line with a caption, e.g. the average progress of the learners. */
  progress?: { value: number; label: string };
  /** The bottom strip: a status badge, a menu of actions, or both. Clicks here do not open the card. */
  footer?: ReactNode;
  className?: string;
}

/**
 * A course as a full card for administrators on a phone: the large cover with its category, then the
 * title, description and facts. It is the same card the catalog shows learners (one per row), so a phone
 * never squeezes a course into a corner of a table row. The whole card opens the course through its title
 * link; anything in the footer (such as the actions menu) sits above that and stays clickable.
 */
export function AdminCourseCard({
  title,
  to,
  category,
  thumbnailUrl,
  description,
  published,
  facts = [],
  progress,
  footer,
  className,
}: AdminCourseCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = thumbnailUrl && !imageFailed;

  return (
    <Card
      interactive
      padding="none"
      className={cn('group/card relative flex h-full flex-col overflow-hidden', className)}
    >
      <div className="relative aspect-[16/10] bg-spruce-100">
        {showImage ? (
          <img
            src={thumbnailUrl ?? undefined}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-spruce-400">
            <BookOpen className="size-12" strokeWidth={1.3} aria-hidden />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge tone="overlay">{category}</Badge>
          {!published && <Badge tone="warning">Draft</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="text-lg leading-snug font-semibold">
          <Link to={to} className="rounded-sm after:absolute after:inset-0 after:content-['']">
            {title}
          </Link>
        </h3>
        {description && <p className="line-clamp-2 text-[0.95rem] text-ink-soft">{description}</p>}

        {facts.length > 0 && (
          <dl className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-1 pt-1 text-sm text-ink-faint">
            {facts.map(({ label, value }) => (
              <div key={label} className="flex items-baseline gap-1.5">
                <dt>{label}</dt>
                <dd className="font-medium text-ink-soft tnum">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {progress && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm text-ink-faint">
              <span>{progress.label}</span>
              <span className="font-medium text-ink-soft tnum">{Math.round(progress.value)}%</span>
            </div>
            <ProgressBar value={progress.value} label={progress.label} size="sm" />
          </div>
        )}

        {footer && (
          <div className="relative z-10 flex items-center justify-between gap-3 border-t border-line pt-3">
            {footer}
          </div>
        )}
      </div>
    </Card>
  );
}
