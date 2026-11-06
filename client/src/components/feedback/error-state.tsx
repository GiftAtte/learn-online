import { CloudOff, SearchX, ShieldAlert, TriangleAlert, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiError, getErrorMessage } from '@/core/api/error';
import { MESSAGES } from '@/core/lib/messages';
import { cn } from '@/core/lib/cn';

interface ErrorStateProps {
  error: unknown;
  /** Shown as a "Try again" button when provided. */
  onRetry?: () => void;
  className?: string;
}

const describe = (error: unknown): { icon: LucideIcon; title: string } => {
  if (error instanceof ApiError) {
    if (error.isNetwork) return { icon: CloudOff, title: 'You’re offline' };
    if (error.isNotFound) return { icon: SearchX, title: 'Not found' };
    if (error.isForbidden || error.isUnauthorized) return { icon: ShieldAlert, title: 'No access' };
  }
  return { icon: TriangleAlert, title: 'Something went wrong' };
};

/** Full-section error display. Explains what happened (from the API) and how to recover. */
export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  const { icon: Icon, title } = describe(error);
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-3 rounded-card bg-surface px-6 py-14 text-center shadow-card',
        className,
      )}
    >
      <Icon className="size-8 text-danger" strokeWidth={1.6} aria-hidden />
      <div className="flex max-w-sm flex-col gap-1">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        <p className="text-[0.95rem] text-ink-soft">{getErrorMessage(error)}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-2">
          {MESSAGES.generic.retry}
        </Button>
      )}
    </div>
  );
}
