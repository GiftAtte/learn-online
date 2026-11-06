import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Teach tailwind-merge about our design tokens so conflicting classes
// (e.g. `text-ink` vs `text-ink-soft`, `rounded-card` vs `rounded-control`) resolve correctly.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        'canvas',
        'surface',
        'sunken',
        'ink',
        'ink-soft',
        'ink-faint',
        'line',
        'line-strong',
        'brand',
        'brand-hover',
        'on-brand',
        'success',
        'success-soft',
        'warning',
        'warning-soft',
        'danger',
        'danger-hover',
        'danger-soft',
        'info',
        'info-soft',
        'spruce-50',
        'spruce-100',
        'spruce-200',
        'spruce-300',
        'spruce-400',
        'spruce-500',
        'spruce-600',
        'spruce-700',
        'spruce-800',
        'spruce-900',
        'spruce-950',
        'pencil-50',
        'pencil-100',
        'pencil-300',
        'pencil-400',
        'pencil-500',
        'pencil-600',
        'pencil-700',
      ],
      radius: ['control', 'card', 'stage'],
      shadow: ['card', 'lift', 'overlay'],
    },
  },
});

/** Merges class names and resolves Tailwind conflicts (last one wins). */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
