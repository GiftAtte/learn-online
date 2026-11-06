import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/core/lib/cn';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** What the person can do next, usually a Button. */
  action?: ReactNode;
  className?: string;
}

/** An empty screen is an invitation: say what belongs here and offer the next step. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-card border border-dashed border-line-strong px-6 py-14 text-center',
        className,
      )}
    >
      {Icon && <Icon className="size-8 text-spruce-400" strokeWidth={1.6} aria-hidden />}
      <div className="flex max-w-sm flex-col gap-1">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        {description && <p className="text-[0.95rem] text-ink-soft">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
