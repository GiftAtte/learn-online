import { Badge } from '@/components/ui/badge';

/** A small coloured dot that leads a status label. */
const Dot = () => <span className="size-1.5 rounded-full bg-current" aria-hidden />;

/** "Published" or "Draft", with a status dot. The one place this status is drawn. */
export function PublishedBadge({ published }: { published: boolean }) {
  return published ? (
    <Badge tone="success" icon={<Dot />}>
      Published
    </Badge>
  ) : (
    <Badge tone="warning" icon={<Dot />}>
      Draft
    </Badge>
  );
}
