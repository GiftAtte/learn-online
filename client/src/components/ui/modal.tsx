import { X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '@/core/lib/cn';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Action buttons, right-aligned (stacked on phones). */
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Standard dialog. On phones it rises from the bottom as a sheet; from `sm` up it is a centred panel.
 *
 * The modal itself never scrolls. It always shows at its natural height, and when it is taller than
 * the screen it is the page behind it (the full-screen layer) that scrolls. Focus is trapped, Escape
 * closes it, and focus returns to the trigger. Clicking outside does not close it, so nothing
 * somebody has typed is lost by accident.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 animate-fade-in bg-spruce-950/55 backdrop-blur-[2px]" />
        <Dialog.Content
          asChild
          onInteractOutside={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          {/* The scrolling layer: covers the screen and scrolls when the modal is taller than it. */}
          <div className="fixed inset-0 z-50 overflow-y-auto outline-none">
            {/* Clicks on the empty area fall through to the backdrop; only the panel is interactive. */}
            <div className="pointer-events-none flex min-h-full items-end justify-center sm:items-center sm:p-6">
              <div
                className={cn(
                  'pointer-events-auto relative w-full bg-surface shadow-overlay',
                  'animate-sheet rounded-t-stage safe-bottom sm:animate-rise sm:rounded-stage',
                  size === 'sm' && 'sm:max-w-sm',
                  size === 'md' && 'sm:max-w-md',
                  size === 'lg' && 'sm:max-w-2xl',
                )}
              >
                <div
                  className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line-strong sm:hidden"
                  aria-hidden
                />
                <div className="flex items-start justify-between gap-4 px-5 pt-4 sm:px-6 sm:pt-6">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <Dialog.Title className="font-display text-xl font-semibold tracking-tight">
                      {title}
                    </Dialog.Title>
                    {description ? (
                      <Dialog.Description className="text-[0.95rem] text-ink-soft">
                        {description}
                      </Dialog.Description>
                    ) : (
                      <Dialog.Description className="sr-only">{title}</Dialog.Description>
                    )}
                  </div>
                  <Dialog.Close
                    aria-label="Close"
                    className="-mt-1 -mr-2 inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-sunken hover:text-ink"
                  >
                    <X className="size-5" aria-hidden />
                  </Dialog.Close>
                </div>
                {children && <div className="px-5 py-4 sm:px-6">{children}</div>}
                {footer && (
                  <div className="flex flex-col-reverse gap-2 px-5 pt-2 pb-5 sm:flex-row sm:justify-end sm:px-6 sm:pb-6">
                    {footer}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
