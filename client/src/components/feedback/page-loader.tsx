import { Spinner } from '@/components/ui/spinner';

/** Full-area loading indicator for route-level waits (e.g. checking the session). */
export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex min-h-[40dvh] flex-col items-center justify-center gap-3 text-ink-faint"
    >
      <Spinner className="size-6 text-spruce-500" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
