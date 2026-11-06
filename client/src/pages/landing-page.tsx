import { BarChart3, BookOpen, History, Library, PlayCircle, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from '@/core/hooks/queries/use-auth';
import { PATHS } from '@/router/paths';

/** The three steps of using the platform, shown under the headline. */
const STEPS: { title: string; text: string; icon: LucideIcon }[] = [
  {
    title: 'Browse',
    text: 'Look through the catalog by category and open any course to see its lessons. No account needed.',
    icon: BookOpen,
  },
  {
    title: 'Enroll and watch',
    text: 'Create a free account, enroll in a course and watch its short video lessons in order.',
    icon: PlayCircle,
  },
  {
    title: 'Track your progress',
    text: 'Finished lessons are marked for you, and your dashboard shows how far you are in every course.',
    icon: BarChart3,
  },
];

/** What a learner gets. */
const FEATURES: { title: string; text: string; icon: LucideIcon }[] = [
  {
    title: 'Pick up where you left off',
    text: 'The player remembers your position in every lesson and resumes from there on any device.',
    icon: History,
  },
  {
    title: 'Short, focused lessons',
    text: 'Each course is split into video lessons you can finish between everything else.',
    icon: Library,
  },
  {
    title: 'Your account stays yours',
    text: 'Passwords are hashed, your session cookie is hidden from scripts, and you can sign out everywhere.',
    icon: ShieldCheck,
  },
];

/**
 * Route "/": the first page a visitor sees. It explains what LearnOnline is before asking anyone to
 * sign up. People who are already signed in get links into the app instead of the sign-up buttons.
 */
export default function LandingPage() {
  const { user } = useSession();

  return (
    <div className="flex flex-col gap-16 sm:gap-24">
      {/* Headline and the main call to action */}
      <section className="flex flex-col items-start gap-6 pt-2 sm:pt-8">
        <p className="rounded-full bg-pencil-100 px-3 py-1 text-sm font-medium text-pencil-700">
          Online learning, one lesson at a time
        </p>
        <h1 className="max-w-3xl font-display text-4xl font-bold tracking-tight text-balance sm:text-6xl">
          Learn new skills at your own pace
        </h1>
        <p className="max-w-2xl text-lg text-ink-soft">
          LearnOnline is a library of video courses. Browse the catalog, enroll for free, watch
          lessons in order and see your progress grow. Come back any time and continue exactly where
          you stopped.
        </p>
        <div className="flex flex-wrap gap-3">
          {user ? (
            <>
              <Button asChild size="lg">
                <Link to={PATHS.learner.catalog}>Go to the catalog</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to={PATHS.learner.myLearning}>My learning</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="lg">
                <Link to={PATHS.signUp}>Create a free account</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to={PATHS.learner.catalog}>Browse the catalog</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-it-works" className="flex flex-col gap-6">
        <h2 id="how-it-works" className="text-2xl font-semibold tracking-tight">
          How it works
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ title, text, icon: Icon }, index) => (
            <li key={title}>
              <Card className="flex h-full flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-spruce-100 text-spruce-700">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="text-sm font-medium text-ink-faint">Step {index + 1}</span>
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-ink-soft">{text}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Why learners like it */}
      <section aria-labelledby="why" className="flex flex-col gap-6">
        <h2 id="why" className="text-2xl font-semibold tracking-tight">
          Made for learning, not for scrolling
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map(({ title, text, icon: Icon }) => (
            <Card key={title} className="flex flex-col gap-3">
              <Icon className="size-6 text-spruce-600" aria-hidden />
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-ink-soft">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* For the people who run the courses */}
      <section
        aria-labelledby="for-teams"
        className="flex flex-col gap-3 rounded-card bg-spruce-950 p-6 text-white sm:p-10"
      >
        <h2 id="for-teams" className="text-2xl font-semibold tracking-tight">
          Running a course?
        </h2>
        <p className="max-w-2xl text-spruce-100">
          Administrators create courses and categories, add and reorder lessons, publish when ready,
          and see how every learner is getting on, lesson by lesson.
        </p>
      </section>

      {/* Closing call to action (guests only) */}
      {!user && (
        <section className="flex flex-col items-start gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">Ready to start?</h2>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="accent">
              <Link to={PATHS.signUp}>Sign up, it is free</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link to={PATHS.signIn}>I already have an account</Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
