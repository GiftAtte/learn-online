import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { Toaster as Sonner } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

/**
 * The single notification surface. Toasts are dark "chalkboard" panels so they stand apart from the
 * light page and read the same everywhere. Raise them through `notify` (lib/notify.ts), never directly.
 */
export function Toaster() {
  return (
    <Sonner
      position="top-right"
      visibleToasts={3}
      offset={{ top: 16, right: 16 }}
      mobileOffset={{ top: 12, left: 12, right: 12 }}
      icons={{
        success: <CircleCheck className="size-5 text-[#86d6ad]" aria-hidden />,
        error: <CircleAlert className="size-5 text-[#ffa090]" aria-hidden />,
        warning: <TriangleAlert className="size-5 text-pencil-400" aria-hidden />,
        info: <Info className="size-5 text-[#a9c8f2]" aria-hidden />,
        loading: <Spinner className="size-5 text-spruce-200" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-full items-start gap-3 rounded-card bg-spruce-900 px-4 py-3.5 text-white shadow-overlay sm:w-[22rem]',
          icon: 'mt-0.5 shrink-0',
          content: 'flex min-w-0 flex-col gap-0.5',
          title: 'text-[0.95rem] leading-snug font-medium',
          description: 'text-sm leading-snug text-spruce-200',
          actionButton:
            'ml-auto shrink-0 cursor-pointer rounded-control bg-pencil-500 px-3 py-1.5 text-sm font-medium text-spruce-950',
        },
      }}
    />
  );
}
