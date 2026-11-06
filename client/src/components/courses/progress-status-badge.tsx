import { Check, CircleDashed, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CourseStatus } from '@/core/types/course.types';

const CONFIG = {
  NOT_STARTED: { tone: 'neutral', label: 'Not started', Icon: CircleDashed },
  IN_PROGRESS: { tone: 'progress', label: 'In progress', Icon: Pencil },
  COMPLETED: { tone: 'success', label: 'Completed', Icon: Check },
} as const;

/** The one badge that describes learning status, for both courses and lessons. */
export function ProgressStatusBadge({ status }: { status: CourseStatus }) {
  const { tone, label, Icon } = CONFIG[status];
  return (
    <Badge tone={tone} icon={<Icon className="size-3.5" aria-hidden />}>
      {label}
    </Badge>
  );
}
