import type { CSSProperties } from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FeatureGrid } from '@/components/landing/feature-grid';
import { HeroPreview } from '@/components/landing/hero-preview';
import { HowItWorks } from '@/components/landing/how-it-works';
import { PublicFooter } from '@/components/layout/public-footer';
import { PublicHeader } from '@/components/layout/public-header';
import { Button } from '@/components/ui/button';
import { useSession } from '@/core/hooks/queries/use-auth';
import { PATHS } from '@/router/paths';

/** Short promises under the main buttons. */
const PROMISES = ['Free to join', 'No card needed', 'Works on phone and computer'];

/** Delay (in ms) for the hero text lines, so they arrive one after another. */
const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;

/**
 * Route "/": the first page a visitor sees. It stands on its own (no app menu): it says what
 * LearnOnline is, shows the product at work, explains the steps, and asks people to sign up.
 * People who are already signed in get links into the app instead of the sign-up buttons.
 */
export default function LandingPage() {
  const { user } = useSession();

  return (
    <div className="min-h-dvh bg-canvas">
      <PublicHeader showSections />

      <main>
        {/* Hero: the promise on the left, the product at work on the right */}
        <section className="lp-hero-bg relative overflow-hidden text-white">
          <div aria-hidden className="lp-dots absolute inset-0" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pt-16 pb-24 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-24 lg:pb-32">
            <div className="flex flex-col items-start gap-6">
              <h1
                className="lp-rise font-display text-5xl leading-[1.02] font-bold tracking-tight text-balance sm:text-6xl lg:text-7xl"
                style={delay(0)}
              >
                Video courses you can actually finish
              </h1>
              <p className="lp-rise max-w-xl text-lg text-spruce-100" style={delay(120)}>
                LearnOnline gives you short lessons, a player that remembers where you stopped, and
                a dashboard that shows how far you have come.
              </p>

              <div className="lp-rise flex flex-wrap gap-3" style={delay(240)}>
                {user ? (
                  <>
                    <Button asChild size="lg" variant="accent">
                      <Link to={PATHS.learner.catalog}>Go to the catalog</Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="ghost"
                      className="text-white hover:bg-white/10 hover:text-white"
                    >
                      <Link to={PATHS.learner.myLearning}>My learning</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild size="lg" variant="accent">
                      <Link to={PATHS.signUp}>Create a free account</Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="ghost"
                      className="text-white hover:bg-white/10 hover:text-white"
                    >
                      <Link to={PATHS.learner.catalog}>Browse courses</Link>
                    </Button>
                  </>
                )}
              </div>

              <ul
                className="lp-rise flex flex-wrap gap-x-6 gap-y-2 text-sm text-spruce-100"
                style={delay(360)}
              >
                {PROMISES.map((text) => (
                  <li key={text} className="flex items-center gap-2">
                    <Check className="size-4 text-pencil-500" strokeWidth={3} aria-hidden />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <HeroPreview />
          </div>
        </section>

        {/* The steps */}
        <section
          id="how-it-works"
          aria-labelledby="how-title"
          className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28"
        >
          <h2 id="how-title" className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            From first visit to finished course in four steps
          </h2>
          <div className="mt-12">
            <HowItWorks />
          </div>
        </section>

        {/* What you get */}
        <section
          id="features"
          aria-labelledby="features-title"
          className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28"
        >
          <h2
            id="features-title"
            className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Made for learning, not for scrolling
          </h2>
          <div className="mt-12">
            <FeatureGrid />
          </div>
        </section>

        {/* Closing call to action */}
        <section className="px-4 pb-20 sm:px-6 sm:pb-28">
          <div className="lp-hero-bg relative mx-auto flex max-w-6xl flex-col items-start gap-6 overflow-hidden rounded-[1.75rem] p-8 text-white sm:p-14">
            <div aria-hidden className="lp-dots absolute inset-0" />
            <h2 className="relative max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
              {user ? 'Pick up your next lesson' : 'Pick a course and start today'}
            </h2>
            <p className="relative max-w-xl text-spruce-100">
              {user
                ? 'Your progress is saved. Open the catalog to continue or start something new.'
                : 'Create an account in under a minute. The first lesson is one click away.'}
            </p>
            <div className="relative flex flex-wrap gap-3">
              {user ? (
                <Button asChild size="lg" variant="accent">
                  <Link to={PATHS.learner.catalog}>Go to the catalog</Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" variant="accent">
                    <Link to={PATHS.signUp}>Create a free account</Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="ghost"
                    className="text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link to={PATHS.signIn}>I already have an account</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
