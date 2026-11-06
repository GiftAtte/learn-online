import { Skeleton } from '@/components/ui/skeleton';

export function LessonListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ol role="status" aria-label="Loading lessons" className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex gap-3">
          <Skeleton className="mt-3 size-8 rounded-full" />
          <Skeleton className="h-[4.25rem] flex-1 rounded-card" />
        </li>
      ))}
    </ol>
  );
}
