import { cn } from '@/core/lib/cn';

/** Brand mark: an "L" with a pencil stroke underneath. */
export function LogoMark({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8', className)} aria-hidden>
      {/* On dark backgrounds the tile is a lighter green so it still reads as a tile. */}
      <rect width="32" height="32" rx="8" fill={inverted ? '#2A5B4E' : '#1F4D43'} />
      <path d="M8 21.5h16" stroke="#F2B93B" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M10.5 8.5v8.2c0 1.2 1 2.1 2.2 2.1h.8"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** Mark plus wordmark. Set `inverted` on dark backgrounds such as the sidebar. */
export function Logo({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', inverted && 'text-white', className)}>
      <LogoMark inverted={inverted} />
      <span className="font-display text-xl font-semibold tracking-tight">LearnOnline</span>
    </span>
  );
}
