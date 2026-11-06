import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CourseContents } from '@/components/courses/course-contents';
import { Logo } from '@/components/layout/logo';
import { PATHS } from '@/router/paths';

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  /** The "other" action, e.g. "New here? Create an account". */
  footer: ReactNode;
}

/**
 * Shared frame for sign-in and sign-up. On large screens the left side is the front of the library:
 * a table of contents of the real courses. On phones only the form is shown.
 */
export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden flex-col justify-between bg-spruce-950 p-12 text-white lg:flex xl:p-16">
        <Link to={PATHS.home} aria-label="LearnOnline home" className="w-fit">
          <Logo inverted />
        </Link>

        <div className="flex max-w-lg flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-3xl font-semibold">What you can learn here</h2>
            <p className="text-spruce-200">
              Every course is a set of short video lessons, free to join.
            </p>
          </div>
          <CourseContents />
        </div>

        <p className="text-sm text-spruce-300">
          Your place in every lesson is saved, so you can stop and come back.
        </p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="flex w-full max-w-md flex-col gap-8">
          <Link to={PATHS.home} aria-label="LearnOnline home" className="w-fit text-ink lg:hidden">
            <Logo />
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-4xl font-semibold sm:text-[2.75rem]">{title}</h1>
            <p className="text-[1.0625rem] text-ink-soft">{description}</p>
          </div>
          {children}
          <p className="text-[0.95rem] text-ink-soft">{footer}</p>
        </div>
      </main>
    </div>
  );
}
