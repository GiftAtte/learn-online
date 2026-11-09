import { useAppSettings } from '@/core/hooks/queries/use-settings';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo, LogoMark } from '@/components/layout/logo';
import { PATHS } from '@/router/paths';

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  /** The "other" action, e.g. "New here? Create an account". */
  footer: ReactNode;
}

/** Shared frame for sign-in and sign-up: a brand panel on large screens, a single card on phones. */
export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  const { appName, tagline } = useAppSettings();
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-spruce-900 p-12 text-white lg:flex">
        <Link to={PATHS.catalog} aria-label={`${appName} home`} className="w-fit text-white">
          <Logo />
        </Link>
        <div className="flex max-w-md flex-col gap-6">
          <p className="font-display text-4xl leading-[1.12] font-semibold tracking-tight">
            Short lessons. Real progress. Pick up right where you left off.
          </p>
          <div className="flex flex-col gap-2" aria-hidden>
            <div className="h-2 w-full rounded-full bg-white/15">
              <div className="h-full w-[62%] rounded-full bg-pencil-500" />
            </div>
            <p className="text-sm text-spruce-200">Your next lesson is always one tap away.</p>
          </div>
        </div>
        <p className="text-sm text-spruce-300">
          {tagline ?? 'Courses built for people with busy days.'}
        </p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="flex w-full max-w-md flex-col gap-8">
          <Link to={PATHS.catalog} aria-label={`${appName} home`} className="w-fit lg:hidden">
            <LogoMark className="size-10" />
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
            <p className="text-[1.0625rem] text-ink-soft">{description}</p>
          </div>
          {children}
          <p className="text-[0.95rem] text-ink-soft">{footer}</p>
        </div>
      </main>
    </div>
  );
}
