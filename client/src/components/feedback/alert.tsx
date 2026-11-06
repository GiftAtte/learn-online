import { cva, type VariantProps } from 'class-variance-authority';
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/core/lib/cn';

const alertStyles = cva('flex gap-3 rounded-card p-4', {
  variants: {
    tone: {
      info: 'bg-info-soft text-info',
      success: 'bg-success-soft text-success',
      warning: 'bg-warning-soft text-warning',
      danger: 'bg-danger-soft text-danger',
    },
  },
  defaultVariants: { tone: 'info' },
});

const ICONS: Record<NonNullable<VariantProps<typeof alertStyles>['tone']>, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
};

interface AlertProps extends VariantProps<typeof alertStyles> {
  title: string;
  children?: ReactNode;
  /** Optional call to action, e.g. a retry button. */
  action?: ReactNode;
  className?: string;
}

/**
 * Inline message that stays on the page (form-level errors, notices). Use `notify` for
 * transient feedback after an action, and Alert for information the person needs to keep seeing.
 */
export function Alert({ tone = 'info', title, children, action, className }: AlertProps) {
  const Icon = ICONS[tone ?? 'info'];
  return (
    <div
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      className={cn(alertStyles({ tone }), className)}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-medium">{title}</p>
        {children && <div className="text-sm text-ink-soft">{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
